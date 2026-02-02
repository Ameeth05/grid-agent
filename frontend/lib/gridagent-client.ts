/**
 * GridAgent WebSocket Client
 *
 * Handles direct WebSocket communication with the E2B sandbox.
 * The frontend connects directly to the sandbox (no proxy through backend).
 */

import type {
  OutgoingMessage,
  IncomingMessage,
  FileData,
  TokenUsage,
} from '@/types'

// Local development mode - bypass backend for direct WS connection
const LOCAL_DEV = process.env.NEXT_PUBLIC_LOCAL_DEV === 'true'
const LOCAL_WS_URL = process.env.NEXT_PUBLIC_LOCAL_WS_URL || 'ws://localhost:8080'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface GridAgentClientOptions {
  onMessage: (message: IncomingMessage) => void
  onConnectionChange: (state: ConnectionState) => void
  onError: (error: Error) => void
}

export class GridAgentClient {
  private ws: WebSocket | null = null
  private wsUrl: string | null = null
  private sessionId: string | null = null
  private options: GridAgentClientOptions
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(options: GridAgentClientOptions) {
    this.options = options
  }

  /**
   * Connect to the sandbox WebSocket server
   */
  async connect(wsUrl: string, sessionId: string): Promise<void> {
    this.wsUrl = wsUrl
    this.sessionId = sessionId
    this.reconnectAttempts = 0

    return this.establishConnection()
  }

  private establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.wsUrl) {
        reject(new Error('WebSocket URL not set'))
        return
      }

      this.options.onConnectionChange('connecting')

      try {
        this.ws = new WebSocket(this.wsUrl)

        this.ws.onopen = () => {
          this.reconnectAttempts = 0
          this.options.onConnectionChange('connected')
          this.options.onMessage({ type: 'connected' })
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as IncomingMessage
            this.options.onMessage(message)
          } catch (error) {
            console.error('Failed to parse message:', error)
            this.options.onError(new Error('Failed to parse server message'))
          }
        }

        this.ws.onerror = (event) => {
          console.error('WebSocket error:', event)
          this.options.onError(new Error('WebSocket connection error'))
          this.options.onConnectionChange('error')
          reject(new Error('WebSocket connection failed'))
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason)
          this.options.onMessage({ type: 'disconnected' })
          this.options.onConnectionChange('disconnected')

          // Attempt reconnection if not a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }
      } catch (error) {
        this.options.onConnectionChange('error')
        reject(error)
      }
    })
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)

    this.reconnectTimeout = setTimeout(() => {
      this.establishConnection().catch(error => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }

  /**
   * Send a query to the agent
   */
  sendQuery(content: string): void {
    const message: OutgoingMessage = {
      type: 'query',
      content,
      session_id: this.sessionId || undefined,
    }
    this.send(message)
  }

  /**
   * Send a query with attached files
   */
  sendQueryWithFiles(content: string, files: FileData[]): void {
    const message: OutgoingMessage = {
      type: 'query_with_files',
      content,
      files,
      session_id: this.sessionId || undefined,
    }
    this.send(message)
  }

  /**
   * Upload a file to the sandbox
   */
  uploadFile(filename: string, content: string): void {
    const message: OutgoingMessage = {
      type: 'upload_file',
      filename,
      content, // Should be base64 encoded
    }
    this.send(message)
  }

  /**
   * Send a message through the WebSocket
   */
  private send(message: OutgoingMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.options.onError(new Error('WebSocket is not connected'))
      return
    }

    try {
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      this.options.onError(error instanceof Error ? error : new Error('Failed to send message'))
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.wsUrl = null
    this.sessionId = null
    this.options.onConnectionChange('disconnected')
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId
  }
}

/**
 * Helper function to convert File to FileData
 */
export async function fileToFileData(file: File): Promise<FileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] // Remove data URL prefix
      resolve({
        filename: file.name,
        content: base64,
        type: file.type,
      })
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Start a session with the backend and get WebSocket URL
 */
export async function startSession(
  accessToken: string,
  sessionId?: string
): Promise<{ ws_url: string; session_id: string; resumed: boolean }> {
  // LOCAL_DEV: Skip backend entirely, connect directly to local WS server
  if (LOCAL_DEV) {
    console.log('LOCAL_DEV mode: connecting directly to', LOCAL_WS_URL)
    return {
      ws_url: LOCAL_WS_URL,
      session_id: sessionId || `local-${Date.now()}`,
      resumed: false,
    }
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

  if (!backendUrl) {
    throw new Error('Backend URL not configured')
  }

  const response = await fetch(`${backendUrl}/api/start-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ session_id: sessionId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to start session')
  }

  return response.json()
}
