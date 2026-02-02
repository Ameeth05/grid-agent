"""
GridAgent Backend Orchestrator

A THIN FastAPI backend for authentication and sandbox lifecycle management.
This backend does NOT proxy WebSocket traffic - frontend connects directly to sandbox.

Endpoints:
- POST /api/start-session: Verify JWT, create/resume sandbox, return ws_url
- GET /health: Health check with diagnostics
- GET /ready: Readiness check for deployment

Architecture:
- Frontend (Vercel) <-> This Backend (Railway) <-> E2B Sandbox
- Frontend connects DIRECTLY to sandbox WebSocket, NOT through this backend
"""

import os
import sys
import logging
from typing import Optional
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from auth import verify_jwt_async, AuthError, UserInfo
from sandbox_manager import get_sandbox_manager, SandboxManager, TEMPLATE_ID

# Load environment variables
load_dotenv()

# Configure structured logging for production
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = os.getenv("LOG_FORMAT", "json")

if LOG_FORMAT == "json":
    # JSON format for production (easier to parse in Railway/Datadog)
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL, logging.INFO),
        format='{"timestamp":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
        datefmt="%Y-%m-%dT%H:%M:%S%z"
    )
else:
    # Human-readable format for local development
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL, logging.INFO),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

logger = logging.getLogger(__name__)

# Application version (update on releases)
APP_VERSION = "1.1.0"
STARTUP_TIME: Optional[datetime] = None


# --- Request/Response Models ---

class StartSessionRequest(BaseModel):
    """Request body for starting a session."""
    session_id: Optional[str] = Field(
        default=None,
        description="Optional session ID to resume. If not provided, a new session is created.",
        min_length=1,
        max_length=100
    )


class StartSessionResponse(BaseModel):
    """Response for session start."""
    ws_url: str = Field(..., description="WebSocket URL for direct frontend connection")
    session_id: str = Field(..., description="Unique session identifier")
    resumed: bool = Field(default=False, description="Whether an existing session was resumed")


class HealthResponse(BaseModel):
    """Health check response with diagnostics."""
    status: str = Field(..., description="Service status: healthy, degraded, or unhealthy")
    version: str = Field(..., description="Application version")
    uptime_seconds: Optional[float] = Field(None, description="Seconds since startup")
    sandbox_stats: Optional[dict] = Field(None, description="Sandbox statistics")
    config: Optional[dict] = Field(None, description="Configuration status (no secrets)")


class ReadyResponse(BaseModel):
    """Readiness check response."""
    ready: bool = Field(..., description="Whether the service is ready to accept requests")
    checks: dict = Field(..., description="Individual check results")


class ErrorResponse(BaseModel):
    """Error response."""
    error: str = Field(..., description="Error type")
    detail: Optional[str] = Field(None, description="Detailed error message")
    request_id: Optional[str] = Field(None, description="Request ID for debugging")


# --- Lifespan Management ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    Starts background tasks on startup, cleans up on shutdown.
    """
    global STARTUP_TIME

    # Startup
    logger.info(f"Starting GridAgent Backend Orchestrator v{APP_VERSION}")
    STARTUP_TIME = datetime.now(timezone.utc)

    # Log configuration (without secrets)
    logger.info(f"Configuration: TEMPLATE_ID={TEMPLATE_ID}, LOCAL_DEV={os.getenv('LOCAL_DEV', 'false')}")

    # Validate critical environment variables at startup
    missing_vars = []
    for var in ["E2B_API_KEY", "ANTHROPIC_API_KEY"]:
        if not os.getenv(var) and os.getenv("LOCAL_DEV", "false").lower() != "true":
            missing_vars.append(var)

    if missing_vars:
        logger.warning(f"Missing environment variables (required for production): {missing_vars}")

    manager = get_sandbox_manager()
    await manager.start_cleanup_loop(interval_minutes=5)

    logger.info(f"Backend started successfully on port {os.getenv('PORT', '8000')}")

    yield

    # Shutdown
    logger.info("Shutting down GridAgent Backend...")
    await manager.shutdown()
    logger.info("Shutdown complete")


# --- FastAPI Application ---

app = FastAPI(
    title="GridAgent Backend Orchestrator",
    description="Authentication and sandbox lifecycle management for GridAgent",
    version=APP_VERSION,
    lifespan=lifespan,
)

# CORS configuration for frontend access
# Note: allow_origin_regex is needed for wildcard patterns
frontend_url = os.getenv("FRONTEND_URL", "")
allowed_origins = ["http://localhost:3000"]  # Local development
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # All Vercel preview deployments
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# --- Dependencies ---

async def get_current_user(authorization: Optional[str] = Header(None)) -> UserInfo:
    """
    FastAPI dependency to verify JWT and get current user.

    Args:
        authorization: Authorization header value (Bearer token)

    Returns:
        UserInfo with user_id and user_name

    Raises:
        HTTPException: 401 if auth fails, 500 if server config error
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )

    try:
        user_id, user_name = await verify_jwt_async(authorization)
        return UserInfo(user_id=user_id, user_name=user_name)
    except AuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )


def get_manager() -> SandboxManager:
    """Dependency to get sandbox manager."""
    return get_sandbox_manager()


# --- Endpoints ---

@app.post(
    "/api/start-session",
    response_model=StartSessionResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Authentication failed"},
        500: {"model": ErrorResponse, "description": "Server error"},
    }
)
async def start_session(
    request: StartSessionRequest,
    user: UserInfo = Depends(get_current_user),
    manager: SandboxManager = Depends(get_manager),
):
    """
    Start or resume a sandbox session.

    1. Verify JWT token (done by dependency)
    2. If session_id provided, try to resume existing sandbox
    3. If no existing sandbox, create a new one
    4. Return WebSocket URL for direct frontend connection

    The frontend should then connect DIRECTLY to the returned ws_url.
    This backend does NOT proxy WebSocket traffic.
    """
    logger.info(f"Start session request from user={user.user_id}")

    # Try to resume existing session
    if request.session_id:
        ws_url = await manager.resume_sandbox(request.session_id)
        if ws_url:
            logger.info(f"Resumed session {request.session_id}")
            return StartSessionResponse(
                ws_url=ws_url,
                session_id=request.session_id,
                resumed=True
            )
        else:
            logger.info(f"Session {request.session_id} not found or expired, creating new")

    # Create new sandbox
    try:
        ws_url, session_id = await manager.create_sandbox(
            user_id=user.user_id,
            session_id=request.session_id,  # Reuse provided ID if any
            user_name=user.user_name,
        )

        logger.info(f"Created new session {session_id} for user {user.user_id}")

        return StartSessionResponse(
            ws_url=ws_url,
            session_id=session_id,
            resumed=False
        )

    except RuntimeError as e:
        logger.error(f"Failed to create sandbox: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create sandbox: {str(e)}"
        )


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Operations"]
)
async def health_check(
    manager: SandboxManager = Depends(get_manager)
):
    """
    Health check endpoint with comprehensive diagnostics.

    Returns service status, version, uptime, and sandbox statistics.
    Useful for monitoring and debugging deployment issues.
    """
    stats = await manager.get_stats()

    # Calculate uptime
    uptime_seconds = None
    if STARTUP_TIME:
        uptime_seconds = (datetime.now(timezone.utc) - STARTUP_TIME).total_seconds()

    # Check configuration status (no secrets exposed)
    config_status = {
        "e2b_configured": bool(os.getenv("E2B_API_KEY")),
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "supabase_configured": bool(os.getenv("SUPABASE_JWT_SECRET")),
        "local_dev_mode": os.getenv("LOCAL_DEV", "false").lower() == "true",
        "template_id": TEMPLATE_ID,
    }

    # Determine overall health status
    if os.getenv("LOCAL_DEV", "false").lower() == "true":
        status = "healthy"  # Local dev mode always healthy
    elif not all([config_status["e2b_configured"], config_status["anthropic_configured"]]):
        status = "degraded"  # Missing critical config
    else:
        status = "healthy"

    return HealthResponse(
        status=status,
        version=APP_VERSION,
        uptime_seconds=uptime_seconds,
        sandbox_stats=stats,
        config=config_status
    )


@app.get(
    "/ready",
    response_model=ReadyResponse,
    tags=["Operations"]
)
async def readiness_check(
    manager: SandboxManager = Depends(get_manager)
):
    """
    Readiness check for Kubernetes/Railway deployment.

    Returns whether the service is ready to accept requests.
    Use this for load balancer health checks.
    """
    checks = {
        "startup_complete": STARTUP_TIME is not None,
        "manager_initialized": manager is not None,
    }

    # In production mode, check that required config exists
    if os.getenv("LOCAL_DEV", "false").lower() != "true":
        checks["e2b_configured"] = bool(os.getenv("E2B_API_KEY"))
        checks["anthropic_configured"] = bool(os.getenv("ANTHROPIC_API_KEY"))

    ready = all(checks.values())

    return ReadyResponse(ready=ready, checks=checks)


@app.get("/", tags=["Operations"])
async def root():
    """Root endpoint - provides service information and links."""
    return {
        "service": "GridAgent Backend Orchestrator",
        "version": APP_VERSION,
        "description": "Thin FastAPI backend for auth and E2B sandbox lifecycle",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "ready": "/ready",
            "start_session": "/api/start-session"
        }
    }


# --- Error Handlers ---

@app.exception_handler(AuthError)
async def auth_error_handler(request: Request, exc: AuthError):
    """Handle authentication errors with proper JSON response."""
    logger.warning(f"Auth error: {exc.message} (path={request.url.path})")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "authentication_failed",
            "detail": exc.message
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions with proper JSON response."""
    logger.error(f"Unhandled exception: {type(exc).__name__}: {exc} (path={request.url.path})")
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "detail": "An unexpected error occurred. Please try again later."
        }
    )


# --- Main Entry Point ---

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    env = os.getenv("ENV", "production")
    log_level = os.getenv("LOG_LEVEL", "info").lower()

    logger.info(f"Starting uvicorn server on port {port} (env={env})")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=env == "development",
        log_level=log_level,
        access_log=env != "production"  # Disable access log in production (handled by Railway)
    )
