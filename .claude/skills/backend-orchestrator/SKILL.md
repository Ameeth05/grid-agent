---
name: backend-orchestrator
description: "FastAPI backend orchestration patterns for GridAgent. Use this skill when: implementing /api/start-session endpoints, configuring CORS for Vercel deployments, managing E2B sandbox lifecycle (create/resume/pause/kill), verifying Supabase JWTs, or deploying to Railway. This is for THIN backends that handle auth and sandbox management only - NOT for proxying WebSocket traffic."
---

# Backend Orchestrator

Patterns for GridAgent's thin FastAPI backend that handles authentication and E2B sandbox lifecycle management.

## Core Philosophy

The backend is THIN - it handles only:
1. JWT verification (Supabase)
2. Sandbox lifecycle (E2B)
3. Return `ws_url` to frontend

The backend does NOT:
- Proxy WebSocket traffic (frontend connects DIRECTLY to sandbox)
- Run agent logic (that runs inside E2B sandbox)
- Store conversation state (sandbox handles persistence)

## Architecture

```
Frontend (Vercel)
    |
    +-- POST /api/start-session (to this backend)
    |   |-- Verify JWT with Supabase
    |   |-- Create/resume E2B sandbox
    |   +-- Return ws_url
    |
    +-- WebSocket (DIRECT to sandbox ws_url)
        +-- All agent traffic goes here, NOT through backend
```

## Critical Rules

### CORS Configuration

**WRONG** - FastAPI wildcards do NOT work:
```python
allow_origins=["https://*.vercel.app"]  # IGNORED!
```

**CORRECT** - Use allow_origin_regex:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Explicit origins
    allow_origin_regex=r"https://.*\.vercel\.app",  # Regex for patterns
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
```

### Template ID Must Match

The template ID in `sandbox_manager.py` MUST exactly match `e2b.toml`:
```python
# sandbox_manager.py
TEMPLATE_ID = "gridagent"  # Must match e2b.toml id exactly
```

### WebSocket URL Format

E2B provides `sandbox.get_host(port)` which returns the public hostname:
```python
host = sandbox.get_host(8080)
ws_url = f"wss://{host}"  # Always use wss:// for production
```

### API Key Security

API keys are ONLY passed as environment variables:
```python
sandbox = Sandbox(
    template=TEMPLATE_ID,
    env_vars={
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
        "USER_ID": user_id,
        "SESSION_ID": session_id,
    },
)
```

Never bake API keys into images or hardcode them.

## Endpoint Implementation

### POST /api/start-session

```python
@app.post("/api/start-session", response_model=StartSessionResponse)
async def start_session(
    request: StartSessionRequest,
    user: UserInfo = Depends(get_current_user),
    manager: SandboxManager = Depends(get_manager),
):
    # Try to resume existing session
    if request.session_id:
        ws_url = await manager.resume_sandbox(request.session_id)
        if ws_url:
            return StartSessionResponse(
                ws_url=ws_url,
                session_id=request.session_id,
                resumed=True
            )

    # Create new sandbox
    ws_url, session_id = await manager.create_sandbox(
        user_id=user.user_id,
        session_id=request.session_id,
        user_name=user.user_name,
    )

    return StartSessionResponse(
        ws_url=ws_url,
        session_id=session_id,
        resumed=False
    )
```

## Reference Files

For detailed implementation patterns, see:

- **E2B Integration**: Read `references/e2b-integration.md` for SandboxManager patterns, environment variables, and lifecycle methods (create/resume/pause/kill)
- **Auth Flow**: Read `references/auth-flow.md` for Supabase JWT verification, HS256 configuration, and UserInfo extraction

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| ANTHROPIC_API_KEY | Yes | Injected into sandboxes |
| E2B_API_KEY | Yes | E2B sandbox API access |
| SUPABASE_URL | Yes | Supabase project URL |
| SUPABASE_JWT_SECRET | Yes | JWT verification secret |
| PORT | No | Server port (default: 8000) |
| FRONTEND_URL | No | Additional CORS allowed origin |
| LOCAL_DEV | No | Set "true" to bypass auth/E2B for local testing |

## Railway Deployment Checklist

1. Create Railway project linked to GitHub repo
2. Set ALL required environment variables
3. Verify Dockerfile is detected (uses `python:3.12-slim`)
4. Check `/health` endpoint responds after deploy
5. Test `/api/start-session` with real Supabase JWT
6. Verify returned `ws_url` is accessible from frontend

## Local Development Mode

Set `LOCAL_DEV=true` to bypass E2B and Supabase:
- Auth returns mock user: `("local-dev-user", "Local Developer")`
- Sandbox returns localhost: `ws://localhost:8080`
- Useful for testing frontend without E2B costs

## Key Files

- `backend/main.py` - FastAPI application with endpoints
- `backend/auth.py` - Supabase JWT verification
- `backend/sandbox_manager.py` - E2B sandbox lifecycle management
