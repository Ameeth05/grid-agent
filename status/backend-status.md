# Backend Status

**Last Updated:** 2026-02-04
**Updated By:** orchestrator
**Status:** PRODUCTION-READY + TESTED

## Current State
Thin FastAPI backend for auth and E2B sandbox lifecycle. Does NOT proxy WebSocket traffic.
Version 1.2.2 - Security hardening (command injection fix) + 38 passing tests.

## Recent Changes (Feb 3, 2026) - Test Infrastructure

### Testing Setup
- Created `backend/tests/` directory with pytest infrastructure
- Created `requirements-dev.txt` (separate from production deps)
- **38 tests passing** - API endpoints, JWT verification, and latency benchmarks tested

### Test Files Created
| File | Purpose |
|------|---------|
| `tests/__init__.py` | Package marker |
| `tests/conftest.py` | Shared fixtures (mocked E2B/Supabase) |
| `tests/test_main.py` | API endpoint tests (health, ready, start-session, CORS) |
| `tests/test_auth.py` | JWT verification tests (valid, expired, invalid signature) |
| `tests/test_latency.py` | Latency benchmarks (API endpoints, WebSocket, user journey) |

### Test Runner Script
- `test-local.ps1` at project root
- Flags: `-TestsOnly`, `-ServersOnly`, `-Frontend`
- Uses `LOCAL_DEV=true` to bypass external services

### Running Tests
```powershell
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v
```

---

## Recent Changes (v1.2.1)

### Security Fix - Command Injection Prevention (sandbox_manager.py)
- Added `_validate_user_id()` method to validate user IDs against `^[a-zA-Z0-9_-]+$` regex
- Added `shlex.quote()` for all shell arguments in S3 mount commands
- Prevents command injection attacks via malicious user_id values
- Raises `ValueError` for invalid user_id format (max 128 chars, alphanumeric/dash/underscore only)

## Previous Changes (v1.2.0)

### Multi-tenant S3 Storage (sandbox_manager.py)
- Added runtime S3 mounting via s3fs for Supabase S3-compatible storage
- **System bucket** (`gridagent-system`) → `/system/data/` (read-only, shared across all users)
- **User bucket** (`gridagent-users`) → `/user/data/` (read-write, per-user prefix `/users/<user_id>/`)
- S3 credentials written to sandbox at `/root/.passwd-s3fs` with 600 permissions
- Mount failures logged but don't block sandbox creation (graceful degradation)
  - **Log Level**: Mount failures logged at `ERROR` level (`logger.error()`)
  - **Metrics** (TODO): Emit `sandbox_mount_failures_total` counter and `sandbox_mount_success_ratio` gauge via Prometheus client
  - **Alerting** (TODO): Create alert rule when `sandbox_mount_failures_total` increases by >5 in 5min window; operators should check Supabase S3 endpoint availability and credentials
  - **Health Check**: `/health` endpoint does NOT currently reflect mount state; sandbox is considered healthy even with failed mounts (data features degraded, not core functionality)
  - **User Notification**: Mount failures are NOT surfaced to end-users; agent will return errors when trying to access `/system/data` or `/user/data` paths that don't exist
- New env vars: `SUPABASE_S3_ENDPOINT`, `SUPABASE_S3_ACCESS_KEY`, `SUPABASE_S3_SECRET_KEY`
- Optional bucket name overrides: `SUPABASE_SYSTEM_BUCKET`, `SUPABASE_USER_BUCKET`

### E2B Template Requirements
- **IMPORTANT:** E2B template must be rebuilt with `e2b template build` after this change
- Dockerfile now includes `s3fs` and `fuse` packages for S3 mounting
- Added `user_allow_other` to `/etc/fuse.conf` for non-root access

## Previous Changes (v1.1.0)

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
- **Needs from E2B:** template_id "gridagent" (verified in e2b.toml), s3fs package in template
- **Needs from Supabase:** S3-compatible storage with two buckets configured
- **Provides to Frontend:** ws_url from /api/start-session
- **Provides to Sandbox:** Environment variables (ANTHROPIC_API_KEY, USER_ID, SESSION_ID, USER_NAME)
- **Provides to Sandbox:** S3 mounts at `/system/data/` (read-only) and `/user/data/` (read-write)

## Production Deployment Checklist

### Supabase S3 Setup (BEFORE Railway)
1. [ ] Create bucket `gridagent-system` in Supabase Storage
2. [ ] Create bucket `gridagent-users` in Supabase Storage
3. [ ] Upload system data to `gridagent-system` bucket (Interconnection Queue CSVs, Cluster Results JSONs)
4. [ ] Get S3 credentials from Supabase Dashboard → Settings → API

### E2B Template Rebuild
1. [ ] Run `cd e2b-template && e2b template build` (includes s3fs package)
2. [ ] Verify template ID is "gridagent"

### Railway Setup
1. [ ] Create Railway project linked to GitHub repo
2. [ ] Set ALL required environment variables:
   - ANTHROPIC_API_KEY
   - E2B_API_KEY
   - SUPABASE_URL
   - SUPABASE_KEY
   - SUPABASE_JWT_SECRET
   - SUPABASE_S3_ENDPOINT
   - SUPABASE_S3_ACCESS_KEY
   - SUPABASE_S3_SECRET_KEY
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
  requirements.txt     # Production dependencies
  requirements-dev.txt # Dev/test dependencies
  Dockerfile           # Railway deployment (PORT fixed)
  .env.example         # Environment variable template
  tests/
    conftest.py        # Test fixtures
    test_main.py       # API tests
    test_auth.py       # JWT tests
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
| SUPABASE_S3_ENDPOINT | Supabase S3 endpoint (e.g., `https://<PROJECT>.supabase.co/storage/v1/s3`) |
| SUPABASE_S3_ACCESS_KEY | Supabase S3 access key |
| SUPABASE_S3_SECRET_KEY | Supabase S3 secret key |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8000 | Server port (set by Railway) |
| ENV | production | Environment mode |
| LOG_LEVEL | INFO | Logging level |
| LOG_FORMAT | json | Log format (json/text) |
| FRONTEND_URL | - | Additional CORS origin |
| LOCAL_DEV | false | Bypass E2B/auth for testing |
| SUPABASE_SYSTEM_BUCKET | gridagent-system | System data bucket name |
| SUPABASE_USER_BUCKET | gridagent-users | User data bucket name |

## Next Actions
- [x] Production hardening
- [x] Multi-tenant S3 storage mounting
- [x] Test infrastructure (30 tests passing)
- [ ] Create Supabase S3 buckets and upload system data
- [ ] Rebuild E2B template with s3fs package
- [ ] Deploy to Railway with S3 env vars
- [ ] Test with real Supabase JWT
- [ ] Integration test with frontend
- [ ] (Optional) Add Supabase persistence for session tracking
