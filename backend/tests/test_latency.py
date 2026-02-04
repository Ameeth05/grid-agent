"""
Latency benchmarks for GridAgent Backend.

Measures response times for:
- API endpoint latency (health, ready, start-session)
- WebSocket round-trip (message to response)
- Full user journey (auth → session → first response)

Run with: pytest tests/test_latency.py -v --tb=short
Run benchmarks only: pytest tests/test_latency.py -v -k "benchmark"
"""

import time
import statistics
import asyncio
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from dataclasses import dataclass
from typing import List

import websockets


@dataclass
class LatencyResult:
    """Container for latency measurement results."""
    name: str
    samples: List[float]

    @property
    def min_ms(self) -> float:
        return min(self.samples) * 1000

    @property
    def max_ms(self) -> float:
        return max(self.samples) * 1000

    @property
    def avg_ms(self) -> float:
        return statistics.mean(self.samples) * 1000

    @property
    def p50_ms(self) -> float:
        return statistics.median(self.samples) * 1000

    @property
    def p95_ms(self) -> float:
        sorted_samples = sorted(self.samples)
        idx = int(len(sorted_samples) * 0.95)
        return sorted_samples[idx] * 1000

    def __str__(self) -> str:
        return (
            f"{self.name}:\n"
            f"  min: {self.min_ms:.2f}ms | avg: {self.avg_ms:.2f}ms | "
            f"p50: {self.p50_ms:.2f}ms | p95: {self.p95_ms:.2f}ms | max: {self.max_ms:.2f}ms"
        )


def measure_latency(func, iterations: int = 100) -> LatencyResult:
    """Measure function execution latency over multiple iterations."""
    samples = []
    # Warmup
    for _ in range(5):
        func()
    # Measure
    for _ in range(iterations):
        start = time.perf_counter()
        func()
        end = time.perf_counter()
        samples.append(end - start)
    return LatencyResult(name=func.__name__, samples=samples)


class TestAPIEndpointLatency:
    """Benchmark API endpoint response times."""

    def test_benchmark_health_endpoint(self, client):
        """Benchmark /health endpoint latency."""
        def call_health():
            return client.get("/health")

        result = measure_latency(call_health, iterations=100)
        print(f"\n{result}")

        # Assertions - health should be fast
        assert result.avg_ms < 50, f"Health endpoint too slow: {result.avg_ms:.2f}ms avg"
        assert result.p95_ms < 100, f"Health p95 too slow: {result.p95_ms:.2f}ms"

    def test_benchmark_ready_endpoint(self, client):
        """Benchmark /ready endpoint latency."""
        def call_ready():
            return client.get("/ready")

        result = measure_latency(call_ready, iterations=100)
        print(f"\n{result}")

        assert result.avg_ms < 50, f"Ready endpoint too slow: {result.avg_ms:.2f}ms avg"

    def test_benchmark_root_endpoint(self, client):
        """Benchmark / root endpoint latency."""
        def call_root():
            return client.get("/")

        result = measure_latency(call_root, iterations=100)
        print(f"\n{result}")

        assert result.avg_ms < 50, f"Root endpoint too slow: {result.avg_ms:.2f}ms avg"

    def test_benchmark_start_session(self, client):
        """Benchmark /api/start-session endpoint latency (LOCAL_DEV mode)."""
        def call_start_session():
            return client.post(
                "/api/start-session",
                json={},
                headers={"Authorization": "Bearer test-token"}
            )

        result = measure_latency(call_start_session, iterations=50)
        print(f"\n{result}")

        # Session creation is more complex
        assert result.avg_ms < 100, f"Start session too slow: {result.avg_ms:.2f}ms avg"
        assert result.p95_ms < 200, f"Start session p95 too slow: {result.p95_ms:.2f}ms"


class TestWebSocketLatency:
    """Test WebSocket round-trip latency with mock agent."""

    @pytest.fixture
    def mock_ws_server(self):
        """Create a mock WebSocket server for latency testing."""
        messages_received = []

        async def handler(websocket):
            async for message in websocket:
                messages_received.append(message)
                # Simulate agent response delay
                await asyncio.sleep(0.01)  # 10ms simulated processing
                await websocket.send(f'{{"type":"response","content":"Echo: {message}"}}')

        return handler, messages_received

    @pytest.mark.asyncio
    async def test_benchmark_ws_roundtrip_mock(self):
        """Benchmark WebSocket round-trip with mocked response."""
        samples = []

        # Mock WebSocket for testing without real server
        mock_ws = AsyncMock()
        mock_ws.send = AsyncMock()
        mock_ws.recv = AsyncMock(return_value='{"type":"response","content":"test"}')

        for _ in range(50):
            start = time.perf_counter()
            await mock_ws.send('{"type":"message","content":"test"}')
            await mock_ws.recv()
            end = time.perf_counter()
            samples.append(end - start)

        result = LatencyResult(name="ws_roundtrip_mock", samples=samples)
        print(f"\n{result}")

        # Mock should be very fast
        assert result.avg_ms < 5, f"Mock WS roundtrip too slow: {result.avg_ms:.2f}ms"


class TestUserJourneyLatency:
    """Test full user journey latency (auth → session → response)."""

    def test_benchmark_full_journey_local_dev(self, client):
        """Benchmark full journey in LOCAL_DEV mode."""
        samples = []

        for _ in range(20):
            start = time.perf_counter()

            # Step 1: Health check (simulates initial load)
            health_resp = client.get("/health")
            assert health_resp.status_code == 200

            # Step 2: Ready check
            ready_resp = client.get("/ready")
            assert ready_resp.status_code == 200

            # Step 3: Start session with auth
            session_resp = client.post(
                "/api/start-session",
                json={},
                headers={"Authorization": "Bearer test-token"}
            )
            assert session_resp.status_code == 200

            end = time.perf_counter()
            samples.append(end - start)

        result = LatencyResult(name="full_journey_local_dev", samples=samples)
        print(f"\n{result}")

        # Full journey should complete quickly
        assert result.avg_ms < 200, f"Full journey too slow: {result.avg_ms:.2f}ms avg"
        assert result.p95_ms < 400, f"Full journey p95 too slow: {result.p95_ms:.2f}ms"

    def test_benchmark_concurrent_sessions(self, client):
        """Benchmark multiple concurrent session creations."""
        import concurrent.futures

        def create_session(session_num):
            start = time.perf_counter()
            resp = client.post(
                "/api/start-session",
                json={"session_id": f"session-{session_num}"},
                headers={"Authorization": "Bearer test-token"}
            )
            end = time.perf_counter()
            return end - start, resp.status_code

        # Test with 10 concurrent sessions
        samples = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(create_session, i) for i in range(10)]
            for future in concurrent.futures.as_completed(futures):
                latency, status = future.result()
                assert status == 200
                samples.append(latency)

        result = LatencyResult(name="concurrent_sessions_10", samples=samples)
        print(f"\n{result}")

        # Concurrent should still be reasonable
        assert result.avg_ms < 300, f"Concurrent sessions too slow: {result.avg_ms:.2f}ms avg"


class TestLatencyReporting:
    """Generate latency report for all endpoints."""

    def test_generate_latency_report(self, client):
        """Generate comprehensive latency report."""
        results = []

        # Test all endpoints
        endpoints = [
            ("GET", "/health", None),
            ("GET", "/ready", None),
            ("GET", "/", None),
            ("POST", "/api/start-session", {"Authorization": "Bearer test-token"}),
        ]

        for method, path, headers in endpoints:
            def make_request(m=method, p=path, h=headers):
                if m == "GET":
                    return client.get(p)
                else:
                    return client.post(p, json={}, headers=h)

            result = measure_latency(make_request, iterations=50)
            result.name = f"{method} {path}"
            results.append(result)

        # Print report
        print("\n" + "=" * 60)
        print("LATENCY REPORT - GridAgent Backend (LOCAL_DEV mode)")
        print("=" * 60)
        for result in results:
            print(result)
            print("-" * 60)

        # Summary
        print("\nSUMMARY:")
        print(f"  Total endpoints tested: {len(results)}")
        all_avgs = [r.avg_ms for r in results]
        print(f"  Overall avg latency: {statistics.mean(all_avgs):.2f}ms")
        print(f"  Slowest endpoint: {max(results, key=lambda r: r.avg_ms).name}")
        print("=" * 60)
