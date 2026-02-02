---
name: AI Agent Code Review
description: Expert code review for AI Agent architectures - Claude Agent SDK, E2B sandboxes, multi-tenant systems, and agentic patterns
version: 1.0.0
triggers:
  - code review
  - review code
  - agent review
  - architecture review
  - security review
  - claude agent sdk
  - e2b sandbox
  - multi-tenant
  - agentic
tools_required:
  - Read
  - Glob
  - Grep
  - Bash
---

# AI Agent Code Review Skill

Expert code review specifically designed for AI Agent architectures including Claude Agent SDK integrations, E2B sandbox patterns, multi-tenant isolation, and agentic system design.

## Scope

This skill covers review of:
- **Claude Agent SDK** implementations
- **E2B Sandbox** integrations and isolation patterns
- **Multi-tenant agent** architectures
- **Skill discovery** and YAML frontmatter systems
- **Tool routing** (ping-pong loops between LLM and execution environments)
- **Streaming** implementations (SSE, WebSockets)
- **Security** patterns for code execution agents

## Review Checklist

### 1. Sandbox Isolation (Critical)

```
□ Each user session has isolated execution environment
□ No direct code execution on backend server
□ E2B/Modal/Docker container per user
□ System files are read-only
□ User files are isolated per-user
□ Sandbox cleanup on session end
□ Timeout limits on code execution
```

**Code Pattern to Look For:**
```python
# BAD: Direct execution on backend
result = subprocess.run(command, shell=True)

# GOOD: Routed to E2B sandbox
sandbox = Sandbox(template="your-template")
result = sandbox.process.start_and_wait(command)
```

### 2. Claude Agent SDK Integration

```
□ Proper tool definitions with input_schema
□ Tool results correctly formatted
□ Streaming properly handled (text_delta, tool_use, tool_result)
□ Session management for multi-turn conversations
□ Error handling for API failures
□ Token limits respected
□ System prompt is reasonable size (<2000 tokens ideal)
```

**Code Pattern to Look For:**
```python
# Check for proper agentic loop
while True:
    response = client.messages.create(...)

    if response.stop_reason == "end_turn":
        break  # Done

    # Process tool calls
    for block in response.content:
        if block.type == "tool_use":
            result = execute_tool(block)  # Should go to sandbox!
            tool_results.append(...)

    # Feed results back
    messages.append({"role": "assistant", "content": response.content})
    messages.append({"role": "user", "content": tool_results})
```

### 3. Skill Discovery System

```
□ Skills have YAML frontmatter with metadata
□ Skill index is cached (not rebuilt every request)
□ Two-phase loading: metadata first, full content on match
□ Proper YAML parser used (not string splitting)
□ Skill triggers are comprehensive
□ Skills are self-contained with data paths
```

**YAML Frontmatter Structure:**
```yaml
---
name: Skill Name
description: One-line description for system prompt
version: 1.0.0
triggers:
  - keyword1
  - keyword2
  - phrase match
tools_required:
  - Read
  - Bash
data_files:
  - /system/data/folder/*.csv
---
```

### 4. Multi-Tenant Security

```
□ User isolation at database level (RLS policies)
□ User isolation at storage level (path prefixes)
□ User isolation at sandbox level (separate instances)
□ JWT verification on all endpoints
□ No cross-user data leakage possible
□ Rate limiting per user
□ CORS properly configured (not wildcard in production)
```

### 5. API & Backend Architecture

```
□ Single database client instance (not created per-request)
□ Async operations where appropriate
□ Proper error handling with specific exceptions
□ Logging at appropriate levels
□ Environment variables for all secrets
□ Health check endpoint
□ Graceful shutdown handling
```

### 6. Frontend Integration

```
□ SSE/streaming properly parsed
□ Connection error handling with retry logic
□ Timeout handling for long operations
□ Loading states during agent execution
□ Tool use visualization for transparency
□ Thinking/reasoning display (optional)
□ Session persistence across page reloads
```

### 7. Performance Considerations

```
□ Prompt caching enabled where possible
□ Skills cached at startup
□ Sandbox pre-warming for latency reduction
□ Streaming responses (not waiting for full completion)
□ Parallel tool execution where independent
□ Database connection pooling
```

## Review Output Format

When performing a code review, output findings in this structure:

```json
{
  "type": "table",
  "title": "Code Review: [Repository Name]",
  "data": {
    "headers": ["#", "Issue", "Severity", "Location", "Impact"],
    "rows": [
      ["1", "No E2B sandbox", "Critical", "agent.py:50", "Security vulnerability"],
      ["2", "CORS wildcard", "High", "main.py:25", "Security risk"]
    ]
  },
  "summary": {
    "critical": 1,
    "high": 3,
    "medium": 5,
    "low": 2
  },
  "insights": "The codebase has critical security issues..."
}
```

## Common Anti-Patterns

### Anti-Pattern 1: Local Code Execution
```python
# DANGEROUS: Executing user-influenced code on backend
exec(user_code)
subprocess.run(user_command, shell=True)
```

### Anti-Pattern 2: Skills in System Prompt
```python
# BAD: Entire skills baked into prompt
system_prompt = f"""
{skill1_full_content}  # 500 tokens
{skill2_full_content}  # 400 tokens
{skill3_full_content}  # 600 tokens
"""  # 1500+ tokens just for skills!

# GOOD: Only metadata in prompt, load full skill on demand
system_prompt = """
Skills available: queue-analyzer, cluster-analyzer
Use Read tool to load skill when needed.
"""  # ~50 tokens
```

### Anti-Pattern 3: New Client Per Request
```python
# BAD: Creating new connections per request
async def handle_request():
    client = create_client(url, key)  # New connection every time!

# GOOD: Shared singleton
from services.database import supabase  # Shared instance
```

### Anti-Pattern 4: No Conversation History
```python
# BAD: Only current message
messages = [{"role": "user", "content": current_query}]

# GOOD: Full history for context
messages = await get_history(session_id)
messages.append({"role": "user", "content": current_query})
```

## Severity Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| 🔴 Critical | Security vulnerability, data loss risk | Must fix before deploy |
| 🟠 High | Major bug, significant security issue | Fix in current sprint |
| 🟡 Medium | Minor bug, code quality issue | Fix when convenient |
| 🟢 Low | Style, documentation, minor improvement | Optional |

## How to Use This Skill

1. **Provide repository URL or file paths** to review
2. Agent will **clone/read the codebase**
3. Agent will **analyze against checklist** above
4. Agent will **output structured findings** with severity
5. Agent will **provide specific fix recommendations**

## Example Invocations

- "Review the code at https://github.com/user/repo for AI agent best practices"
- "Do a security review of the agent.py file"
- "Check if this codebase follows E2B sandbox patterns correctly"
- "Review the skill discovery implementation"
