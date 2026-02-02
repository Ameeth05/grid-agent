# GridAgent

## Mission
AI research agent for US Power Markets. **YC S26 deadline: Feb 9, 2026, 8pm PT**.

## Architecture
```
Frontend (Vercel) <--> E2B Sandbox (WebSocket:8080) <--> Backend (Railway)
                              |
                    Claude Agent SDK
```

## Components
| Component | Skill | Status | Build Command |
|-----------|-------|--------|---------------|
| Frontend | /frontend-builder | status/frontend-status.md | `npm run build` |
| Backend | /backend-orchestrator | status/backend-status.md | `python -c "from main import app"` |
| E2B | /e2b-builder | status/e2b-status.md | `e2b template build` |
| Sandbox | /sandbox-agent | status/agent-status.md | - |

## Subagent Rules (MANDATORY)

### Before Marking Complete
1. **Run build/lint** - Frontend: `npm run build`, Backend: import check
2. **Update status file** with changes made
3. **Verify integration points** match other components

### Orchestrator Review Checklist
- [ ] Template ID "gridagent" consistent across e2b.toml, sandbox_manager.py
- [ ] Port 8080 consistent across all files
- [ ] CORS uses `allow_origin_regex` (not wildcards)
- [ ] No TypeScript/Python errors

## Critical Rules

### SDK Usage (NON-NEGOTIABLE)
```python
# CORRECT
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

# WRONG - DO NOT USE
import anthropic
```

### Port Configuration
All components MUST use port **8080** for sandbox WebSocket:
- `e2b.toml`: `port = 8080`
- `gridagent_server.py`: `WS_PORT = "8080"`
- `sandbox_manager.py`: `SANDBOX_PORT = 8080`

### CORS (Backend)
```python
allow_origin_regex=r"https://.*\.vercel\.app"  # CORRECT
allow_origins=["https://*.vercel.app"]  # WRONG - wildcards don't work
```

## Integration Points
| Source | Target | Value |
|--------|--------|-------|
| e2b.toml | sandbox_manager.py | template_id = "gridagent" |
| Backend /api/start-session | Frontend | ws_url |
| E2B Sandbox | Frontend | WebSocket port 8080 |
| Data/ | Sandbox | /system/data/ (via sync_data.py) |

## Environment Variables
| Variable | Component | Required |
|----------|-----------|----------|
| ANTHROPIC_API_KEY | Sandbox, Backend | Yes |
| E2B_API_KEY | Backend | Yes (prod) |
| SUPABASE_JWT_SECRET | Backend | Yes (prod) |
| NEXT_PUBLIC_SUPABASE_URL | Frontend | Yes |
| NEXT_PUBLIC_BACKEND_URL | Frontend | Yes |

## Commit Rules
1. Subagent completes work -> Orchestrator reviews
2. Orchestrator runs builds, fixes any errors
3. Commit with descriptive message
4. Wait for CodeRabbit review before push to main

## Quick Commands
```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && python -c "from main import app; print('OK')"

# E2B Template
cd e2b-template && python sync_data.py && e2b template build

# Local dev (all components)
./start-local.ps1
```
