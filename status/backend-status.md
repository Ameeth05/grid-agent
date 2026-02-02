# Backend Status

**Last Updated:** 2026-02-02
**Updated By:** subagent/backend-orchestrator
**Status:** PRODUCTION-READY

## Current State
Thin FastAPI backend for auth and E2B sandbox lifecycle. Does NOT proxy WebSocket traffic.
Version 1.1.0 - Production hardened with comprehensive error handling and diagnostics.

## Recent Changes (v1.1.0)

### Error Handling Improvements
- Added global exception handler for unexpected errors (returns proper JSON)
- Fixed AuthError handler to return JSONResponse instead of raising HTTPException
- Added granular error codes for frontend error handling (token_expired, invalid_signature, etc.)
- Added request validation with Pydantic Field constraints

### Health & Diagnostics
- Enhanced `/health` endpoint with:
  - Application version
  - Uptime tracking
  - Configuration status (without exposing secrets)
  - Degraded status when config is incomplete
- Added `/ready` endpoint for Kubernetes/Railway readiness checks
- Improved root endpoint with service information and endpoint links

### Auth Hardening (auth.py)
- Added JWT format validation before decode (prevents malformed token attacks)
- Explicit algorithm allowlist (HS256 only - prevents algorithm confusion)
- Granular exception handling (ExpiredSignature, InvalidAudience, InvalidSignature, etc.)
- Added error codes for machine-readable error handling
- Case-insensitive Bearer prefix handling
- Truncated user_id in logs for privacy

### Logging Improvements
- Configurable log level via LOG_LEVEL env var
- JSON log format for production (LOG_FORMAT=json)
- Human-readable format for local development
- Startup configuration logging (without secrets)
- Warning on missing environment variables

### Dockerfile Fixes
- Fixed PORT environment variable handling (shell form CMD)
- Added PYTHONUNBUFFERED for proper log flushing
- Updated healthcheck to use /ready endpoint
- Increased start-period for slower cold starts

## Verified Configurations

| Check | Status | Notes |
|-------|--------|-------|
| CORS allow_origin_regex | CORRECT | `r"https://.*\.vercel\.app"` |
| Template ID match | CORRECT | "gridagent" matches e2b.toml |
| WebSocket URL format | CORRECT | `wss://{host}` |
| Dockerfile PORT | FIXED | Now uses `${PORT:-8000}` |

## Blocking Issues
- None

## Cross-Component Dependencies
- **Needs from E2B:** template_id "gridagent" (verified in e2b.toml)
- **Provides to Frontend:** ws_url from /api/start-session
- **Provides to Sandbox:** Environment variables (ANTHROPIC_API_KEY, USER_ID, SESSION_ID, USER_NAME)

## Production Deployment Checklist

### Railway Setup
1. [ ] Create Railway project linked to GitHub repo
2. [ ] Set ALL required environment variables:
   - ANTHROPIC_API_KEY
   - E2B_API_KEY
   - SUPABASE_URL
   - SUPABASE_KEY
   - SUPABASE_JWT_SECRET
3. [ ] Optional: Set LOG_LEVEL=INFO, LOG_FORMAT=json
4. [ ] Deploy and verify Dockerfile is detected

### Verification Steps
1. [ ] Check `/health` returns status=healthy
2. [ ] Check `/ready` returns ready=true
3. [ ] Test `/api/start-session` with real Supabase JWT
4. [ ] Verify returned `ws_url` is accessible from frontend
5. [ ] Monitor logs for any errors

## Key Files
```
backend/
  main.py              # FastAPI app with endpoints (v1.1.0)
  auth.py              # Supabase JWT verification (hardened)
  sandbox_manager.py   # E2B lifecycle management
  requirements.txt     # Dependencies
  Dockerfile           # Railway deployment (PORT fixed)
  .env.example         # Environment variable template
```

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/start-session | Create/resume sandbox, return ws_url |
| GET | /health | Health check with diagnostics |
| GET | /ready | Readiness check for load balancers |
| GET | / | Service info and links |
| GET | /docs | OpenAPI documentation |

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| ANTHROPIC_API_KEY | Injected into sandboxes for Claude |
| E2B_API_KEY | E2B sandbox API access |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_KEY | Supabase anon key |
| SUPABASE_JWT_SECRET | JWT verification secret |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8000 | Server port (set by Railway) |
| ENV | production | Environment mode |
| LOG_LEVEL | INFO | Logging level |
| LOG_FORMAT | json | Log format (json/text) |
| FRONTEND_URL | - | Additional CORS origin |
| LOCAL_DEV | false | Bypass E2B/auth for testing |

## Next Actions
- [x] Production hardening
- [ ] Deploy to Railway
- [ ] Test with real Supabase JWT
- [ ] Integration test with frontend
- [ ] (Optional) Add Supabase persistence for session tracking
