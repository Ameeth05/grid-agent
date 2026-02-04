#!/usr/bin/env python3
"""
Mock GridAgent Server for UI Testing

No Anthropic API key required! Just echoes back responses
so you can test the frontend chat UI.

Run: python mock_agent_server.py
Then: npm run dev (frontend)
"""

import asyncio
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn

PORT = 8081  # Matches NEXT_PUBLIC_LOCAL_API_URL

app = FastAPI(title="Mock GridAgent Server")

# CORS - allow all for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store events per session
event_queues: dict[str, asyncio.Queue] = {}


class QueryRequest(BaseModel):
    content: str
    session_id: str = "default"
    files: list[dict] | None = None


@app.get("/health")
async def health():
    return {"status": "ok", "model": "mock-model"}


@app.post("/query")
async def submit_query(request: QueryRequest):
    """Submit a query - triggers mock response via SSE."""
    session_id = request.session_id

    if session_id not in event_queues:
        event_queues[session_id] = asyncio.Queue()

    # Start mock response in background
    asyncio.create_task(send_mock_response(session_id, request.content))

    return {
        "status": "processing",
        "session_id": session_id,
        "message": "Query submitted"
    }


async def send_mock_response(session_id: str, user_query: str):
    """Send a mock streaming response."""
    queue = event_queues.get(session_id)
    if not queue:
        return

    await asyncio.sleep(0.1)  # Small delay before starting

    # Simulate multiple tool calls like the real agent
    tools = [
        ("Grep", {"pattern": "solar", "path": "/system/data"}),
        ("Grep", {"pattern": user_query[:20], "path": "/system/data"}),
        ("Bash", {"command": "ls -la /system/data/"}),
        ("Read", {"file": "/system/data/interconnection_queue.csv"}),
        ("Grep", {"pattern": "PJM", "path": "/system/data"}),
    ]

    for tool_name, args in tools:
        await queue.put({
            "type": "tool_start",
            "tool": tool_name,
            "args": args
        })
        await asyncio.sleep(0.15)  # Fast tool execution
        await queue.put({
            "type": "tool_result",
            "tool": tool_name,
            "result": f"Found 42 matches in 3 files"
        })
        await asyncio.sleep(0.05)

    # Thinking text (will be parsed and shown in collapsible ThinkingBlock)
    thinking = f"""I need to search for information related to "{user_query}" in the interconnection queue data to provide you with accurate analysis. Let me search for similar project IDs to see if there might be a typo or if the project exists under a different format. I found several related projects in the queue data. Let me also check for any related Phase 1 study reports or cluster results that might be available in the data directory. Perfect! Let me check the structured data for this query and search for relevant information in the JSON files to get a better understanding of the data structure."""

    # Stream thinking first (fast, line by line)
    for line in thinking.split('. '):
        if line.strip():
            await queue.put({
                "type": "text",
                "content": line.strip() + ". "
            })
            await asyncio.sleep(0.03)

    # Main response with markdown
    response = f"""

## Analysis Results

Based on your query: **"{user_query}"**

### Key Findings

| Metric | Value | Status |
|--------|-------|--------|
| Projects Found | 2,847 | Active |
| Total Capacity | 312 GW | Pending |
| Avg Wait Time | 4.2 years | High |

### Solar Projects by State

```
Virginia:    847 projects (92 GW)
Texas:       623 projects (78 GW)
California:  412 projects (45 GW)
```

### Risk Assessment

The interconnection queue shows significant backlog with:
- **High withdrawal risk** for projects > 3 years in queue
- **Cost escalation** averaging 15% per year
- **Grid upgrade costs** ranging $50M - $500M

### Recommendations

1. Prioritize cluster study participation
2. Monitor FERC Order 2023 compliance deadlines
3. Consider alternative POI locations

---

**Sources:**
- [PJM Queue Data](https://pjm.com/queue) - Retrieved Feb 2026
- [FERC Order 2023](https://ferc.gov/order-2023)
"""

    # Stream response line by line (much faster)
    for line in response.split('\n'):
        await queue.put({
            "type": "text",
            "content": line + '\n'
        })
        await asyncio.sleep(0.01)  # Very fast streaming

    # Send done
    await queue.put({
        "type": "done",
        "token_usage": {
            "input_tokens": len(user_query.split()) * 2,
            "output_tokens": len(response.split()) * 2,
            "total_tokens": (len(user_query.split()) + len(response.split())) * 2
        }
    })


async def event_generator(session_id: str):
    """Generate SSE events."""
    if session_id not in event_queues:
        event_queues[session_id] = asyncio.Queue()

    queue = event_queues[session_id]

    # Send connected event
    yield f"data: {json.dumps({'type': 'connected', 'session_id': session_id})}\n\n"

    while True:
        try:
            event = await asyncio.wait_for(queue.get(), timeout=30.0)
            yield f"data: {json.dumps(event)}\n\n"
        except asyncio.TimeoutError:
            yield ": keepalive\n\n"


@app.get("/events")
async def events(session_id: str = "default"):
    """SSE endpoint for streaming responses."""
    return StreamingResponse(
        event_generator(session_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/")
async def root():
    return {
        "name": "Mock GridAgent Server",
        "status": "ready",
        "note": "This is a mock server for UI testing - no AI responses"
    }


if __name__ == "__main__":
    print("\n" + "="*60)
    print("MOCK GridAgent Server (for UI testing)")
    print("="*60)
    print(f"Running on http://localhost:{PORT}")
    print("\nThis server returns mock responses - no Anthropic API needed!")
    print("Use this to test the chat UI styling and interactions.")
    print("="*60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=PORT)
