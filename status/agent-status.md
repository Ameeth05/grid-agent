# Sandbox Agent Status

**Last Updated:** 2026-01-30
**Updated By:** subagent/sandbox-agent
**Status:** APPROVED

## Current State
WebSocket server using Claude Agent SDK. Runs inside E2B sandbox on port 8080.

## Recent Changes
- CRITICAL FIX: Rewrote from raw anthropic API to Claude Agent SDK
- Using ClaudeSDKClient for multi-turn sessions
- Built-in tools from SDK (Read, Write, Edit, Bash, Grep, Glob)
- Custom tools via @tool decorator (analyze_queue, calculate_costs)
- System prompt using preset + custom GridAgent instructions

## Blocking Issues
- None

## Cross-Component Dependencies
- **Needs from Backend:** ANTHROPIC_API_KEY, USER_ID, SESSION_ID env vars
- **Needs from Data:** Grid data files mounted at /system/data/
- **Provides to Frontend:** WebSocket on port 8080 for streaming responses

## Next Actions
- [ ] Build E2B template with updated code
- [ ] Test Claude Agent SDK inside sandbox
- [ ] Verify custom MCP tools work correctly
- [ ] End-to-end test with frontend

## Key Files
```
e2b-template/
├── gridagent_server.py  # WebSocket server + agent loop
├── requirements.txt     # claude-agent-sdk>=0.1.25
└── system/
    ├── skills/          # Skill .md files
    └── data/            # Mounted grid data
```

## Architecture
```
Frontend (WebSocket)
    |
E2B Sandbox (gridagent_server.py)
    |
    +-- ClaudeSDKClient
    |   +-- Built-in tools: Read, Write, Edit, Bash, Grep, Glob
    |   +-- Custom MCP tools: analyze_queue, calculate_costs
    |
    +-- Claude Code Runtime (bundled with SDK)
```

## Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| ANTHROPIC_API_KEY | (required) | Claude API access |
| GRIDAGENT_MODEL | claude-sonnet-4-20250514 | Model override |
| GRIDAGENT_WS_PORT | 8080 | WebSocket port |
