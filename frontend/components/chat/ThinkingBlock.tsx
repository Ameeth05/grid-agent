'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ThinkingBlockProps {
  content: string
  isStreaming?: boolean
  duration?: string
}

/**
 * ThinkingBlock - Displays AI reasoning/thinking content
 *
 * Behavior like Claude Code:
 * - Auto-opens during streaming
 * - Auto-closes when streaming ends
 * - Shows shimmer animation while thinking
 * - "Thought for X seconds" when complete
 */
export function ThinkingBlock({ content, isStreaming = false, duration = "a few seconds" }: ThinkingBlockProps) {
  // Auto-open during streaming, auto-close when done
  const [isOpen, setIsOpen] = useState(isStreaming)

  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true)
    } else {
      // Auto-close after streaming ends (small delay for UX)
      const timer = setTimeout(() => setIsOpen(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isStreaming])

  if (!content && !isStreaming) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="group">
        <div className="flex items-center gap-2 text-muted-foreground hover:text-muted-foreground/80 transition-colors py-1">
          {/* Sparkles icon */}
          <Sparkles className={cn(
            "h-4 w-4",
            isStreaming && "text-lime animate-pulse"
          )} />

          {/* Label with shimmer during streaming */}
          {isStreaming ? (
            <span className="text-sm relative overflow-hidden">
              <span className="relative z-10">Thinking</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-lime/30 to-transparent animate-shimmer-sweep" />
            </span>
          ) : (
            <span className="text-sm">Thought for {duration}</span>
          )}

          {/* Chevron */}
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 pl-6 text-sm text-muted-foreground/60 leading-relaxed max-h-40 overflow-y-auto">
          {content}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
