# GridAgent

## Mission
AI research agent for US Power Markets.

## Recent Updates (Feb 3, 2026)

### User Journey Implementation (COMPLETE)
- **Route Groups**: `(marketing)/` for public pages, `(app)/` for authenticated
- **Header**: Both "Request Demo" + "Sign In" buttons
- **AppSidebar**: Collapsible with Chat/News/Dashboard nav + UserProfile
- **AuthGuard**: Protects `/chat`, `/news`, `/watchlist` routes
- **DemoRequestForm**: Connected to Supabase `demo_requests` table

### Supabase Database Setup (COMPLETE)
- **Project**: Grid Agent (`hobdmhagohdosgyavifp`) - US East 1
- **Table**: `demo_requests` with RLS enabled
- **Policy**: Anyone can insert (lead capture)
- **Frontend .env.local**: Updated with real credentials

### Frontend Performance Optimization
- Removed Framer Motion from most components (~200KB savings)
- Kept Framer Motion only in Hero.tsx for rotating text animation
- Replaced with CSS animations (animate-fade-in, animate-slide-up)
- Fixed canvas color bug in GridAnimation.tsx
- Updated navigation: About, ISO-News, Dashboard

### Local Testing Infrastructure (COMPLETE)
- **Backend Tests**: 30 pytest tests (test_main.py, test_auth.py)
- **Test Runner**: `test-local.ps1` script for one-command testing
- **Fixtures**: Mocked E2B SDK and Supabase JWT in conftest.py
- **LOCAL_DEV Mode**: Bypasses real services for safe local testing

### Chat UI Upgrade with Streamdown (COMPLETE)
- **Streamdown**: Vercel's AI-optimized markdown renderer (v2.1.0)
- **Plugins**: @streamdown/code (Shiki), @streamdown/math (KaTeX)
- **New Components**: StreamdownMessage, MessageActions, Citations
- **Features**: Syntax highlighting, copy button, citation parsing
- **Build**: Frontend builds successfully (476KB chat page)

## Deployment Status
| Platform | Component | Status |
|----------|-----------|--------|
| Vercel | Frontend | PENDING |
| Railway | Backend | PENDING |
| E2B | Sandbox Template | PENDING |
| Supabase | Database | CONFIGURED |

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
| Supabase S3 | Sandbox /system/data/ | gridagent-system bucket (read-only) |
| Supabase S3 | Sandbox /user/data/ | gridagent-users bucket (read-write) |

## Environment Variables
| Variable | Component | Required |
|----------|-----------|----------|
| ANTHROPIC_API_KEY | Sandbox, Backend | Yes |
| E2B_API_KEY | Backend | Yes (prod) |
| SUPABASE_JWT_SECRET | Backend | Yes (prod) |
| NEXT_PUBLIC_SUPABASE_URL | Frontend | Yes |
| NEXT_PUBLIC_BACKEND_URL | Frontend | Yes |
| SUPABASE_S3_ENDPOINT | Backend | Yes (prod) |
| SUPABASE_S3_ACCESS_KEY | Backend | Yes (prod) |
| SUPABASE_S3_SECRET_KEY | Backend | Yes (prod) |
| SUPABASE_SYSTEM_BUCKET | Backend | No (default: gridagent-system) |
| SUPABASE_USER_BUCKET | Backend | No (default: gridagent-users) |

## Multi-tenant S3 Storage
Two Supabase S3 buckets are mounted at runtime:
- **System bucket** (`gridagent-system`) → `/system/data/` (read-only, shared)
- **User bucket** (`gridagent-users`) → `/user/data/` (read-write, per-user prefix `/users/<user_id>/`)

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

# Backend Tests
cd backend && pip install -r requirements-dev.txt && pytest tests/ -v

# E2B Template
cd e2b-template && python sync_data.py && e2b template build

# Local Testing (PowerShell)
.\test-local.ps1 -TestsOnly        # Run pytest only
.\test-local.ps1 -Frontend         # Full stack with frontend

# Local dev (all components)
./start-local.ps1
```
