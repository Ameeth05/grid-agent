// ===========================================
// WebSocket Message Types
// ===========================================

// Messages sent TO the sandbox
export type OutgoingMessage =
  | QueryMessage
  | QueryWithFilesMessage
  | UploadFileMessage

export interface QueryMessage {
  type: "query"
  content: string
  session_id?: string
}

export interface QueryWithFilesMessage {
  type: "query_with_files"
  content: string
  files: FileData[]
  session_id?: string
}

export interface UploadFileMessage {
  type: "upload_file"
  filename: string
  content: string // base64 encoded
}

export interface FileData {
  filename: string
  content: string // base64 encoded
  type: string // MIME type
}

// Messages received FROM the sandbox
export type IncomingMessage =
  | TextMessage
  | ToolStartMessage
  | ToolResultMessage
  | ErrorMessage
  | DoneMessage
  | ConnectionMessage

export interface TextMessage {
  type: "text"
  content: string
}

export interface ToolStartMessage {
  type: "tool_start"
  tool: string
  args: Record<string, unknown>
}

export interface ToolResultMessage {
  type: "tool_result"
  tool: string
  result: string
}

export interface ErrorMessage {
  type: "error"
  message: string
}

export interface DoneMessage {
  type: "done"
  token_usage?: TokenUsage
}

export interface ConnectionMessage {
  type: "connected" | "disconnected"
}

export interface TokenUsage {
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

// ===========================================
// Chat Types
// ===========================================

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  toolExecutions?: ToolExecution[]
  isStreaming?: boolean
  tokenUsage?: TokenUsage
}

export interface ToolExecution {
  id: string
  tool: string
  args: Record<string, unknown>
  result?: string
  status: "running" | "completed" | "error"
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

// ===========================================
// Session Types
// ===========================================

export interface SessionInfo {
  ws_url: string
  session_id: string
  resumed: boolean
}

export interface UserProfile {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

// ===========================================
// API Response Types
// ===========================================

export interface StartSessionResponse {
  ws_url: string
  session_id: string
  resumed: boolean
}

export interface ApiError {
  error: string
  detail?: string
}
