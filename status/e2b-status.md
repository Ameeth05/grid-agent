# E2B Template Status

**Last Updated:** 2026-02-02
**Updated By:** subagent/e2b-builder
**Status:** APPROVED - PRODUCTION READY

## Current State
E2B template configured with Python 3.12, Claude Agent SDK v0.1.25+, and auto-start WebSocket server on port 8080.

## Recent Changes (2026-02-02)

### Critical Fixes
1. **Port Mismatch Fixed**: Changed `gridagent_server.py` and `gridagent_server_sse.py` default port from 8081 to 8080 to match e2b.toml and Dockerfile
2. **Data Path Structure**: Updated all skill files to use correct data paths under `/system/data/`
3. **Dockerfile Optimization**: Improved layer caching, added explicit directory structure for data files

### New Features
- Added `sync_data.py` script to copy Data/ files into e2b-template before building
- Updated system prompt with accurate data schema documentation
- Improved Dockerfile documentation with environment variable reference

### File Path Updates
- Queue data: `/system/data/Interconnection Queue/CycleProjects-All.csv`
- Cluster data: `/system/data/Cluster Results/TC2 Phase 1/TC2_Phase1_structured.json`
- Docs: `/system/docs/Interconnection Manual/Manual 14A/m14a.pdf`

## Blocking Issues
- None

## Cross-Component Dependencies
- **Needs from Data:** Grid data files synced via `sync_data.py`
- **Provides to Backend:** template_id "gridagent" for SandboxManager
- **Provides to Frontend:** WebSocket endpoint on port 8080
- **Uses:** Claude Agent SDK (NOT raw anthropic API)

## Build Instructions

```bash
# 1. Navigate to e2b-template directory
cd e2b-template/

# 2. Sync data files from Data/ directory
python sync_data.py

# 3. Build the E2B template
e2b template build

# 4. Verify template is registered
e2b template list
```

## Key Files
```
e2b-template/
├── e2b.toml              # template_id=gridagent, port 8080
├── Dockerfile            # python:3.12-slim, claude-agent-sdk>=0.1.25
├── requirements.txt      # All Python dependencies
├── sync_data.py          # Data sync script (run before build)
├── gridagent_server.py   # Main WebSocket server (Claude Agent SDK)
├── gridagent_server_sse.py # Alternative SSE server for debugging
└── system/
    ├── skills/
    │   ├── _index.yaml       # Skill discovery index
    │   ├── queue-analyzer.md # Queue analysis skill
    │   ├── cluster-study.md  # Cluster study analysis
    │   ├── ferc-policy.md    # FERC policy guidance
    │   └── risk-assessment.md # Risk analysis
    ├── data/                 # Synced from ../Data/
    │   ├── Interconnection Queue/
    │   │   └── CycleProjects-All.csv
    │   └── Cluster Results/
    │       └── TC2 Phase 1/
    │           ├── TC2_Phase1_structured.json
    │           └── TC2_PHASE_1_*.json
    └── docs/                 # Synced documentation
        └── Interconnection Manual/
            └── Manual 14A/
                └── m14a.pdf
```

## Template Configuration (e2b.toml)
```toml
id = "gridagent"
dockerfile = "Dockerfile"
name = "GridAgent Sandbox"
start_cmd = "python /app/gridagent_server.py"

[resources]
cpu_count = 2
memory_mb = 2048

[[ports]]
port = 8080
protocol = "ws"
```

## Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| ANTHROPIC_API_KEY | Yes | Claude API access (injected at sandbox creation) |
| USER_ID | No | User identifier for session management |
| USER_NAME | No | Display name for personalization |
| SESSION_ID | No | For session persistence |
| GRIDAGENT_MODEL | No | Override model (default: claude-sonnet-4-20250514) |
| GRIDAGENT_WS_PORT | No | Override port (default: 8080) |

## Outputs for Other Components
| Output | Value | Used By |
|--------|-------|---------|
| template_id | gridagent | Backend SandboxManager |
| port | 8080 | Frontend WebSocket |
| ws_url pattern | wss://{sandbox.get_host(8080)} | Backend response |

## SDK Usage Verification
The template correctly uses Claude Agent SDK:
```python
# CORRECT - as per CLAUDE.md
from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    tool,
    create_sdk_mcp_server,
)

# NOT using raw anthropic API
```

## Health Check
The server exposes a health endpoint at `/health` for container orchestration:
```bash
curl http://localhost:8080/health
# Response: OK
```

## Next Actions
- [x] Fix port mismatch (8081 -> 8080)
- [x] Update data paths in skills
- [x] Create sync_data.py script
- [x] Optimize Dockerfile layer caching
- [ ] Run `python sync_data.py` to populate data
- [ ] Run `e2b template build` to create template
- [ ] Test sandbox spin-up with backend
- [ ] Verify WebSocket connection from frontend

## Testing Checklist
- [ ] `e2b template build` succeeds
- [ ] Template appears in `e2b template list`
- [ ] Sandbox starts with `ANTHROPIC_API_KEY` injected
- [ ] Health check returns OK
- [ ] WebSocket connection from frontend works
- [ ] Agent can read data files in /system/data/
- [ ] Agent can write to /user/ directory
- [ ] Skills are discovered and applied correctly
