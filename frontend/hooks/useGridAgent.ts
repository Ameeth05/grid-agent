'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  GridAgentSSEClient,
  ConnectionState,
  startSession,
  fileToFileData,
} from '@/lib/gridagent-client-sse'
import type {
  IncomingMessage,
  ChatMessage,
  ToolExecution,
  TokenUsage,
} from '@/types'

export interface UseGridAgentOptions {
  onError?: (error: Error) => void
}

export interface UseGridAgentReturn {
  messages: ChatMessage[]
  connectionState: ConnectionState
  isLoading: boolean
  tokenUsage: TokenUsage | null
  connect: (accessToken: string, sessionId?: string) => Promise<void>
  disconnect: () => void
  sendMessage: (content: string, files?: File[]) => Promise<void>
  clearMessages: () => void
}

export function useGridAgent(options: UseGridAgentOptions = {}): UseGridAgentReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [isLoading, setIsLoading] = useState(false)
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)

  const clientRef = useRef<GridAgentSSEClient | null>(null)
  const currentAssistantMessageRef = useRef<string | null>(null)
  const toolExecutionsRef = useRef<ToolExecution[]>([])

  // Handle incoming messages from SSE
  const handleMessage = useCallback((message: IncomingMessage) => {
    switch (message.type) {
      case 'text':
        // Append text to current assistant message
        if (!currentAssistantMessageRef.current) {
          // Create new assistant message
          const messageId = `msg_${Date.now()}`
          currentAssistantMessageRef.current = messageId

          setMessages(prev => [
            ...prev,
            {
              id: messageId,
              role: 'assistant',
              content: message.content,
              timestamp: new Date(),
              isStreaming: true,
              toolExecutions: [],
            },
          ])
        } else {
          // Append to existing message
          setMessages(prev =>
            prev.map(msg =>
              msg.id === currentAssistantMessageRef.current
                ? { ...msg, content: msg.content + message.content }
                : msg
            )
          )
        }
        break

      case 'tool_start':
        // Add tool execution to current message
        const toolExecution: ToolExecution = {
          id: `tool_${Date.now()}`,
          tool: message.tool,
          args: message.args,
          status: 'running',
        }
        toolExecutionsRef.current.push(toolExecution)

        if (currentAssistantMessageRef.current) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === currentAssistantMessageRef.current
                ? { ...msg, toolExecutions: [...toolExecutionsRef.current] }
                : msg
            )
          )
        }
        break

      case 'tool_result':
        // Update tool execution with result
        const lastTool = toolExecutionsRef.current.find(
          t => t.tool === message.tool && t.status === 'running'
        )
        if (lastTool) {
          lastTool.result = message.result
          lastTool.status = 'completed'

          if (currentAssistantMessageRef.current) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === currentAssistantMessageRef.current
                  ? { ...msg, toolExecutions: [...toolExecutionsRef.current] }
                  : msg
              )
            )
          }
        }
        break

      case 'error':
        // Mark tool as error or add error message
        const runningTool = toolExecutionsRef.current.find(t => t.status === 'running')
        if (runningTool) {
          runningTool.result = message.message
          runningTool.status = 'error'
        }

        if (currentAssistantMessageRef.current) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === currentAssistantMessageRef.current
                ? {
                    ...msg,
                    content: msg.content + `\n\nError: ${message.message}`,
                    isStreaming: false,
                    toolExecutions: [...toolExecutionsRef.current],
                  }
                : msg
            )
          )
        }
        setIsLoading(false)
        options.onError?.(new Error(message.message))
        break

      case 'done':
        // Finalize message
        if (currentAssistantMessageRef.current) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === currentAssistantMessageRef.current
                ? {
                    ...msg,
                    isStreaming: false,
                    tokenUsage: message.token_usage,
                    toolExecutions: [...toolExecutionsRef.current],
                  }
                : msg
            )
          )
        }

        if (message.token_usage) {
          setTokenUsage(prev => {
            if (!prev) return message.token_usage!
            return {
              input_tokens: prev.input_tokens + message.token_usage!.input_tokens,
              output_tokens: prev.output_tokens + message.token_usage!.output_tokens,
              total_tokens: prev.total_tokens + message.token_usage!.total_tokens,
            }
          })
        }

        currentAssistantMessageRef.current = null
        toolExecutionsRef.current = []
        setIsLoading(false)
        break

      case 'connected':
      case 'disconnected':
        // Connection state handled separately
        break
    }
  }, [options])

  const handleConnectionChange = useCallback((state: ConnectionState) => {
    setConnectionState(state)
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error('GridAgent error:', error)
    options.onError?.(error)
  }, [options])

  // Initialize client
  useEffect(() => {
    clientRef.current = new GridAgentSSEClient({
      onMessage: handleMessage,
      onConnectionChange: handleConnectionChange,
      onError: handleError,
    })

    return () => {
      clientRef.current?.disconnect()
    }
  }, [handleMessage, handleConnectionChange, handleError])

  const connect = useCallback(async (accessToken: string, sessionId?: string) => {
    if (!clientRef.current) return

    try {
      // Start session (gets API URL in LOCAL_DEV, or from backend in production)
      const sessionInfo = await startSession(accessToken, sessionId)

      // Connect to SSE endpoint
      await clientRef.current.connect(sessionInfo.api_url, sessionInfo.session_id)
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to connect'))
      throw error
    }
  }, [handleError])

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect()
  }, [])

  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!clientRef.current?.isConnected()) {
      throw new Error('Not connected to agent')
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Reset refs for new assistant message
    currentAssistantMessageRef.current = null
    toolExecutionsRef.current = []

    // Send message
    if (files && files.length > 0) {
      const fileData = await Promise.all(files.map(fileToFileData))
      await clientRef.current.sendQueryWithFiles(content, fileData)
    } else {
      await clientRef.current.sendQuery(content)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setTokenUsage(null)
    currentAssistantMessageRef.current = null
    toolExecutionsRef.current = []
  }, [])

  return {
    messages,
    connectionState,
    isLoading,
    tokenUsage,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
  }
}
