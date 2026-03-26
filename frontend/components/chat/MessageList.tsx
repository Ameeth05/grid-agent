'use client'

import { useEffect, useRef } from 'react'
import { Bot, Loader2 } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Message } from './Message'
import type { ChatMessage } from '@/types'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-electric-500/20 to-grid-500/20 flex items-center justify-center mb-6 shadow-lg shadow-electric-500/10">
          <Bot className="h-10 w-10 text-electric-500" />
        </div>
        <h3 className="font-display text-2xl font-bold mb-3">Welcome to our agent</h3>
        <p className="text-muted-foreground max-w-lg mb-8 leading-relaxed">
          Ask me anything about US grid interconnection queues, cluster studies,
          FERC policies, or power market analysis. I have access to data from all 6 major ISOs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          {[
            'Analyze PJM TC2 network upgrade costs',
            'Compare MISO vs SPP queue timelines',
            'Latest FERC Order 2023 impacts',
            'Solar project withdrawal patterns',
          ].map((suggestion) => (
            <div
              key={suggestion}
              className="px-4 py-3 rounded-xl border border-border/50 bg-card/50 text-sm text-muted-foreground hover:text-foreground hover:border-electric-500/30 transition-all cursor-pointer"
            >
              {suggestion}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {/* Loading indicator when waiting for response */}
        {isLoading && messages.length > 0 && !messages[messages.length - 1]?.isStreaming && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-electric-500 to-electric-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-electric-500" />
              <span className="text-sm text-muted-foreground">Our agent is thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
