"""
E2B Sandbox Lifecycle Manager

Handles creation, resumption, pausing, and cleanup of E2B sandboxes.
Tracks active sandboxes in memory with optional Supabase persistence.
"""

import os
import asyncio
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

# Configuration constants
TEMPLATE_ID = "gridagent"  # Must match e2b.toml id
SANDBOX_PORT = 8080
IDLE_TIMEOUT_MINUTES = 30
MAX_LIFETIME_HOURS = 24

# Local development mode - set LOCAL_DEV=true to bypass E2B
LOCAL_DEV = os.getenv("LOCAL_DEV", "false").lower() == "true"
LOCAL_WS_URL = os.getenv("LOCAL_WS_URL", "ws://localhost:8080")


@dataclass
class SandboxInfo:
    """Information about an active sandbox."""
    sandbox_id: str
    session_id: str
    user_id: str
    ws_url: str
    created_at: datetime
    last_activity: datetime
    sandbox: Optional[Any] = field(default=None, repr=False)  # e2b.Sandbox when not in LOCAL_DEV

    def is_idle(self, idle_minutes: int = IDLE_TIMEOUT_MINUTES) -> bool:
        """Check if sandbox has been idle for too long."""
        idle_threshold = datetime.utcnow() - timedelta(minutes=idle_minutes)
        return self.last_activity < idle_threshold

    def is_expired(self, max_hours: int = MAX_LIFETIME_HOURS) -> bool:
        """Check if sandbox has exceeded maximum lifetime."""
        expiry_threshold = datetime.utcnow() - timedelta(hours=max_hours)
        return self.created_at < expiry_threshold


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

        # In-memory tracking of active sandboxes
        # Key: session_id, Value: SandboxInfo
        self._sandboxes: Dict[str, SandboxInfo] = {}

        # Lock for thread-safe operations
        self._lock = asyncio.Lock()

        # Background cleanup task
        self._cleanup_task: Optional[asyncio.Task] = None

        if not self.e2b_api_key:
            logger.warning("E2B_API_KEY not set - sandbox creation will fail")
        if not self.anthropic_api_key:
            logger.warning("ANTHROPIC_API_KEY not set - agent will fail")

    def _validate_config(self) -> None:
        """Ensure required configuration is present."""
        if not self.e2b_api_key:
            raise RuntimeError("E2B_API_KEY environment variable not set")
        if not self.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY environment variable not set")

    async def create_sandbox(
        self,
        user_id: str,
        session_id: Optional[str] = None,
        user_name: Optional[str] = None
    ) -> tuple[str, str]:
        """
        Create a new E2B sandbox for a user.

        Args:
            user_id: The authenticated user's ID
            session_id: Optional session ID (generated if not provided)
            user_name: Optional user display name

        Returns:
            Tuple of (ws_url, session_id)

        Raises:
            RuntimeError: If sandbox creation fails
        """
        # Generate session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())

        logger.info(f"Creating sandbox for user={user_id}, session={session_id}")

        # LOCAL DEV MODE: Skip E2B, return localhost URL
        if LOCAL_DEV:
            logger.info(f"LOCAL_DEV mode: returning {LOCAL_WS_URL}")
            ws_url = LOCAL_WS_URL
            sandbox_info = SandboxInfo(
                sandbox_id="local-dev",
                session_id=session_id,
                user_id=user_id,
                ws_url=ws_url,
                created_at=datetime.utcnow(),
                last_activity=datetime.utcnow(),
                sandbox=None,  # No actual sandbox in local mode
            )
            async with self._lock:
                self._sandboxes[session_id] = sandbox_info
            return ws_url, session_id

        # Import e2b only when actually needed (not in LOCAL_DEV mode)
        from e2b import Sandbox

        self._validate_config()

        try:
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
                # Timeout for sandbox operations (not lifetime)
                timeout=300,  # 5 minutes for operations
            )

            # Get the WebSocket URL
            # E2B provides get_host() to get the publicly accessible hostname
            host = sandbox.get_host(SANDBOX_PORT)
            ws_url = f"wss://{host}"

            # Track the sandbox
            sandbox_info = SandboxInfo(
                sandbox_id=sandbox.id,
                session_id=session_id,
                user_id=user_id,
                ws_url=ws_url,
                created_at=datetime.utcnow(),
                last_activity=datetime.utcnow(),
                sandbox=sandbox,
            )

            async with self._lock:
                self._sandboxes[session_id] = sandbox_info

            logger.info(f"Sandbox created: id={sandbox.id}, ws_url={ws_url}")

            return ws_url, session_id

        except Exception as e:
            logger.error(f"Failed to create sandbox: {e}")
            raise RuntimeError(f"Failed to create sandbox: {str(e)}")

    async def resume_sandbox(self, session_id: str) -> Optional[str]:
        """
        Resume an existing sandbox by session_id.

        Args:
            session_id: The session ID to resume

        Returns:
            WebSocket URL if sandbox exists and is valid, None otherwise
        """
        async with self._lock:
            sandbox_info = self._sandboxes.get(session_id)

        if not sandbox_info:
            logger.info(f"No sandbox found for session: {session_id}")
            return None

        # Check if expired
        if sandbox_info.is_expired():
            logger.info(f"Sandbox expired for session: {session_id}")
            await self.kill_sandbox(session_id)
            return None

        # Update last activity
        sandbox_info.last_activity = datetime.utcnow()

        logger.info(f"Resuming sandbox for session: {session_id}")
        return sandbox_info.ws_url

    async def pause_sandbox(self, session_id: str) -> bool:
        """
        Pause a sandbox (currently just removes from active tracking).

        Note: E2B sandboxes don't have a true "pause" state in the basic SDK.
        This method prepares for future pause/resume functionality.

        Args:
            session_id: The session to pause

        Returns:
            True if sandbox was paused, False if not found
        """
        async with self._lock:
            sandbox_info = self._sandboxes.get(session_id)

        if not sandbox_info:
            return False

        logger.info(f"Pausing sandbox for session: {session_id}")

        # For now, we just mark it as paused by keeping it in memory
        # In production, you might want to persist the sandbox_id to Supabase
        # and use Sandbox.reconnect() later

        return True

    async def kill_sandbox(self, session_id: str) -> bool:
        """
        Kill and remove a sandbox.

        Args:
            session_id: The session to kill

        Returns:
            True if sandbox was killed, False if not found
        """
        async with self._lock:
            sandbox_info = self._sandboxes.pop(session_id, None)

        if not sandbox_info:
            return False

        logger.info(f"Killing sandbox for session: {session_id}")

        try:
            if sandbox_info.sandbox:
                sandbox_info.sandbox.kill()
            return True
        except Exception as e:
            logger.error(f"Error killing sandbox {session_id}: {e}")
            return False

    async def update_activity(self, session_id: str) -> None:
        """Update last activity timestamp for a session."""
        async with self._lock:
            sandbox_info = self._sandboxes.get(session_id)
            if sandbox_info:
                sandbox_info.last_activity = datetime.utcnow()

    async def cleanup_idle_sandboxes(self) -> int:
        """
        Clean up idle and expired sandboxes.

        Returns:
            Number of sandboxes cleaned up
        """
        cleaned = 0
        sessions_to_clean = []

        async with self._lock:
            for session_id, info in self._sandboxes.items():
                if info.is_expired():
                    logger.info(f"Sandbox {session_id} expired (created {info.created_at})")
                    sessions_to_clean.append(session_id)
                elif info.is_idle():
                    logger.info(f"Sandbox {session_id} idle (last activity {info.last_activity})")
                    sessions_to_clean.append(session_id)

        for session_id in sessions_to_clean:
            if await self.kill_sandbox(session_id):
                cleaned += 1

        if cleaned > 0:
            logger.info(f"Cleaned up {cleaned} sandboxes")

        return cleaned

    async def start_cleanup_loop(self, interval_minutes: int = 5) -> None:
        """
        Start background cleanup task.

        Args:
            interval_minutes: How often to run cleanup
        """
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
        logger.info(f"Started cleanup loop (interval: {interval_minutes} min)")

    async def stop_cleanup_loop(self) -> None:
        """Stop the background cleanup task."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None
            logger.info("Stopped cleanup loop")

    async def get_stats(self) -> dict:
        """Get current sandbox statistics."""
        async with self._lock:
            total = len(self._sandboxes)
            idle = sum(1 for s in self._sandboxes.values() if s.is_idle())

        return {
            "total_sandboxes": total,
            "idle_sandboxes": idle,
            "active_sandboxes": total - idle,
        }

    async def shutdown(self) -> None:
        """Gracefully shutdown all sandboxes."""
        await self.stop_cleanup_loop()

        async with self._lock:
            sessions = list(self._sandboxes.keys())

        for session_id in sessions:
            await self.kill_sandbox(session_id)

        logger.info("SandboxManager shutdown complete")


# Global sandbox manager instance
_manager: Optional[SandboxManager] = None


def get_sandbox_manager() -> SandboxManager:
    """Get or create the global sandbox manager instance."""
    global _manager
    if _manager is None:
        _manager = SandboxManager()
    return _manager
