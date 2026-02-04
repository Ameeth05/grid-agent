"""
Shared test fixtures for GridAgent backend tests.

These fixtures provide mocked versions of external services (E2B, Supabase)
so tests can run without real credentials or network access.
"""

import os
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime, timezone, timedelta

import jwt
from fastapi.testclient import TestClient


# Set LOCAL_DEV before importing app to ensure consistent behavior
os.environ["LOCAL_DEV"] = "true"


@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Set up test environment variables."""
    os.environ["LOCAL_DEV"] = "true"
    os.environ["SUPABASE_JWT_SECRET"] = "test-secret-key-for-testing-only"
    os.environ["SUPABASE_URL"] = "https://test.supabase.co"
    yield
    # Cleanup handled automatically


@pytest.fixture
def client():
    """
    FastAPI TestClient for making HTTP requests.

    Uses LOCAL_DEV mode so no real E2B sandboxes are created.
    """
    from main import app
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_e2b_sandbox():
    """
    Mock E2B Sandbox class.

    Returns a mock sandbox that simulates E2B behavior without
    actually creating real sandboxes.
    """
    with patch('sandbox_manager.Sandbox') as mock_sandbox_class:
        mock_sandbox = MagicMock()
        mock_sandbox.id = "test-sandbox-id"
        mock_sandbox.get_host.return_value = "test-sandbox.e2b.dev"
        mock_sandbox.kill = MagicMock()
        mock_sandbox_class.return_value = mock_sandbox
        yield mock_sandbox_class


@pytest.fixture
def jwt_secret():
    """Get the test JWT secret."""
    return "test-secret-key-for-testing-only"


@pytest.fixture
def valid_jwt_token(jwt_secret):
    """
    Generate a valid JWT token for testing.

    This token is properly signed and has valid claims,
    suitable for testing the happy path.
    """
    payload = {
        "sub": "test-user-123",
        "email": "test@example.com",
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc),
        "user_metadata": {
            "full_name": "Test User"
        }
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")


@pytest.fixture
def expired_jwt_token(jwt_secret):
    """
    Generate an expired JWT token for testing.

    Used to test token expiration handling.
    """
    payload = {
        "sub": "test-user-123",
        "email": "test@example.com",
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),  # Expired
        "iat": datetime.now(timezone.utc) - timedelta(hours=2),
        "user_metadata": {
            "full_name": "Test User"
        }
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")


@pytest.fixture
def invalid_signature_token():
    """
    Generate a token with invalid signature.

    Signed with wrong secret to test signature verification.
    """
    payload = {
        "sub": "test-user-123",
        "email": "test@example.com",
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, "wrong-secret", algorithm="HS256")


@pytest.fixture
def mock_sandbox_manager():
    """
    Mock the entire SandboxManager for isolated testing.

    Use this when you want to test endpoints without any
    sandbox manager behavior.
    """
    with patch('main.get_sandbox_manager') as mock_get_manager:
        mock_manager = MagicMock()
        mock_manager.create_sandbox = AsyncMock(
            return_value=("wss://test-sandbox.e2b.dev", "test-session-123")
        )
        mock_manager.resume_sandbox = AsyncMock(return_value=None)
        mock_manager.get_stats = AsyncMock(return_value={
            "active_sandboxes": 0,
            "total_created": 0
        })
        mock_manager.start_cleanup_loop = AsyncMock()
        mock_manager.shutdown = AsyncMock()
        mock_get_manager.return_value = mock_manager
        yield mock_manager
