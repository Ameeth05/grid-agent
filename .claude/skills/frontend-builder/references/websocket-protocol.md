# WebSocket/SSE Protocol Reference

Complete message type definitions for frontend-sandbox communication.

## Transport Options

GridAgent supports two transport mechanisms:

| Transport | Endpoint | Use Case |
|-----------|----------|----------|
| **SSE** (current) | GET `/events` + POST `/query` | Simpler, better firewall compatibility |
| **WebSocket** (legacy) | WS port 8080 | Bidirectional, lower latency |

The SSE implementation is now primary. See `gridagent-client-sse.ts`.

## Connection Flow

```
Frontend                          Sandbox
   |                                 |
   |-- POST /api/start-session ----->| Backend
   |<-- { api_url, session_id } -----|
   |                                 |
   |-- GET /events?session_id ------>|
   |<-- SSE stream opened ----------|
   |<-- { type: "connected" } ------|
   |                                 |
   |-- POST /query { content } ----->|
   |<-- { type: "text", content } --|
   |<-- { type: "tool_start" } -----|
   |<-- { type: "tool_result" } ----|
   |<-- { type: "done" } -----------|
```

## Outgoing Messages (Frontend -> Sandbox)

### QueryMessage
Standard text query without files.

```typescript
interface QueryMessage {
  type: "query"
  content: string
  session_id?: string
}
```

**HTTP Endpoint:** `POST /query`

**Example:**
```json
{
  "content": "What solar projects are in Virginia?",
  "session_id": "sess_abc123"
}
```

### QueryWithFilesMessage
Query with attached files (base64 encoded).

```typescript
interface QueryWithFilesMessage {
  type: "query_with_files"
  content: string
  files: FileData[]
  session_id?: string
}

interface FileData {
  filename: string
  content: string  // base64 encoded
  type: string     // MIME type
}
```

**HTTP Endpoint:** `POST /query`

**Example:**
```json
{
  "content": "Analyze this queue data",
  "session_id": "sess_abc123",
  "files": [
    {
      "filename": "queue.csv",
      "content": "UXVldWUgTnVtYmVyLFByb2plY3QgTmFtZQ...",
      "type": "text/csv"
    }
  ]
}
```

### UploadFileMessage
Upload file without query (for later reference).

```typescript
interface UploadFileMessage {
  type: "upload_file"
  filename: string
  content: string  // base64 encoded
}
```

## Incoming Messages (Sandbox -> Frontend)

All messages arrive via SSE stream from `GET /events`.

### TextMessage
Streaming text content from the agent.

```typescript
interface TextMessage {
  type: "text"
  content: string
}
```

**Handling:**
- Append to current assistant message
- If no current message, create new one with `isStreaming: true`

**Example:**
```json
{
  "type": "text",
  "content": "I found 42 solar projects in Virginia. "
}
```

### ToolStartMessage
Agent is executing a tool.

```typescript
interface ToolStartMessage {
  type: "tool_start"
  tool: string
  args: Record<string, unknown>
}
```

**Handling:**
- Create ToolExecution with `status: 'running'`
- Display in collapsible card

**Example:**
```json
{
  "type": "tool_start",
  "tool": "Read",
  "args": {
    "file_path": "/system/data/queue.csv"
  }
}
```

### ToolResultMessage
Tool execution completed.

```typescript
interface ToolResultMessage {
  type: "tool_result"
  tool: string
  result: string
}
```

**Handling:**
- Find matching running tool execution
- Update with result and `status: 'completed'`

**Example:**
```json
{
  "type": "tool_result",
  "tool": "Read",
  "result": "Queue Number,Project Name,State...\n1,Solar Farm A,VA..."
}
```

### ErrorMessage
Error during processing.

```typescript
interface ErrorMessage {
  type: "error"
  message: string
}
```

**Handling:**
- If tool running, mark as `status: 'error'`
- Append error to message content
- Set `isLoading: false`

**Example:**
```json
{
  "type": "error",
  "message": "File not found: /system/data/missing.csv"
}
```

### DoneMessage
Query processing complete.

```typescript
interface DoneMessage {
  type: "done"
  token_usage?: TokenUsage
}

interface TokenUsage {
  input_tokens: number
  output_tokens: number
  total_tokens: number
}
```

**Handling:**
- Set `isStreaming: false` on current message
- Update session token usage total
- Reset `currentAssistantMessageRef`
- Set `isLoading: false`

**Example:**
```json
{
  "type": "done",
  "token_usage": {
    "input_tokens": 1250,
    "output_tokens": 487,
    "total_tokens": 1737
  }
}
```

### ConnectionMessage
Connection state changes.

```typescript
interface ConnectionMessage {
  type: "connected" | "disconnected"
}
```

**Handling:**
- Update `connectionState` in hook
- UI displays appropriate icon

## Chat State Types

### ChatMessage
Rendered message in the UI.

```typescript
interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  toolExecutions?: ToolExecution[]
  isStreaming?: boolean
  tokenUsage?: TokenUsage
}
```

### ToolExecution
Tool execution state for display.

```typescript
interface ToolExecution {
  id: string
  tool: string
  args: Record<string, unknown>
  result?: string
  status: "running" | "completed" | "error"
}
```

### Conversation
Conversation history entry.

```typescript
interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}
```

## Session Types

### SessionInfo
From `/api/start-session` response.

```typescript
interface SessionInfo {
  ws_url: string      // Legacy WebSocket URL
  session_id: string
  resumed: boolean
}

// SSE variant
interface StartSessionResponse {
  api_url: string     // HTTP base URL for SSE
  session_id: string
  resumed: boolean
}
```

## Error Handling

### SSE Connection Errors
```typescript
eventSource.onerror = (error) => {
  if (eventSource.readyState === EventSource.CLOSED) {
    setConnectionState('disconnected')
  } else {
    setConnectionState('error')
  }
}
```

### Query Errors
```typescript
const response = await fetch(`${apiUrl}/query`, ...)
if (!response.ok) {
  const error = await response.json()
  throw new Error(error.detail || 'Query failed')
}
```

### Message Parse Errors
```typescript
eventSource.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data)
    handleMessage(data)
  } catch (e) {
    console.error('Failed to parse SSE message:', e)
    // Don't crash - ignore malformed messages
  }
}
```

## Adding New Message Types

1. **Define type** in `frontend/types/index.ts`:
   ```typescript
   export interface NewMessageType {
     type: "new_type"
     // ... fields
   }

   export type IncomingMessage =
     | TextMessage
     | ...
     | NewMessageType  // Add to union
   ```

2. **Handle in SSE client** `gridagent-client-sse.ts`:
   ```typescript
   private handleMessage(data: any) {
     switch (data.type) {
       // ... existing cases
       case 'new_type':
         this.options.onMessage({
           type: 'new_type',
           // ... map fields
         })
         break
     }
   }
   ```

3. **Process in hook** `useGridAgent.ts`:
   ```typescript
   const handleMessage = useCallback((message: IncomingMessage) => {
     switch (message.type) {
       // ... existing cases
       case 'new_type':
         // Update state as needed
         break
     }
   }, [])
   ```

4. **Update sandbox** to send new message type
