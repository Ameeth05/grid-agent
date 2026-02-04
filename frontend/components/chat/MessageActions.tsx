'use client'

import { useState } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MessageActionsProps {
  content: string
  role: 'user' | 'assistant'
  onRegenerate?: () => void
  className?: string
}

/**
 * Action buttons for chat messages.
 *
 * Shows on hover:
 * - Copy: Copies message content to clipboard
 * - Regenerate: Re-runs the query (assistant messages only)
 */
export function MessageActions({
  content,
  role,
  onRegenerate,
  className
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          className
        )}
      >
        {/* Copy Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{copied ? 'Copied!' : 'Copy'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Regenerate Button (assistant only) */}
        {role === 'assistant' && onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRegenerate}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Regenerate</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
