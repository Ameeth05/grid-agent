#!/usr/bin/env python3
"""
GridAgent Server - SSE Version (Much easier to debug than WebSocket!)

Architecture:
- POST /query - Submit a query, returns immediately
- GET /events - Server-Sent Events stream for responses
- GET /health - Health check

Test with curl:
  curl -X POST http://localhost:8081/query -H "Content-Type: application/json" -d '{"content":"Hello"}'
  curl -N http://localhost:8081/events
"""

import asyncio
import json
import os
import base64
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import uvicorn

# Claude Agent SDK - the correct way to build agents
from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    tool,
    create_sdk_mcp_server,
    AssistantMessage,
    ResultMessage,
    TextBlock,
    ToolUseBlock,
    ToolResultBlock,
)

# Configuration
# IMPORTANT: Port 8080 is exposed in e2b.toml and Dockerfile - keep in sync!
PORT = int(os.getenv("GRIDAGENT_PORT", "8080"))
MODEL = os.getenv("GRIDAGENT_MODEL", "claude-sonnet-4-20250514")

# Local development mode
LOCAL_DEV = os.getenv("LOCAL_DEV", "false").lower() == "true"

# Filesystem layout
if LOCAL_DEV:
    _project_root = Path(__file__).parent.parent
    SYSTEM_DIR = Path(os.getenv("GRIDAGENT_DATA_DIR", str(_project_root / "Data")))
    USER_DIR = Path(os.getenv("GRIDAGENT_USER_DIR", str(_project_root / "local_user")))
    print(f"LOCAL_DEV mode: SYSTEM_DIR={SYSTEM_DIR}, USER_DIR={USER_DIR}")
else:
    SYSTEM_DIR = Path("/system")
    USER_DIR = Path("/user")

# Global state
sessions: dict[str, ClaudeSDKClient] = {}
event_queues: dict[str, asyncio.Queue] = {}  # session_id -> event queue
current_session_id = "default"

# =============================================================================
# SYSTEM PROMPT
# =============================================================================

def get_system_prompt() -> str:
    system_dir = str(SYSTEM_DIR)
    user_dir = str(USER_DIR)

    return f"""You are GridAgent, an expert AI research analyst specializing in US electrical grid infrastructure, particularly the PJM Interconnection region.

## Your Expertise
- PJM interconnection queue analysis and project tracking
- FERC Order 2023 cluster study processes
- Transmission upgrade cost allocation
- Generation resource types: Solar, Storage, Wind, Natural Gas, Nuclear

## Your Environment
- `{system_dir}` (read-only): Pre-loaded data files
- `{user_dir}` (read-write): User's working directory

## Tools Available
- `Read` - Read file contents
- `Write` - Write files to {user_dir}
- `Edit` - Edit existing files
- `Bash` - Execute shell commands
- `Grep` - Search file contents
- `Glob` - Find files by pattern

## Response Style
- Be concise but thorough
- Always cite your data sources (file paths)
- Use tables and structured formats for clarity
"""


# =============================================================================
# CUSTOM TOOLS
# =============================================================================

@tool(
    "analyze_queue",
    "Quickly analyze PJM interconnection queue data",
    {"metric": str, "filters": dict}
)
async def analyze_queue(args: dict[str, Any]) -> dict[str, Any]:
    metric = args.get("metric", "capacity_by_state")
    filters = args.get("filters", {})
    queue_path = SYSTEM_DIR / "Interconnection Queue"
    return {
        "content": [{
            "type": "text",
            "text": f"Queue analysis: {metric}\nFilters: {json.dumps(filters)}\n"
                   f"Use Read tool to load: {queue_path}/*.csv"
        }]
    }


@tool(
    "calculate_costs",
    "Estimate transmission upgrade costs",
    {"capacity_mw": float, "voltage_kv": float, "distance_miles": float, "upgrade_type": str}
)
async def calculate_costs(args: dict[str, Any]) -> dict[str, Any]:
    capacity = args.get("capacity_mw", 100)
    voltage = args.get("voltage_kv", 230)
    distance = args.get("distance_miles", 10)
    upgrade_type = args.get("upgrade_type", "new_line")

    base_costs = {"new_line": 3_000_000, "reconductor": 1_500_000, "substation": 50_000_000}
    base = base_costs.get(upgrade_type, 2_000_000)

    if upgrade_type in ["new_line", "reconductor"]:
        voltage_factor = (voltage / 230) ** 0.5
        capacity_factor = (capacity / 500) ** 0.3
        estimated_cost = base * distance * voltage_factor * capacity_factor
    else:
        capacity_factor = (capacity / 500) ** 0.5
        estimated_cost = base * capacity_factor

    return {
        "content": [{
            "type": "text",
            "text": f"**Cost Estimate**: ${estimated_cost:,.0f} for {upgrade_type}"
        }]
    }


grid_tools_server = create_sdk_mcp_server(
    name="grid_tools",
    version="1.0.0",
    tools=[analyze_queue, calculate_costs]
)


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class QueryRequest(BaseModel):
    content: str
    session_id: str = "default"
    files: list[dict] | None = None  # Optional file uploads


class QueryResponse(BaseModel):
    status: str
    session_id: str
    message: str


# =============================================================================
# FASTAPI APP
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    USER_DIR.mkdir(parents=True, exist_ok=True)
    (USER_DIR / "uploads").mkdir(exist_ok=True)
    (USER_DIR / "results").mkdir(exist_ok=True)
    print(f"GridAgent SSE Server starting...")
    print(f"Model: {MODEL}")
    print(f"System dir: {SYSTEM_DIR}")
    print(f"User dir: {USER_DIR}")
    yield
    # Shutdown
    for client in sessions.values():
        try:
            await client.disconnect()
        except:
            pass


app = FastAPI(title="GridAgent SSE Server", lifespan=lifespan)

# CORS - allow all for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL}


@app.post("/query", response_model=QueryResponse)
async def submit_query(request: QueryRequest):
    """Submit a query. Response will stream via /events endpoint."""
    global current_session_id

    session_id = request.session_id
    current_session_id = session_id

    # Create event queue for this session
    if session_id not in event_queues:
        event_queues[session_id] = asyncio.Queue()

    # Handle file uploads if present
    uploaded_files = []
    if request.files:
        for file_data in request.files:
            filename = file_data.get("filename", "unnamed_file")
            content_b64 = file_data.get("content", "")
            try:
                file_bytes = base64.b64decode(content_b64)
                safe_filename = Path(filename).name
                upload_path = USER_DIR / "uploads" / safe_filename
                upload_path.write_bytes(file_bytes)
                uploaded_files.append({"filename": safe_filename, "path": str(upload_path)})
            except Exception as e:
                print(f"Failed to upload {filename}: {e}")

    # Build query with file context
    enhanced_query = request.content
    if uploaded_files:
        file_context = "\n**Uploaded files:**\n"
        for f in uploaded_files:
            file_context += f"- `{f['path']}`\n"
        enhanced_query = file_context + "\n" + request.content

    # Start agent task in background
    asyncio.create_task(run_agent_task(enhanced_query, session_id))

    return QueryResponse(
        status="processing",
        session_id=session_id,
        message="Query submitted. Connect to /events to receive responses."
    )


async def run_agent_task(query: str, session_id: str):
    """Run the agent and push events to the queue."""
    queue = event_queues.get(session_id)
    if not queue:
        return

    try:
        options = ClaudeAgentOptions(
            system_prompt={
                "type": "preset",
                "preset": "claude_code",
                "append": get_system_prompt()
            },
            allowed_tools=[
                "Read", "Write", "Edit", "Bash", "Grep", "Glob",
                "mcp__grid_tools__analyze_queue",
                "mcp__grid_tools__calculate_costs"
            ],
            mcp_servers={"grid_tools": grid_tools_server},
            permission_mode="acceptEdits",
            cwd=str(USER_DIR),
            add_dirs=[str(SYSTEM_DIR)],
            model=MODEL,
        )

        if session_id in sessions:
            client = sessions[session_id]
            await client.query(query)
        else:
            client = ClaudeSDKClient(options=options)
            await client.connect()
            sessions[session_id] = client
            await client.query(query)

        async for message in client.receive_response():
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        await queue.put({
                            "type": "text",
                            "content": block.text
                        })
                    elif isinstance(block, ToolUseBlock):
                        await queue.put({
                            "type": "tool_start",
                            "tool": block.name,
                            "args": block.input
                        })
                    elif isinstance(block, ToolResultBlock):
                        await queue.put({
                            "type": "tool_result",
                            "tool": block.tool_use_id,
                            "result": str(block.content)[:500]  # Truncate long results
                        })

            elif isinstance(message, ResultMessage):
                await queue.put({
                    "type": "done",
                    "token_usage": {
                        "input_tokens": message.usage.get("input_tokens", 0) if message.usage else 0,
                        "output_tokens": message.usage.get("output_tokens", 0) if message.usage else 0,
                        "total_tokens": (message.usage.get("input_tokens", 0) + message.usage.get("output_tokens", 0)) if message.usage else 0
                    }
                })

    except Exception as e:
        import traceback
        await queue.put({
            "type": "error",
            "message": str(e)
        })
        print(f"Agent error: {traceback.format_exc()}")


async def event_generator(session_id: str) -> AsyncGenerator[str, None]:
    """Generate SSE events from the queue."""
    if session_id not in event_queues:
        event_queues[session_id] = asyncio.Queue()

    queue = event_queues[session_id]

    # Send initial connected event
    yield f"data: {json.dumps({'type': 'connected', 'session_id': session_id})}\n\n"

    while True:
        try:
            # Wait for event with timeout (sends keepalive)
            event = await asyncio.wait_for(queue.get(), timeout=30.0)
            yield f"data: {json.dumps(event)}\n\n"
            # Keep connection open for multiple queries - don't break on done/error

        except asyncio.TimeoutError:
            # Send keepalive comment
            yield ": keepalive\n\n"


@app.get("/events")
async def events(session_id: str = "default"):
    """
    Server-Sent Events endpoint for streaming responses.

    Test with: curl -N "http://localhost:8081/events?session_id=default"
    """
    return StreamingResponse(
        event_generator(session_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@app.get("/")
async def root():
    return {
        "name": "GridAgent SSE Server",
        "endpoints": {
            "POST /query": "Submit a query",
            "GET /events?session_id=X": "SSE stream for responses",
            "GET /health": "Health check"
        },
        "test": "curl -X POST http://localhost:8081/query -H 'Content-Type: application/json' -d '{\"content\":\"Hello\"}'"
    }


if __name__ == "__main__":
    print(f"\n{'='*60}")
    print("GridAgent SSE Server")
    print(f"{'='*60}")
    print(f"Running on http://localhost:{PORT}")
    print(f"\nTest commands:")
    print(f"  curl http://localhost:{PORT}/health")
    print(f"  curl -N http://localhost:{PORT}/events")
    print(f"  curl -X POST http://localhost:{PORT}/query -H 'Content-Type: application/json' -d '{{\"content\":\"What files are available?\"}}'")
    print(f"{'='*60}\n")

    uvicorn.run(app, host="0.0.0.0", port=PORT)
