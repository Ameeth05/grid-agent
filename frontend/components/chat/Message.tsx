'use client'

import { useMemo } from 'react'
import { User, Bot } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ToolExecution } from './ToolExecution'
import { StreamdownMessage, StreamingCursor } from './StreamdownMessage'
import { MessageActions } from './MessageActions'
import { Citations, parseCitations } from './Citations'
import { ThinkingBlock } from './ThinkingBlock'
import type { ChatMessage } from '@/types'

// Green pulsing dots like Claude Code
function PulsingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// Separate thinking text from response text
function parseThinking(content: string): { thinking: string; response: string } {
  // Look for thinking patterns - text before markdown formatting starts
  // Thinking typically starts with phrases like "I need to", "Let me", etc.
  // and continues until we hit markdown (##, **, ```, etc.)

  const lines = content.split('\n')
  const thinkingLines: string[] = []
  const responseLines: string[] = []
  let foundMarkdown = false

  for (const line of lines) {
    // Check if this line contains markdown formatting
    const hasMarkdown = /^#+\s|^\*\*|^```|^-\s|^\d+\.\s|^\|/.test(line.trim())

    if (hasMarkdown || foundMarkdown) {
      foundMarkdown = true
      responseLines.push(line)
    } else {
      thinkingLines.push(line)
    }
  }

  const thinking = thinkingLines.join('\n').trim()
  const response = responseLines.join('\n').trim()

  // Only treat as thinking if it's substantial and there's also a response
  if (thinking.length > 100 && response.length > 50) {
    return { thinking, response }
  }

  return { thinking: '', response: content }
}

interface MessageProps {
  message: ChatMessage
  onRegenerate?: () => void
}

export function Message({ message, onRegenerate }: MessageProps) {
  const isUser = message.role === 'user'

  // Parse citations and thinking from message content
  const { cleanContent, citations, thinking } = useMemo(() => {
    if (isUser || message.isStreaming) {
      return { cleanContent: message.content, citations: [], thinking: '' }
    }
    const citationResult = parseCitations(message.content)
    const thinkingResult = parseThinking(citationResult.cleanContent)
    return {
      cleanContent: thinkingResult.response || citationResult.cleanContent,
      citations: citationResult.citations,
      thinking: thinkingResult.thinking
    }
  }, [message.content, isUser, message.isStreaming])

  return (
    <div
      className={cn(
        'group flex gap-4 p-4 rounded-xl relative animate-fade-in',
        isUser ? 'bg-muted/30' : 'bg-card border border-border/50'
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? 'bg-lime/10 text-lime'
              : 'bg-gradient-to-br from-lime/80 to-lime text-background'
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Role Label + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-lime">
              {isUser ? 'You' : 'Our agent'}
            </span>
            {message.isStreaming && <PulsingDots />}
          </div>

          {/* Message Actions (visible on hover) */}
          {!message.isStreaming && (
            <MessageActions
              content={message.content}
              role={message.role}
              onRegenerate={!isUser ? onRegenerate : undefined}
            />
          )}
        </div>

        {/* Tool Executions */}
        {message.toolExecutions && message.toolExecutions.length > 0 && (
          <div className="space-y-2">
            {message.toolExecutions.map((execution) => (
              <ToolExecution key={execution.id} execution={execution} />
            ))}
          </div>
        )}

        {/* Thinking Block (collapsible) */}
        {thinking && (
          <ThinkingBlock content={thinking} isStreaming={false} />
        )}

        {/* Message Content - Using Streamdown for markdown rendering */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isUser ? (
            // User messages: plain text (no markdown)
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            // Assistant messages: Streamdown markdown rendering
            <>
              <StreamdownMessage
                content={cleanContent}
                isStreaming={message.isStreaming}
              />
              {message.isStreaming && <StreamingCursor />}
            </>
          )}
        </div>

        {/* Citations */}
        {!message.isStreaming && citations.length > 0 && (
          <Citations citations={citations} />
        )}

        {/* Token Usage */}
        {message.tokenUsage && !message.isStreaming && (
          <div className="text-xs text-muted-foreground">
            Tokens: {message.tokenUsage.input_tokens} in / {message.tokenUsage.output_tokens} out
          </div>
        )}
      </div>
    </div>
  )
}
