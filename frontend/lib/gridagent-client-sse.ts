/**
 * GridAgent SSE Client
 *
 * Much simpler than WebSocket! Uses:
 * - POST /query to submit queries
 * - GET /events for Server-Sent Events streaming
 */

import type { IncomingMessage, FileData } from '@/types'

// Local development mode
const LOCAL_DEV = process.env.NEXT_PUBLIC_LOCAL_DEV === 'true'
const LOCAL_API_URL = process.env.NEXT_PUBLIC_LOCAL_API_URL || 'http://localhost:8081'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface GridAgentSSEClientOptions {
  onMessage: (message: IncomingMessage) => void
  onConnectionChange: (state: ConnectionState) => void
  onError: (error: Error) => void
}

export class GridAgentSSEClient {
  private options: GridAgentSSEClientOptions
  private eventSource: EventSource | null = null
  private apiUrl: string = ''
  private sessionId: string = ''
  private connectionState: ConnectionState = 'disconnected'

  constructor(options: GridAgentSSEClientOptions) {
    this.options = options
  }

  async connect(apiUrl: string, sessionId: string): Promise<void> {
    this.apiUrl = apiUrl
    this.sessionId = sessionId
    this.setConnectionState('connecting')

    console.log('[SSE] Connecting to', apiUrl)

    try {
      // Test the connection with health check
      console.log('[SSE] Health check...')
      const healthRes = await fetch(`${apiUrl}/health`)
      if (!healthRes.ok) {
        throw new Error('Server health check failed')
      }
      console.log('[SSE] Health check passed')

      // Connect to SSE endpoint and wait for it to open
      await new Promise<void>((resolve, reject) => {
        const sseUrl = `${apiUrl}/events?session_id=${sessionId}`
        console.log('[SSE] Opening EventSource:', sseUrl)

        this.eventSource = new EventSource(sseUrl)

        const timeout = setTimeout(() => {
          reject(new Error('SSE connection timeout'))
        }, 10000)

        this.eventSource.onopen = () => {
          console.log('[SSE] EventSource opened')
          clearTimeout(timeout)
          this.setConnectionState('connected')
          resolve()
        }

        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('[SSE] Message received:', data.type)
            this.handleMessage(data)
          } catch (e) {
            console.error('[SSE] Failed to parse message:', e)
          }
        }

        this.eventSource.onerror = (error) => {
          console.error('[SSE] Error:', error)
          clearTimeout(timeout)
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            this.setConnectionState('disconnected')
          } else {
            this.setConnectionState('error')
          }
          reject(new Error('SSE connection error'))
        }
      })

      console.log('[SSE] Connected successfully!')

    } catch (error) {
      console.error('[SSE] Connection failed:', error)
      this.setConnectionState('error')
      throw error
    }
  }

  private handleMessage(data: any) {
    // Map server events to our IncomingMessage types
    switch (data.type) {
      case 'connected':
        this.options.onMessage({ type: 'connected' })
        break
      case 'text':
        this.options.onMessage({ type: 'text', content: data.content })
        break
      case 'tool_start':
        this.options.onMessage({
          type: 'tool_start',
          tool: data.tool,
          args: data.args || {}
        })
        break
      case 'tool_result':
        this.options.onMessage({
          type: 'tool_result',
          tool: data.tool,
          result: data.result
        })
        break
      case 'done':
        this.options.onMessage({
          type: 'done',
          token_usage: data.token_usage
        })
        break
      case 'error':
        this.options.onMessage({ type: 'error', message: data.message })
        break
      default:
        console.log('Unknown SSE event:', data)
    }
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state
    this.options.onConnectionChange(state)
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.setConnectionState('disconnected')
  }

  isConnected(): boolean {
    return this.connectionState === 'connected'
  }

  async sendQuery(content: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected')
    }

    const response = await fetch(`${this.apiUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        session_id: this.sessionId
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Query failed')
    }
  }

  async sendQueryWithFiles(content: string, files: FileData[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected')
    }

    const response = await fetch(`${this.apiUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        session_id: this.sessionId,
        files: files.map(f => ({
          filename: f.filename,
          content: f.content  // Already base64
        }))
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Query with files failed')
    }
  }
}

/**
 * Start a session - in LOCAL_DEV mode, just returns local API URL
 */
export async function startSession(
  accessToken: string,
  sessionId?: string
): Promise<{ api_url: string; session_id: string; resumed: boolean }> {
  if (LOCAL_DEV) {
    console.log('LOCAL_DEV mode: connecting to', LOCAL_API_URL)
    return {
      api_url: LOCAL_API_URL,
      session_id: sessionId || `local-${Date.now()}`,
      resumed: false,
    }
  }

  // Production: call backend to start session
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!backendUrl) {
    throw new Error('Backend URL not configured')
  }

  const response = await fetch(`${backendUrl}/api/start-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ session_id: sessionId })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to start session')
  }

  const data = await response.json()
  // Backend returns ws_url, but we need api_url for SSE
  // In production, this would be the SSE endpoint URL
  return {
    api_url: data.api_url || data.ws_url?.replace('wss://', 'https://').replace('ws://', 'http://').replace(':8080', ':8081'),
    session_id: data.session_id,
    resumed: data.resumed
  }
}

/**
 * Convert File to FileData (base64 encoded)
 */
export async function fileToFileData(file: File): Promise<FileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve({
        filename: file.name,
        content: base64,
        type: file.type
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
