#!/usr/bin/env python3
"""
GridAgent Server - AI Agent for US Electrical Grid Research

This server runs INSIDE the E2B sandbox using the Claude Agent SDK.
The SDK provides the same tools, agent loop, and context management that power Claude Code.

Architecture:
- WebSocket server on port 8080
- Claude Agent SDK for the agent loop (NOT raw Anthropic API)
- Built-in tools from SDK: Read, Edit, Write, Bash, Grep, Glob
- Custom tools via @tool decorator for grid-specific operations
- Streaming responses back to frontend
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from http import HTTPStatus

import websockets
from websockets.server import WebSocketServerProtocol
from websockets.http import Headers

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
WS_PORT = int(os.getenv("GRIDAGENT_WS_PORT", "8080"))
MODEL = os.getenv("GRIDAGENT_MODEL", "claude-sonnet-4-20250514")

# Local development mode - set LOCAL_DEV=true to use local file paths
LOCAL_DEV = os.getenv("LOCAL_DEV", "false").lower() == "true"

# Filesystem layout - different paths for local vs E2B sandbox
if LOCAL_DEV:
    # Local development: use project directories
    # Set GRIDAGENT_DATA_DIR to override the data directory path
    _project_root = Path(__file__).parent.parent  # GridAgent project root
    SYSTEM_DIR = Path(os.getenv("GRIDAGENT_DATA_DIR", str(_project_root / "Data")))
    USER_DIR = Path(os.getenv("GRIDAGENT_USER_DIR", str(_project_root / "local_user")))
    print(f"LOCAL_DEV mode: SYSTEM_DIR={SYSTEM_DIR}, USER_DIR={USER_DIR}")
else:
    # E2B Sandbox: standard paths
    SYSTEM_DIR = Path("/system")  # Read-only: skills, data, docs
    USER_DIR = Path("/user")      # Read-write: uploads, results

# Session storage (maps session_id -> ClaudeSDKClient)
sessions: dict[str, ClaudeSDKClient] = {}


# =============================================================================
# SYSTEM PROMPT
# =============================================================================

def get_system_prompt() -> str:
    """Generate system prompt with correct paths for current environment."""
    system_dir = str(SYSTEM_DIR)
    user_dir = str(USER_DIR)

    return f"""You are GridAgent, an expert AI research analyst specializing in US electrical grid infrastructure, particularly the PJM Interconnection region.

## Your Expertise
- PJM interconnection queue analysis and project tracking
- FERC Order 2023 cluster study processes (Phase 1, Phase 2, Phase 3)
- Transmission upgrade cost allocation
- Generation resource types: Solar, Storage, Wind, Natural Gas, Nuclear
- State-level renewable energy policies and their impact on grid development

## Your Environment
You are running with access to:
- `{system_dir}` (read-only): Pre-loaded data files and documentation
- `{user_dir}` (read-write): User's private working directory
  - `{user_dir}/uploads/`: Files uploaded by the user (PDF, Excel, etc.)
  - `{user_dir}/results/`: Analysis outputs you generate
  - `{user_dir}/memory.md`: User's profile, preferences, and onboarding notes (read this first!)

### Available Data
Use the Glob tool to discover available data files. Expected structure:
- `{system_dir}/data/Interconnection Queue/`: PJM queue data (CSV)
  - `CycleProjects-All.csv`: Full interconnection queue with project status
- `{system_dir}/data/Cluster Results/`: Phase study results (JSON)
  - `TC2 Phase 1/TC2_Phase1_structured.json`: Structured cluster data
- `{system_dir}/docs/Interconnection Manual/`: FERC manuals and regulatory documents (PDF)
  - `Manual 14A/m14a.pdf`: PJM Generation Interconnection manual

IMPORTANT: Always use Glob first to find exact file paths before reading!

### Key Data Schema (CycleProjects-All.csv)
| Column | Description |
|--------|-------------|
| Project ID | Unique identifier (e.g., AH1-665) |
| Cycle | Study cycle (TC1, TC2) |
| Stage | Current stage (Phase 1, Phase 2, Decision Point 1) |
| Status | Active, Withdrawn |
| Fuel | Solar, Storage, Natural Gas, Wind |
| MFO | Maximum Facility Output (MW) |
| MW Energy | Energy injection capability |
| MW Capacity | Capacity resource injection |
| State | Project location state |
| Transmission Owner | TO (Dominion, AEP, PECO, etc.) |

## Tools Available
You have powerful tools that execute LOCALLY (fast, no network latency):
1. `Read` - Read file contents (use for: loading data, reading docs)
2. `Write` - Write/create files in {user_dir} (use for: saving analysis results)
3. `Edit` - Edit existing files (use for: modifying analysis)
4. `Bash` - Execute shell commands (use for: data processing, Python scripts)
5. `Grep` - Search file contents (use for: finding specific data patterns)
6. `Glob` - Find files by pattern (use for: discovering data files)

Plus custom grid-specific tools:
- `analyze_queue` - Quick analysis of interconnection queue data
- `calculate_costs` - Estimate transmission upgrade costs

## Response Style
- Be concise but thorough
- Always cite your data sources (file paths)
- When analyzing data, show your methodology
- Provide actionable insights, not just raw data
- Use tables and structured formats for clarity

## Important
- Never fabricate data - only report what's in the files
- If data is missing or unclear, say so
- For large datasets, use sampling or aggregation
- Save important analysis results to {user_dir}/results/ for the user to reference
- Install any required Python packages using the Bash tool to use for answering query

## First Message Protocol
When starting a new conversation:
1. Use Glob to discover available data files in {system_dir}
2. Check if `{user_dir}/memory.md` exists - this contains user preferences and context
3. Check `{user_dir}/uploads/` for any files the user has uploaded
4. Greet the user by name if known from memory.md
5. Reference their projects/preferences if relevant to the query
"""


# =============================================================================
# CUSTOM TOOLS (Grid-specific via @tool decorator)
# =============================================================================

@tool(
    "analyze_queue",
    "Quickly analyze PJM interconnection queue data with common metrics",
    {
        "metric": str,  # "capacity_by_state", "capacity_by_fuel", "queue_depth", "withdrawal_rate"
        "filters": dict,  # Optional filters like {"state": "PA", "fuel_type": "Solar"}
    }
)
async def analyze_queue(args: dict[str, Any]) -> dict[str, Any]:
    """Analyze interconnection queue with pre-built analysis patterns."""
    metric = args.get("metric", "capacity_by_state")
    filters = args.get("filters", {})

    # This would normally use pandas to analyze the actual data
    # For now, return a structured response that guides further analysis
    queue_path = SYSTEM_DIR / "Interconnection Queue"
    return {
        "content": [{
            "type": "text",
            "text": f"Queue analysis requested: {metric}\n"
                   f"Filters: {json.dumps(filters)}\n\n"
                   f"To perform this analysis, use the Read tool to load:\n"
                   f"- {queue_path}/*.csv\n"
                   f"Then use Bash to run Python/pandas analysis."
        }]
    }


@tool(
    "calculate_costs",
    "Estimate transmission upgrade costs based on project parameters",
    {
        "capacity_mw": float,
        "voltage_kv": float,
        "distance_miles": float,
        "upgrade_type": str,  # "new_line", "reconductor", "substation"
    }
)
async def calculate_costs(args: dict[str, Any]) -> dict[str, Any]:
    """Calculate estimated transmission costs."""
    capacity = args.get("capacity_mw", 100)
    voltage = args.get("voltage_kv", 230)
    distance = args.get("distance_miles", 10)
    upgrade_type = args.get("upgrade_type", "new_line")

    # Simplified cost estimation (real implementation would use detailed models)
    base_costs = {
        "new_line": 3_000_000,  # $/mile for new transmission line
        "reconductor": 1_500_000,  # $/mile for reconductoring
        "substation": 50_000_000,  # base cost for substation upgrade
    }

    base = base_costs.get(upgrade_type, 2_000_000)

    if upgrade_type in ["new_line", "reconductor"]:
        # Adjust for voltage and capacity
        voltage_factor = (voltage / 230) ** 0.5
        capacity_factor = (capacity / 500) ** 0.3
        estimated_cost = base * distance * voltage_factor * capacity_factor
    else:
        capacity_factor = (capacity / 500) ** 0.5
        estimated_cost = base * capacity_factor

    return {
        "content": [{
            "type": "text",
            "text": f"**Cost Estimate for {upgrade_type.replace('_', ' ').title()}**\n\n"
                   f"| Parameter | Value |\n"
                   f"|-----------|-------|\n"
                   f"| Capacity | {capacity:,.0f} MW |\n"
                   f"| Voltage | {voltage:,.0f} kV |\n"
                   f"| Distance | {distance:,.1f} miles |\n"
                   f"| **Estimated Cost** | **${estimated_cost:,.0f}** |\n\n"
                   f"*Note: This is a rough estimate. Actual costs vary significantly based on terrain, "
                   f"permitting, land acquisition, and engineering requirements.*"
        }]
    }


# Create MCP server with custom tools
grid_tools_server = create_sdk_mcp_server(
    name="grid_tools",
    version="1.0.0",
    tools=[analyze_queue, calculate_costs]
)


# =============================================================================
# WEBSOCKET SERVER
# =============================================================================

async def handle_connection(websocket: WebSocketServerProtocol):
    """Handle a WebSocket connection from the frontend."""
    print(f">>> New WebSocket connection from {websocket.remote_address}")

    # Connection info from environment
    user_id = os.getenv("USER_ID", "anonymous")
    user_name = os.getenv("USER_NAME", "User")

    # Send welcome message
    print(f">>> Sending welcome message to {user_id}")
    await websocket.send(json.dumps({
        "type": "connected",
        "message": f"GridAgent ready for {user_name}",
        "user_id": user_id
    }))

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get("type")

                if msg_type == "query":
                    query_text = data.get("content", "")
                    session_id = data.get("session_id", f"{user_id}-default")

                    # Optional: files referenced in this query
                    # Frontend sends: {"type": "query", "content": "...", "referenced_files": ["report.pdf"]}
                    referenced_files = data.get("referenced_files", [])

                    if not query_text.strip():
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": "Empty query"
                        }))
                        continue

                    # Build enhanced query with file context if files are referenced
                    enhanced_query = query_text
                    if referenced_files:
                        file_context = "\n\n---\n**Referenced Files:**\n"
                        for fname in referenced_files:
                            file_path = USER_DIR / "uploads" / fname
                            if file_path.exists():
                                file_context += f"- `/user/uploads/{fname}` ({file_path.stat().st_size:,} bytes)\n"
                        file_context += "\nPlease read and analyze these files to answer the query.\n---\n\n"
                        enhanced_query = file_context + query_text

                    # Run agent using Claude Agent SDK
                    await run_agent(websocket, enhanced_query, session_id)

                elif msg_type == "new_session":
                    # Start a fresh session
                    session_id = data.get("session_id", f"{user_id}-{datetime.now().isoformat()}")

                    # Clean up old session if exists
                    if session_id in sessions:
                        old_client = sessions.pop(session_id)
                        try:
                            await old_client.disconnect()
                        except:
                            pass

                    await websocket.send(json.dumps({
                        "type": "session_created",
                        "session_id": session_id
                    }))

                elif msg_type == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))

                elif msg_type == "query_with_files":
                    # Combined: upload files + ask question in one message
                    # Frontend sends: {
                    #   "type": "query_with_files",
                    #   "content": "Analyze this RTEP data",
                    #   "files": [{"filename": "rtep.xlsx", "content": "<base64>"}],
                    #   "session_id": "..."
                    # }
                    query_text = data.get("content", "")
                    session_id = data.get("session_id", f"{user_id}-default")
                    files = data.get("files", [])

                    import base64
                    uploaded_files = []

                    # Save all files first
                    for file_data in files:
                        filename = file_data.get("filename", "unnamed_file")
                        content_b64 = file_data.get("content", "")
                        try:
                            file_bytes = base64.b64decode(content_b64)
                            safe_filename = Path(filename).name
                            upload_path = USER_DIR / "uploads" / safe_filename
                            upload_path.parent.mkdir(parents=True, exist_ok=True)
                            upload_path.write_bytes(file_bytes)
                            uploaded_files.append({
                                "filename": safe_filename,
                                "path": str(upload_path),
                                "size_bytes": len(file_bytes)
                            })
                        except Exception as e:
                            print(f"Failed to upload {filename}: {e}")

                    # Notify frontend of uploads
                    if uploaded_files:
                        await websocket.send(json.dumps({
                            "type": "files_uploaded",
                            "files": uploaded_files
                        }))

                    # Build query with file context
                    if uploaded_files:
                        file_context = "\n\n---\n**User uploaded these files with this query:**\n"
                        for f in uploaded_files:
                            file_context += f"- `{f['path']}` ({f['size_bytes']:,} bytes)\n"
                        file_context += "\nPlease read and analyze these files to answer the query.\n---\n\n"
                        enhanced_query = file_context + query_text
                    else:
                        enhanced_query = query_text

                    # Run agent
                    await run_agent(websocket, enhanced_query, session_id)

                elif msg_type == "upload_file":
                    # Handle file upload from frontend (without immediate query)
                    # Frontend sends: {"type": "upload_file", "filename": "report.pdf", "content": "<base64>"}
                    filename = data.get("filename", "unnamed_file")
                    content_b64 = data.get("content", "")

                    import base64
                    try:
                        file_bytes = base64.b64decode(content_b64)

                        # Sanitize filename (prevent path traversal)
                        safe_filename = Path(filename).name
                        upload_path = USER_DIR / "uploads" / safe_filename
                        upload_path.parent.mkdir(parents=True, exist_ok=True)

                        upload_path.write_bytes(file_bytes)

                        await websocket.send(json.dumps({
                            "type": "file_uploaded",
                            "filename": safe_filename,
                            "path": str(upload_path),
                            "size_bytes": len(file_bytes)
                        }))
                        print(f"File uploaded: {upload_path} ({len(file_bytes)} bytes)")

                    except Exception as e:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": f"File upload failed: {str(e)}"
                        }))

                elif msg_type == "update_memory":
                    # Update user's memory.md with onboarding info, preferences, etc.
                    # Frontend sends: {"type": "update_memory", "content": "...markdown..."}
                    memory_content = data.get("content", "")
                    memory_path = USER_DIR / "memory.md"

                    try:
                        memory_path.write_text(memory_content, encoding="utf-8")
                        await websocket.send(json.dumps({
                            "type": "memory_updated",
                            "path": str(memory_path)
                        }))
                    except Exception as e:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": f"Memory update failed: {str(e)}"
                        }))

                elif msg_type == "get_memory":
                    # Retrieve user's memory.md
                    memory_path = USER_DIR / "memory.md"

                    if memory_path.exists():
                        content = memory_path.read_text(encoding="utf-8")
                        await websocket.send(json.dumps({
                            "type": "memory_content",
                            "content": content
                        }))
                    else:
                        await websocket.send(json.dumps({
                            "type": "memory_content",
                            "content": ""  # Empty if no memory yet
                        }))

                elif msg_type == "list_files":
                    # List all user's uploaded files
                    uploads_dir = USER_DIR / "uploads"
                    results_dir = USER_DIR / "results"

                    files = []
                    for dir_path in [uploads_dir, results_dir]:
                        if dir_path.exists():
                            for f in dir_path.iterdir():
                                if f.is_file():
                                    files.append({
                                        "name": f.name,
                                        "path": str(f),
                                        "size_bytes": f.stat().st_size,
                                        "folder": dir_path.name
                                    })

                    await websocket.send(json.dumps({
                        "type": "file_list",
                        "files": files
                    }))

                else:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": f"Unknown message type: {msg_type}"
                    }))

            except json.JSONDecodeError:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON"
                }))

    except websockets.exceptions.ConnectionClosed:
        print(f"Connection closed for user {user_id}")


async def run_agent(
    websocket: WebSocketServerProtocol,
    query: str,
    session_id: str
):
    """
    Run the agent using Claude Agent SDK.

    This is the correct way to build agents - using the SDK that powers Claude Code.
    The SDK handles:
    - The agent loop
    - Tool execution (Read, Write, Edit, Bash, Grep, Glob)
    - Session/context management
    - Streaming
    """

    # Token tracking
    total_input_tokens = 0
    total_output_tokens = 0

    try:
        # Configure the agent with Claude Agent SDK options
        options = ClaudeAgentOptions(
            # Use Claude Code's system prompt as base, append our custom instructions
            system_prompt={
                "type": "preset",
                "preset": "claude_code",
                "append": get_system_prompt()
            },
            # Allow built-in tools + our custom MCP tools
            allowed_tools=[
                "Read", "Write", "Edit", "Bash", "Grep", "Glob",
                "mcp__grid_tools__analyze_queue",
                "mcp__grid_tools__calculate_costs"
            ],
            # Custom MCP servers
            mcp_servers={"grid_tools": grid_tools_server},
            # Auto-approve file edits in sandbox (safe in isolated environment)
            permission_mode="acceptEdits",
            # Working directory
            cwd=str(USER_DIR),
            # Additional directories Claude can access
            add_dirs=[str(SYSTEM_DIR)],
            # Model to use
            model=MODEL,
        )

        # Get or create client for this session
        if session_id in sessions:
            client = sessions[session_id]
            # Continue conversation
            await client.query(query)
        else:
            # New session
            client = ClaudeSDKClient(options=options)
            await client.connect()
            sessions[session_id] = client
            await client.query(query)

        # Stream responses back to frontend
        async for message in client.receive_response():
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        # Stream text to frontend
                        await websocket.send(json.dumps({
                            "type": "text",
                            "content": block.text
                        }))
                    elif isinstance(block, ToolUseBlock):
                        # Notify frontend of tool call
                        await websocket.send(json.dumps({
                            "type": "tool_call",
                            "name": block.name,
                            "input": block.input,
                            "tool_use_id": block.id
                        }))
                    elif isinstance(block, ToolResultBlock):
                        # Tool result
                        await websocket.send(json.dumps({
                            "type": "tool_result",
                            "tool_use_id": block.tool_use_id,
                            "output": block.content if isinstance(block.content, str) else str(block.content),
                            "is_error": block.is_error or False
                        }))

            elif isinstance(message, ResultMessage):
                # Final result with usage stats
                if message.usage:
                    total_input_tokens = message.usage.get("input_tokens", 0)
                    total_output_tokens = message.usage.get("output_tokens", 0)

                # Send completion message
                await websocket.send(json.dumps({
                    "type": "done",
                    "session_id": message.session_id,
                    "token_usage": {
                        "input": total_input_tokens,
                        "output": total_output_tokens,
                        "total": total_input_tokens + total_output_tokens
                    },
                    "total_cost_usd": message.total_cost_usd,
                    "duration_ms": message.duration_ms
                }))

    except Exception as e:
        import traceback
        await websocket.send(json.dumps({
            "type": "error",
            "message": f"Agent error: {str(e)}\n{traceback.format_exc()}"
        }))


async def health_check(path: str, request_headers: Headers):
    """
    HTTP health check handler for container orchestration.
    Returns 200 OK for /health endpoint, otherwise allows WebSocket upgrade.
    """
    if path == "/health":
        return HTTPStatus.OK, [("Content-Type", "text/plain")], b"OK\n"
    return None


async def cleanup_sessions():
    """Cleanup old sessions periodically."""
    while True:
        await asyncio.sleep(3600)  # Every hour
        # Could implement session timeout logic here
        pass


async def main():
    """Start the WebSocket server."""
    print(f"GridAgent Server (Claude Agent SDK) starting on port {WS_PORT}...")
    print(f"Model: {MODEL}")
    print(f"System dir: {SYSTEM_DIR}")
    print(f"User dir: {USER_DIR}")

    # Ensure user directories exist
    USER_DIR.mkdir(parents=True, exist_ok=True)
    (USER_DIR / "uploads").mkdir(exist_ok=True)
    (USER_DIR / "results").mkdir(exist_ok=True)

    # Start cleanup task
    asyncio.create_task(cleanup_sessions())

    # origins=None disables origin checking (needed for local dev: localhost:3000 -> localhost:8080)
    async with websockets.serve(
        handle_connection,
        "0.0.0.0",
        WS_PORT,
        ping_interval=30,
        ping_timeout=10,
        process_request=health_check,
        origins=None
    ):
        print(f"GridAgent Server listening on ws://0.0.0.0:{WS_PORT}")
        print(f"Health check available at http://0.0.0.0:{WS_PORT}/health")
        print(f"Using Claude Agent SDK - same tools and patterns as Claude Code")
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    asyncio.run(main())
