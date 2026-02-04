'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Wifi, WifiOff, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useGridAgent } from '@/hooks/useGridAgent'
import { useAuth } from '@/hooks/useAuth'
import { MessageList } from './MessageList'
import { FileUpload } from './FileUpload'

export function ChatInterface() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q')

  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [hasInitialQueryRun, setHasInitialQueryRun] = useState(false)

  const { isAuthenticated, getAccessToken, loading: authLoading } = useAuth()

  // Memoize options to prevent infinite re-render loop
  const gridAgentOptions = useMemo(() => ({
    onError: (error: Error) => {
      console.error('GridAgent error:', error)
    },
  }), [])

  const {
    messages,
    connectionState,
    isLoading,
    tokenUsage,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
  } = useGridAgent(gridAgentOptions)

  // Track if we've attempted connection to prevent loops
  const hasAttemptedConnection = useRef(false)

  // Connect to agent when authenticated (only once)
  useEffect(() => {
    if (isAuthenticated && connectionState === 'disconnected' && !hasAttemptedConnection.current) {
      hasAttemptedConnection.current = true
      const connectToAgent = async () => {
        const token = await getAccessToken()
        if (token) {
          try {
            await connect(token)
          } catch (error) {
            console.error('Failed to connect:', error)
            // Reset after a delay to allow retry
            setTimeout(() => {
              hasAttemptedConnection.current = false
            }, 5000)
          }
        }
      }
      connectToAgent()
    }

    return () => {
      if (connectionState === 'connected') {
        disconnect()
      }
    }
  }, [isAuthenticated, connectionState, getAccessToken, connect, disconnect])

  // Handle initial query from URL
  useEffect(() => {
    if (
      initialQuery &&
      !hasInitialQueryRun &&
      connectionState === 'connected' &&
      !isLoading
    ) {
      setHasInitialQueryRun(true)
      sendMessage(initialQuery)
    }
  }, [initialQuery, hasInitialQueryRun, connectionState, isLoading, sendMessage])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!input.trim() || isLoading || connectionState !== 'connected') return

      const message = input.trim()
      setInput('')
      setFiles([])

      try {
        await sendMessage(message, files.length > 0 ? files : undefined)
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    },
    [input, files, isLoading, connectionState, sendMessage]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleNewChat = () => {
    clearMessages()
    setHasInitialQueryRun(false)
  }

  const connectionStatusColor = {
    connected: 'text-green-500',
    connecting: 'text-yellow-500',
    disconnected: 'text-muted-foreground',
    error: 'text-destructive',
  }[connectionState]

  const connectionStatusText = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    error: 'Connection Error',
  }[connectionState]

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card/50">
        <div className="flex items-center gap-2">
          {connectionState === 'connected' ? (
            <Wifi className={cn('h-4 w-4', connectionStatusColor)} />
          ) : connectionState === 'connecting' ? (
            <Loader2 className={cn('h-4 w-4 animate-spin', connectionStatusColor)} />
          ) : (
            <WifiOff className={cn('h-4 w-4', connectionStatusColor)} />
          )}
          <span className={cn('text-sm', connectionStatusColor)}>
            {connectionStatusText}
          </span>
        </div>

        {tokenUsage && (
          <div className="text-xs text-muted-foreground">
            Session: {tokenUsage.total_tokens.toLocaleString()} tokens
          </div>
        )}
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input Area */}
      <div className="border-t p-4 bg-card/50">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <FileUpload
              files={files}
              onFilesChange={setFiles}
              disabled={isLoading || connectionState !== 'connected'}
            />

            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  connectionState === 'connected'
                    ? 'Ask about interconnection queues, cluster studies, FERC policies...'
                    : 'Connecting to GridAgent...'
                }
                disabled={isLoading || connectionState !== 'connected'}
                className="min-h-[60px] max-h-[200px] resize-none pr-12"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading || connectionState !== 'connected'}
                className="absolute right-2 bottom-2 h-8 w-8 bg-electric-500 hover:bg-electric-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {files.length} file{files.length > 1 ? 's' : ''} attached
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
