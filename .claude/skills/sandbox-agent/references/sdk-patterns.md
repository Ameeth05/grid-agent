# Claude Agent SDK Patterns

Detailed patterns for using the Claude Agent SDK in GridAgent.

## Table of Contents

1. [ClaudeAgentOptions Configuration](#claudeagentoptions-configuration)
2. [Session Management](#session-management)
3. [Streaming Response Handling](#streaming-response-handling)
4. [Error Handling](#error-handling)
5. [E2B Integration](#e2b-integration)
6. [Local Development Mode](#local-development-mode)

---

## ClaudeAgentOptions Configuration

### Full Configuration Example

```python
from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient

options = ClaudeAgentOptions(
    # System Prompt Configuration
    # --------------------------
    # Use Claude Code's system prompt as base, append custom instructions
    system_prompt={
        "type": "preset",
        "preset": "claude_code",       # Use Claude Code's battle-tested prompt
        "append": get_system_prompt()   # Append domain-specific instructions
    },

    # Tool Configuration
    # ------------------
    # Built-in tools + custom MCP tools
    allowed_tools=[
        # Built-in SDK tools (NO reimplementation needed!)
        "Read",    # Read file contents
        "Write",   # Write/create files
        "Edit",    # Edit existing files
        "Bash",    # Execute shell commands
        "Grep",    # Search file contents
        "Glob",    # Find files by pattern

        # Custom MCP tools (format: mcp__<server>__<tool>)
        "mcp__grid_tools__analyze_queue",
        "mcp__grid_tools__calculate_costs",
    ],

    # MCP Servers
    # -----------
    # Register custom tool servers
    mcp_servers={
        "grid_tools": grid_tools_server,  # Created via create_sdk_mcp_server()
    },

    # Permission Mode
    # ---------------
    # Options: "ask", "acceptEdits", "fullAuto"
    # Use "acceptEdits" in sandboxed environments (safe isolation)
    permission_mode="acceptEdits",

    # Filesystem Configuration
    # ------------------------
    # Working directory for the agent
    cwd=str(USER_DIR),  # e.g., "/user"

    # Additional directories the agent can access
    add_dirs=[str(SYSTEM_DIR)],  # e.g., ["/system"]

    # Model Configuration
    # -------------------
    model="claude-sonnet-4-20250514",  # Or "claude-opus-4-5-20251101" for complex tasks

    # Optional: Max tokens, temperature, etc.
    # max_tokens=4096,
    # temperature=0.7,
)
```

### System Prompt Presets

| Preset | Description | Use Case |
|--------|-------------|----------|
| `claude_code` | Full Claude Code capabilities | General coding/analysis |
| `minimal` | Minimal system prompt | Custom domain-specific agents |

### Permission Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `ask` | Prompt user for each action | Interactive development |
| `acceptEdits` | Auto-approve file edits | Sandboxed environments |
| `fullAuto` | Auto-approve all actions | Fully automated pipelines |

---

## Session Management

### Multi-Turn Conversation Pattern

```python
from claude_agent_sdk import ClaudeSDKClient

# Session storage (in-memory for single-instance)
sessions: dict[str, ClaudeSDKClient] = {}

async def run_agent(websocket, query: str, session_id: str):
    """Handle a query with session continuity."""

    try:
        # Check if session exists
        if session_id in sessions:
            # EXISTING SESSION: Continue conversation
            client = sessions[session_id]
            await client.query(query)
        else:
            # NEW SESSION: Create client and connect
            client = ClaudeSDKClient(options=options)
            await client.connect()
            sessions[session_id] = client
            await client.query(query)

        # Stream responses...
        async for message in client.receive_response():
            # Handle messages...
            pass

    except Exception as e:
        # Clean up failed session
        if session_id in sessions:
            try:
                await sessions[session_id].disconnect()
            except:
                pass
            del sessions[session_id]
        raise
```

### Session Cleanup

```python
async def cleanup_session(session_id: str):
    """Clean up a specific session."""
    if session_id in sessions:
        client = sessions.pop(session_id)
        try:
            await client.disconnect()
        except:
            pass

async def cleanup_all_sessions():
    """Clean up all sessions (e.g., on shutdown)."""
    for session_id in list(sessions.keys()):
        await cleanup_session(session_id)
```

### Session Timeout Pattern

```python
import asyncio
from datetime import datetime, timedelta

session_last_activity: dict[str, datetime] = {}
SESSION_TIMEOUT = timedelta(hours=1)

async def session_cleanup_task():
    """Periodic cleanup of idle sessions."""
    while True:
        await asyncio.sleep(300)  # Check every 5 minutes

        now = datetime.now()
        expired = [
            sid for sid, last in session_last_activity.items()
            if now - last > SESSION_TIMEOUT
        ]

        for session_id in expired:
            await cleanup_session(session_id)
            session_last_activity.pop(session_id, None)
```

---

## Streaming Response Handling

### Complete Message Handler

```python
from claude_agent_sdk import (
    AssistantMessage,
    ResultMessage,
    TextBlock,
    ToolUseBlock,
    ToolResultBlock,
)

async def handle_responses(client: ClaudeSDKClient, websocket):
    """Handle all response types from the agent."""

    total_input_tokens = 0
    total_output_tokens = 0

    async for message in client.receive_response():

        # Assistant messages (text and tool calls)
        if isinstance(message, AssistantMessage):
            for block in message.content:

                # Text content - stream to frontend
                if isinstance(block, TextBlock):
                    await websocket.send(json.dumps({
                        "type": "text",
                        "content": block.text
                    }))

                # Tool use - notify frontend
                elif isinstance(block, ToolUseBlock):
                    await websocket.send(json.dumps({
                        "type": "tool_call",
                        "name": block.name,
                        "input": block.input,
                        "tool_use_id": block.id
                    }))

                # Tool result - send output
                elif isinstance(block, ToolResultBlock):
                    # Handle different content types
                    output = block.content
                    if not isinstance(output, str):
                        output = str(output)

                    await websocket.send(json.dumps({
                        "type": "tool_result",
                        "tool_use_id": block.tool_use_id,
                        "output": output,
                        "is_error": block.is_error or False
                    }))

        # Result message (final, includes usage stats)
        elif isinstance(message, ResultMessage):
            if message.usage:
                total_input_tokens = message.usage.get("input_tokens", 0)
                total_output_tokens = message.usage.get("output_tokens", 0)

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
```

### Message Type Summary

| Type | Class | Content |
|------|-------|---------|
| Text | `TextBlock` | `.text` (string) |
| Tool call | `ToolUseBlock` | `.name`, `.input`, `.id` |
| Tool result | `ToolResultBlock` | `.tool_use_id`, `.content`, `.is_error` |
| Final | `ResultMessage` | `.usage`, `.session_id`, `.total_cost_usd` |

---

## Error Handling

### Agent Error Pattern

```python
async def run_agent_safe(websocket, query: str, session_id: str):
    """Run agent with comprehensive error handling."""

    try:
        await run_agent(websocket, query, session_id)

    except websockets.exceptions.ConnectionClosed:
        # Client disconnected - clean up
        await cleanup_session(session_id)

    except Exception as e:
        import traceback

        # Send error to frontend
        await websocket.send(json.dumps({
            "type": "error",
            "message": f"Agent error: {str(e)}",
            "traceback": traceback.format_exc()  # Optional: for debugging
        }))

        # Clean up failed session
        await cleanup_session(session_id)
```

### Retry Pattern

```python
import asyncio

async def run_agent_with_retry(websocket, query: str, session_id: str, max_retries: int = 3):
    """Run agent with automatic retry on transient failures."""

    for attempt in range(max_retries):
        try:
            await run_agent(websocket, query, session_id)
            return  # Success

        except Exception as e:
            if attempt < max_retries - 1:
                # Transient error - retry after delay
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                await cleanup_session(session_id)  # Clean up before retry
            else:
                # Final attempt failed
                raise
```

---

## E2B Integration

### Environment Variables

These are injected at sandbox creation:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key (used by SDK) |
| `USER_ID` | Yes | User identifier |
| `USER_NAME` | No | Display name |
| `SESSION_ID` | No | For session persistence |
| `GRIDAGENT_WS_PORT` | No | WebSocket port (default: 8081) |
| `GRIDAGENT_MODEL` | No | Model override |

### Dockerfile Requirements

```dockerfile
FROM python:3.12-slim

# Minimal dependencies - NO Node.js!
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl git && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

# Required in requirements.txt:
# claude-agent-sdk>=0.1.25
# websockets>=12.0
```

### Health Check Endpoint

```python
from http import HTTPStatus

async def health_check(path: str, request_headers):
    """HTTP health check for container orchestration."""
    if path == "/health":
        return HTTPStatus.OK, [("Content-Type", "text/plain")], b"OK\n"
    return None  # Allow WebSocket upgrade for other paths
```

---

## Local Development Mode

### Path Detection

```python
import os
from pathlib import Path

LOCAL_DEV = os.getenv("LOCAL_DEV", "false").lower() == "true"

if LOCAL_DEV:
    # Local development: use project directories
    _project_root = Path(__file__).parent.parent
    SYSTEM_DIR = Path(os.getenv("GRIDAGENT_DATA_DIR", str(_project_root / "Data")))
    USER_DIR = Path(os.getenv("GRIDAGENT_USER_DIR", str(_project_root / "local_user")))
else:
    # E2B Sandbox: standard paths
    SYSTEM_DIR = Path("/system")
    USER_DIR = Path("/user")
```

### Local Development Setup

```bash
# Set environment variables
export LOCAL_DEV=true
export GRIDAGENT_DATA_DIR=./Data
export GRIDAGENT_USER_DIR=./local_user
export ANTHROPIC_API_KEY=sk-ant-...

# Create user directory
mkdir -p local_user/uploads local_user/results

# Start server
python e2b-template/gridagent_server.py
```

### Testing WebSocket Connection

```python
# test_ws.py
import asyncio
import websockets
import json

async def test():
    async with websockets.connect("ws://localhost:8081") as ws:
        # Wait for connection message
        msg = await ws.recv()
        print(f"Connected: {msg}")

        # Send query
        await ws.send(json.dumps({
            "type": "query",
            "content": "What files are available?",
            "session_id": "test-session"
        }))

        # Receive responses
        async for msg in ws:
            data = json.loads(msg)
            print(f"[{data['type']}] {data}")
            if data["type"] == "done":
                break

asyncio.run(test())
```
