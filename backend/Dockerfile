# GridAgent Backend Orchestrator Dockerfile
# Thin FastAPI backend for auth + sandbox lifecycle management
# Deploy target: Railway
#
# Build: docker build -t gridagent-backend .
# Run:   docker run -p 8000:8000 --env-file .env gridagent-backend

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Set environment defaults
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

# Install system dependencies (minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose default port (Railway can override via PORT env var)
EXPOSE 8000

# Health check using the /ready endpoint (better for container orchestration)
# Note: Railway uses $PORT, so we check the actual port via shell
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/ready || exit 1

# Start the application
# Use shell form to expand $PORT environment variable (set by Railway)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
