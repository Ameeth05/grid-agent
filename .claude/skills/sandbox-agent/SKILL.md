---
name: sandbox-agent
description: Guide for building AI agents using Claude Agent SDK inside E2B sandboxes. Use this skill when implementing the GridAgent server (gridagent_server.py), creating custom tools with @tool decorator, configuring ClaudeAgentOptions, streaming responses via WebSocket, or understanding the sandbox filesystem layout (/system/ read-only, /user/ read-write). CRITICAL - Use claude-agent-sdk package, NOT raw anthropic API.
---

# Sandbox Agent

Build AI agents using Claude Agent SDK inside E2B sandboxes. This skill covers the gridagent_server.py implementation patterns.

## CRITICAL: Use Claude Agent SDK, NOT Raw Anthropic API

```python
# CORRECT - Claude Agent SDK
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

# WRONG - Raw Anthropic API (DO NOT USE FOR AGENTS)
import anthropic
client = anthropic.Anthropic()  # NO!
```

**Why?** The Claude Agent SDK provides the same tools, agent loop, and context management that power Claude Code. It handles sessions, streaming, and tool execution automatically.

## Quick Start

1. **Install**: `pip install claude-agent-sdk>=0.1.25`
2. **Configure**: Create ClaudeAgentOptions with system prompt preset
3. **Connect**: Use ClaudeSDKClient for multi-turn sessions
4. **Stream**: Process responses via `receive_response()`
5. **Extend**: Add custom tools via `@tool` decorator

## ClaudeSDKClient Pattern

```python
# Configure agent options
options = ClaudeAgentOptions(
    # Use Claude Code's system prompt as base, append custom instructions
    system_prompt={
        "type": "preset",
        "preset": "claude_code",
        "append": get_system_prompt()  # Your custom instructions
    },
    # Allow built-in tools + custom MCP tools
    allowed_tools=[
        "Read", "Write", "Edit", "Bash", "Grep", "Glob",
        "mcp__grid_tools__analyze_queue",
        "mcp__grid_tools__calculate_costs"
    ],
    # Custom MCP servers
    mcp_servers={"grid_tools": grid_tools_server},
    # Auto-approve file edits (safe in isolated sandbox)
    permission_mode="acceptEdits",
    # Working directory
    cwd=str(USER_DIR),
    # Additional accessible directories
    add_dirs=[str(SYSTEM_DIR)],
    # Model to use
    model="claude-sonnet-4-20250514",
)

# Session management pattern
sessions: dict[str, ClaudeSDKClient] = {}

async def run_agent(websocket, query: str, session_id: str):
    if session_id in sessions:
        client = sessions[session_id]
        await client.query(query)  # Continue conversation
    else:
        client = ClaudeSDKClient(options=options)
        await client.connect()
        sessions[session_id] = client
        await client.query(query)  # Start new conversation

    # Stream responses
    async for message in client.receive_response():
        # Handle message types...
```

## Built-in Tools (NO Reimplementation!)

The SDK provides these tools automatically:

| Tool | Purpose | Example |
|------|---------|---------|
| `Read` | Read file contents | Load CSV data, read docs |
| `Write` | Write/create files | Save analysis results |
| `Edit` | Edit existing files | Modify configurations |
| `Bash` | Execute shell commands | Run Python scripts, pip install |
| `Grep` | Search file contents | Find patterns in data |
| `Glob` | Find files by pattern | Discover available files |

**DO NOT reimplement these!** The SDK handles them with proper permissions and sandboxing.

## Custom Tools via @tool Decorator

```python
from claude_agent_sdk import tool, create_sdk_mcp_server

@tool(
    "analyze_queue",
    "Analyze PJM interconnection queue data with common metrics",
    {
        "metric": str,    # "capacity_by_state", "capacity_by_fuel", etc.
        "filters": dict,  # Optional filters like {"state": "PA"}
    }
)
async def analyze_queue(args: dict) -> dict:
    metric = args.get("metric", "capacity_by_state")
    filters = args.get("filters", {})

    # Return structured response
    return {
        "content": [{
            "type": "text",
            "text": f"Analysis result for {metric}..."
        }]
    }

# Create MCP server with custom tools
grid_tools_server = create_sdk_mcp_server(
    name="grid_tools",
    version="1.0.0",
    tools=[analyze_queue, calculate_costs]
)
```

## Streaming Response Handling

```python
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
                    "output": block.content,
                    "is_error": block.is_error or False
                }))

    elif isinstance(message, ResultMessage):
        # Final result with usage stats
        await websocket.send(json.dumps({
            "type": "done",
            "session_id": message.session_id,
            "token_usage": {
                "input": message.usage.get("input_tokens", 0),
                "output": message.usage.get("output_tokens", 0),
            },
            "total_cost_usd": message.total_cost_usd,
            "duration_ms": message.duration_ms
        }))
```

## Filesystem Layout

```
/system/ (READ-ONLY - baked into E2B template)
├── skills/                     # Grid analysis skills (.md)
├── data/
│   ├── Interconnection Queue/  # PJM queue CSV files
│   ├── Cluster Results/        # Phase study results (JSON)
│   └── Interconnection Manual/ # FERC manuals (PDF)
└── docs/                       # Reference documentation

/user/ (READ-WRITE - per-session, persisted to Supabase)
├── uploads/                    # User-uploaded files
├── results/                    # Agent-generated outputs
└── memory.md                   # Session context/notes
```

**Path Configuration:**
```python
# E2B Sandbox paths
SYSTEM_DIR = Path("/system")
USER_DIR = Path("/user")

# Local development override
if os.getenv("LOCAL_DEV") == "true":
    SYSTEM_DIR = Path(os.getenv("GRIDAGENT_DATA_DIR", "./Data"))
    USER_DIR = Path(os.getenv("GRIDAGENT_USER_DIR", "./local_user"))
```

## WebSocket Message Protocol

### Client -> Server

| Type | Payload | Purpose |
|------|---------|---------|
| `query` | `{content, session_id}` | Send user message |
| `query_with_files` | `{content, files[], session_id}` | Message + file uploads |
| `upload_file` | `{filename, content (base64)}` | Upload without query |
| `new_session` | `{session_id}` | Start fresh session |
| `ping` | `{}` | Keep-alive |

### Server -> Client

| Type | Payload | Purpose |
|------|---------|---------|
| `connected` | `{message, user_id}` | Connection established |
| `text` | `{content}` | Streaming text response |
| `tool_call` | `{name, input, tool_use_id}` | Tool being executed |
| `tool_result` | `{tool_use_id, output, is_error}` | Tool execution result |
| `done` | `{session_id, token_usage, total_cost_usd}` | Response complete |
| `error` | `{message}` | Error occurred |

## E2B Dockerfile (Minimal)

```dockerfile
FROM python:3.12-slim

# Minimal system dependencies - NO Node.js needed!
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl git && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application
COPY gridagent_server.py /app/
COPY system/ /system/

WORKDIR /app
EXPOSE 8080

CMD ["python", "/app/gridagent_server.py"]
```

**Key Point:** The `claude-agent-sdk` package bundles the CLI automatically since v0.1.8+. No separate Node.js or CLI install needed.

## System Prompt Pattern

```python
def get_system_prompt() -> str:
    return f"""You are GridAgent, an expert AI research analyst...

## Your Environment
- `{SYSTEM_DIR}` (read-only): Pre-loaded data files
- `{USER_DIR}` (read-write): User's working directory
  - `{USER_DIR}/uploads/`: User uploads
  - `{USER_DIR}/results/`: Analysis outputs
  - `{USER_DIR}/memory.md`: User preferences

## First Message Protocol
1. Use Glob to discover available data files
2. Check if memory.md exists (user preferences)
3. Check uploads/ for user files
4. Greet user by name if known
"""
```

## References

- **SDK Patterns**: Read `references/sdk-patterns.md` for detailed ClaudeAgentOptions, session management, and error handling
- **Tool Definitions**: Read `references/tool-definitions.md` for custom grid tools (analyze_queue, calculate_costs)

## SDK Documentation

- Quickstart: https://platform.claude.com/docs/en/agent-sdk/quickstart
- Python Reference: https://platform.claude.com/docs/en/agent-sdk/python
- PyPI: https://pypi.org/project/claude-agent-sdk/

## Key Files

| File | Purpose |
|------|---------|
| `e2b-template/gridagent_server.py` | Full agent implementation |
| `e2b-template/requirements.txt` | Dependencies (claude-agent-sdk>=0.1.25) |
| `e2b-template/Dockerfile` | Minimal E2B template |
| `e2b-template/e2b.toml` | E2B configuration |
