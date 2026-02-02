# E2B Sandbox Integration

Detailed patterns for E2B sandbox lifecycle management in GridAgent.

## Table of Contents

1. [SandboxManager Overview](#sandboxmanager-overview)
2. [Creating Sandboxes](#creating-sandboxes)
3. [Resuming Sandboxes](#resuming-sandboxes)
4. [Pausing and Killing](#pausing-and-killing)
5. [Background Cleanup](#background-cleanup)
6. [Configuration Constants](#configuration-constants)

## SandboxManager Overview

The `SandboxManager` class manages the complete E2B sandbox lifecycle:

```python
class SandboxManager:
    """
    Manages E2B sandbox lifecycle.

    Features:
    - Create new sandboxes with environment variables
    - Resume existing sandboxes by session_id
    - Pause idle sandboxes
    - Kill expired sandboxes
    - Background cleanup task
    """

    def __init__(self):
        self.e2b_api_key = os.getenv("E2B_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self._sandboxes: Dict[str, SandboxInfo] = {}  # In-memory tracking
        self._lock = asyncio.Lock()  # Thread-safe operations
        self._cleanup_task: Optional[asyncio.Task] = None
```

## Creating Sandboxes

### create_sandbox() Method

```python
async def create_sandbox(
    self,
    user_id: str,
    session_id: Optional[str] = None,
    user_name: Optional[str] = None
) -> tuple[str, str]:
    """
    Create a new E2B sandbox for a user.

    Returns:
        Tuple of (ws_url, session_id)
    """
    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())

    # Create the sandbox with environment variables
    sandbox = Sandbox(
        template=TEMPLATE_ID,
        api_key=self.e2b_api_key,
        env_vars={
            "ANTHROPIC_API_KEY": self.anthropic_api_key,
            "USER_ID": user_id,
            "USER_NAME": user_name or "",
            "SESSION_ID": session_id,
        },
        timeout=300,  # 5 minutes for operations
    )

    # Get the WebSocket URL
    host = sandbox.get_host(SANDBOX_PORT)
    ws_url = f"wss://{host}"

    return ws_url, session_id
```

### Environment Variables Injected

| Variable | Source | Purpose |
|----------|--------|---------|
| ANTHROPIC_API_KEY | Backend env | Claude API access |
| USER_ID | JWT claims | User identification |
| USER_NAME | JWT claims | Display name |
| SESSION_ID | Generated/provided | Session tracking |

## Resuming Sandboxes

### resume_sandbox() Method

```python
async def resume_sandbox(self, session_id: str) -> Optional[str]:
    """
    Resume an existing sandbox by session_id.

    Returns:
        WebSocket URL if sandbox exists and is valid, None otherwise
    """
    sandbox_info = self._sandboxes.get(session_id)

    if not sandbox_info:
        return None

    # Check if expired (max 24h lifetime)
    if sandbox_info.is_expired():
        await self.kill_sandbox(session_id)
        return None

    # Update last activity
    sandbox_info.last_activity = datetime.utcnow()

    return sandbox_info.ws_url
```

### SandboxInfo Data Class

```python
@dataclass
class SandboxInfo:
    """Information about an active sandbox."""
    sandbox_id: str
    session_id: str
    user_id: str
    ws_url: str
    created_at: datetime
    last_activity: datetime
    sandbox: Optional[Any] = None  # e2b.Sandbox instance

    def is_idle(self, idle_minutes: int = 30) -> bool:
        """Check if sandbox has been idle for too long."""
        idle_threshold = datetime.utcnow() - timedelta(minutes=idle_minutes)
        return self.last_activity < idle_threshold

    def is_expired(self, max_hours: int = 24) -> bool:
        """Check if sandbox has exceeded maximum lifetime."""
        expiry_threshold = datetime.utcnow() - timedelta(hours=max_hours)
        return self.created_at < expiry_threshold
```

## Pausing and Killing

### pause_sandbox() Method

```python
async def pause_sandbox(self, session_id: str) -> bool:
    """
    Pause a sandbox (mark for later resumption).

    Note: E2B basic SDK doesn't have true pause state.
    For production, persist sandbox_id to Supabase and use Sandbox.reconnect() later.
    """
    sandbox_info = self._sandboxes.get(session_id)
    if not sandbox_info:
        return False

    # Keep in memory for now (production: persist to DB)
    return True
```

### kill_sandbox() Method

```python
async def kill_sandbox(self, session_id: str) -> bool:
    """Kill and remove a sandbox."""
    sandbox_info = self._sandboxes.pop(session_id, None)

    if not sandbox_info:
        return False

    try:
        if sandbox_info.sandbox:
            sandbox_info.sandbox.kill()
        return True
    except Exception as e:
        logger.error(f"Error killing sandbox {session_id}: {e}")
        return False
```

## Background Cleanup

### Cleanup Loop

```python
async def start_cleanup_loop(self, interval_minutes: int = 5) -> None:
    """Start background cleanup task."""
    async def cleanup_loop():
        while True:
            try:
                await asyncio.sleep(interval_minutes * 60)
                await self.cleanup_idle_sandboxes()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")

    self._cleanup_task = asyncio.create_task(cleanup_loop())
```

### cleanup_idle_sandboxes() Method

```python
async def cleanup_idle_sandboxes(self) -> int:
    """
    Clean up idle and expired sandboxes.

    Returns:
        Number of sandboxes cleaned up
    """
    sessions_to_clean = []

    for session_id, info in self._sandboxes.items():
        if info.is_expired():
            sessions_to_clean.append(session_id)
        elif info.is_idle():
            sessions_to_clean.append(session_id)

    for session_id in sessions_to_clean:
        await self.kill_sandbox(session_id)

    return len(sessions_to_clean)
```

## Configuration Constants

```python
# Must match e2b.toml id exactly!
TEMPLATE_ID = "gridagent"

# Port where agent WebSocket server listens
SANDBOX_PORT = 8080

# Idle timeout before cleanup
IDLE_TIMEOUT_MINUTES = 30

# Maximum sandbox lifetime
MAX_LIFETIME_HOURS = 24
```

## Singleton Pattern

```python
# Global sandbox manager instance
_manager: Optional[SandboxManager] = None

def get_sandbox_manager() -> SandboxManager:
    """Get or create the global sandbox manager instance."""
    global _manager
    if _manager is None:
        _manager = SandboxManager()
    return _manager
```

## FastAPI Integration

### Lifespan Handler

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    manager = get_sandbox_manager()
    await manager.start_cleanup_loop(interval_minutes=5)

    yield

    # Shutdown
    await manager.shutdown()
```

### Dependency Injection

```python
def get_manager() -> SandboxManager:
    """Dependency to get sandbox manager."""
    return get_sandbox_manager()

# Usage in endpoint
@app.post("/api/start-session")
async def start_session(
    manager: SandboxManager = Depends(get_manager),
):
    ...
```

## Error Handling

Always wrap E2B operations in try/except:

```python
try:
    ws_url, session_id = await manager.create_sandbox(
        user_id=user.user_id,
        user_name=user.user_name,
    )
except RuntimeError as e:
    logger.error(f"Failed to create sandbox: {e}")
    raise HTTPException(
        status_code=500,
        detail=f"Failed to create sandbox: {str(e)}"
    )
```
