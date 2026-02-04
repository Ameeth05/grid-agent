# GridAgent E2B Sandbox Template
# Using Claude Agent SDK (bundles CLI automatically since v0.1.8+)
#
# BUILD CONTEXT: This Dockerfile is built from the e2b-template/ directory.
# Before building, run the data sync script to populate system/data/ and system/docs/
# Example: python sync_data.py (or manually copy files from ../Data/)

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

# Create directory structure with proper organization:
# /system/          - Read-only system files (enforced by agent logic)
#   /system/skills/ - Skill markdown files
#   /system/data/   - Pre-loaded grid data (CSV, JSON)
#     /system/data/Interconnection Queue/  - PJM queue data
#     /system/data/Cluster Results/        - Phase study results
#   /system/docs/   - Reference documentation (PDFs, manuals)
#     /system/docs/Interconnection Manual/ - PJM manuals
# /user/           - Read-write user files
#   /user/uploads/ - Files uploaded by users
#   /user/results/ - Analysis outputs
# /app/            - Application code
RUN mkdir -p /system/skills \
    && mkdir -p "/system/data/Interconnection Queue" \
    && mkdir -p "/system/data/Cluster Results/TC2 Phase 1" \
    && mkdir -p "/system/docs/Interconnection Manual/Manual 14A" \
    && mkdir -p /user/uploads /user/results \
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

# Copy system files in order of change frequency (for optimal caching):
# 1. Skills (change rarely)
COPY system/skills/ /system/skills/

# 2. Data files (change occasionally) - these should be synced before build
# If system/data/ is empty, the agent will still work but have no pre-loaded data
COPY system/data/ /system/data/

# 3. Documentation (change rarely)
COPY system/docs/ /system/docs/

# 4. Application code (changes frequently)
COPY gridagent_server.py /app/gridagent_server.py
COPY gridagent_server_sse.py /app/gridagent_server_sse.py

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

# Health check via HTTP endpoint (gridagent_server.py handles /health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the WebSocket server using the main server
CMD ["python", "/app/gridagent_server.py"]
