"""
Tests for GridAgent Backend API endpoints.

Tests the FastAPI application endpoints including:
- Health checks
- Readiness checks
- Session creation (in LOCAL_DEV mode)
"""

import pytest


class TestHealthEndpoint:
    """Tests for /health endpoint."""

    def test_health_returns_200(self, client):
        """Health endpoint should always return 200."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_includes_version(self, client):
        """Health response should include version."""
        response = client.get("/health")
        data = response.json()
        assert "version" in data
        assert data["version"]  # Not empty

    def test_health_includes_status(self, client):
        """Health response should include status."""
        response = client.get("/health")
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "degraded", "unhealthy"]

    def test_health_shows_local_dev_mode(self, client):
        """Health should show LOCAL_DEV mode is enabled."""
        response = client.get("/health")
        data = response.json()
        assert data["config"]["local_dev_mode"] is True


class TestReadyEndpoint:
    """Tests for /ready endpoint."""

    def test_ready_returns_200(self, client):
        """Ready endpoint should return 200 when service is ready."""
        response = client.get("/ready")
        assert response.status_code == 200

    def test_ready_returns_checks(self, client):
        """Ready response should include check results."""
        response = client.get("/ready")
        data = response.json()
        assert "ready" in data
        assert "checks" in data
        assert isinstance(data["checks"], dict)

    def test_ready_startup_complete(self, client):
        """Ready should report startup as complete."""
        response = client.get("/ready")
        data = response.json()
        assert data["checks"]["startup_complete"] is True


class TestRootEndpoint:
    """Tests for / endpoint."""

    def test_root_returns_200(self, client):
        """Root endpoint should return 200."""
        response = client.get("/")
        assert response.status_code == 200

    def test_root_includes_service_info(self, client):
        """Root should include service name and version."""
        response = client.get("/")
        data = response.json()
        assert "service" in data
        assert "version" in data
        assert "endpoints" in data


class TestStartSessionEndpoint:
    """Tests for /api/start-session endpoint."""

    def test_start_session_requires_auth(self, client):
        """Start session should require Authorization header."""
        response = client.post("/api/start-session", json={})
        assert response.status_code == 401

    def test_start_session_with_local_dev(self, client):
        """In LOCAL_DEV mode, any token should work."""
        response = client.post(
            "/api/start-session",
            json={},
            headers={"Authorization": "Bearer any-token-works-in-local-dev"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "ws_url" in data
        assert "session_id" in data

    def test_start_session_returns_ws_url(self, client):
        """Start session should return a WebSocket URL."""
        response = client.post(
            "/api/start-session",
            json={},
            headers={"Authorization": "Bearer test-token"}
        )
        data = response.json()
        assert data["ws_url"].startswith("ws")  # ws:// or wss://

    def test_start_session_with_session_id(self, client):
        """Start session with provided session_id."""
        response = client.post(
            "/api/start-session",
            json={"session_id": "my-session-123"},
            headers={"Authorization": "Bearer test-token"}
        )
        assert response.status_code == 200
        data = response.json()
        # In LOCAL_DEV, session_id might be new or resumed
        assert "session_id" in data


class TestCORSConfiguration:
    """Tests for CORS configuration."""

    def test_cors_allows_localhost(self, client):
        """CORS should allow localhost:3000."""
        response = client.options(
            "/api/start-session",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST"
            }
        )
        # OPTIONS should succeed
        assert response.status_code in [200, 204]

    def test_cors_allows_vercel(self, client):
        """CORS should allow Vercel preview deployments."""
        response = client.options(
            "/api/start-session",
            headers={
                "Origin": "https://gridagent-abc123.vercel.app",
                "Access-Control-Request-Method": "POST"
            }
        )
        assert response.status_code in [200, 204]


class TestErrorHandling:
    """Tests for error handling."""

    def test_invalid_json_returns_422(self, client):
        """Invalid JSON should return 422 Unprocessable Entity."""
        response = client.post(
            "/api/start-session",
            content="not valid json",
            headers={
                "Authorization": "Bearer test-token",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 422

    def test_missing_auth_header_message(self, client):
        """Missing auth should return helpful error message."""
        response = client.post("/api/start-session", json={})
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
