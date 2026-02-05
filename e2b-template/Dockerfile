# GridAgent E2B Sandbox Template
# Using Claude Agent SDK (bundles CLI automatically since v0.1.8+)
#
# Data files are mounted at runtime from Supabase S3:
# - /system/data/ and /system/docs/ are mounted from gridagent-system bucket
# - /user/data/ is mounted from gridagent-users bucket (per-user prefix)

FROM python:3.12-slim

# Set environment variables for optimal container behavior
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    GRIDAGENT_WS_PORT=8080

# Install system dependencies
# - curl: for health checks
# - git: for potential repo cloning in analysis
# - s3fs: for mounting Supabase S3-compatible storage at runtime
# - fuse: required by s3fs
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    s3fs \
    fuse \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Enable FUSE for non-root users (required for s3fs in container)
RUN echo "user_allow_other" >> /etc/fuse.conf

# NOTE: Node.js and Claude Code CLI are NOT needed!
# The claude-agent-sdk Python package bundles the CLI automatically (since v0.1.8+).

# Create directory structure (mount points for S3 at runtime):
# /system/data/   - Mounted from gridagent-system bucket (read-only)
# /system/docs/   - Mounted from gridagent-system bucket (read-only)
# /user/data/     - Mounted from gridagent-users bucket (read-write)
# /app/           - Application code
RUN mkdir -p /system/data /system/docs \
    && mkdir -p /user/data /user/uploads /user/results \
    && mkdir -p /app

# Set permissions:
# - /system/ is readable but write operations are blocked by agent logic
# - /user/ is fully writable for user data
RUN chmod -R 755 /system \
    && chmod -R 777 /user

# Copy requirements and install Python dependencies
# NOTE: claude-agent-sdk>=0.1.25 is required!
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code only
# System data files (skills, data, docs) are mounted at runtime from S3
COPY gridagent_server.py /app/gridagent_server.py

# Set working directory
WORKDIR /app

# Expose WebSocket port (must match e2b.toml and WS_PORT default)
EXPOSE 8080

# Environment variables injected at sandbox creation:
# Required:
# - ANTHROPIC_API_KEY: Claude API access (used by SDK)
# Optional:
# - USER_ID: User identifier for session management
# - USER_NAME: Display name for personalization
# - SESSION_ID: For session persistence across connections
# - GRIDAGENT_MODEL: Override default model (default: claude-sonnet-4-20250514)

# Start the WebSocket server
CMD ["python", "/app/gridagent_server.py"]
