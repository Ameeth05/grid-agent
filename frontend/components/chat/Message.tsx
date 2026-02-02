'use client'

import { User, Bot, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ToolExecution } from './ToolExecution'
import type { ChatMessage } from '@/types'

interface MessageProps {
  message: ChatMessage
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex gap-4 p-4 rounded-xl',
        isUser ? 'bg-muted/30' : 'bg-card border'
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? 'bg-electric-100 text-electric-700 dark:bg-electric-900 dark:text-electric-300'
              : 'bg-gradient-to-br from-electric-500 to-electric-600 text-white'
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Role Label */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {isUser ? 'You' : 'GridAgent'}
          </span>
          {message.isStreaming && (
            <Loader2 className="h-3 w-3 animate-spin text-electric-500" />
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

        {/* Message Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-electric-500 animate-pulse" />
            )}
          </div>
        </div>

        {/* Token Usage */}
        {message.tokenUsage && !message.isStreaming && (
          <div className="text-xs text-muted-foreground">
            Tokens: {message.tokenUsage.input_tokens} in / {message.tokenUsage.output_tokens} out
          </div>
        )}
      </div>
    </motion.div>
  )
}
