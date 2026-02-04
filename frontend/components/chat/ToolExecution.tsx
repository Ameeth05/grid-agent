'use client'

import { useState } from 'react'
import { ChevronDown, Wrench, Check, X, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { ToolExecution as ToolExecutionType } from '@/types'

interface ToolExecutionProps {
  execution: ToolExecutionType
}

export function ToolExecution({ execution }: ToolExecutionProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Format tool name for display (keep original casing, just clean up)
  const toolDisplayName = `tool-${execution.tool}`

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full group">
        <div className="flex items-center gap-2 py-1.5 px-3 rounded-md bg-[#1c1c1c] hover:bg-[#252525] transition-colors">
          {/* Wrench icon */}
          <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

          {/* Tool name in monospace */}
          <span className="font-mono text-sm text-foreground/80">{toolDisplayName}</span>

          {/* Status badge */}
          {execution.status === 'running' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime/10 text-lime text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Running</span>
            </span>
          ) : execution.status === 'completed' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime/10 text-lime text-xs">
              <Check className="h-3 w-3" />
              <span>Completed</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs">
              <X className="h-3 w-3" />
              <span>Error</span>
            </span>
          )}

          {/* Expand chevron */}
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground ml-auto transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </div>
      </CollapsibleTrigger>

      {isOpen && (
        <CollapsibleContent>
          <div className="mt-1 ml-5 pl-3 border-l border-border/50 text-xs space-y-2 py-2">
            {/* Arguments */}
            {execution.args && Object.keys(execution.args).length > 0 && (
              <div>
                <span className="text-muted-foreground">Args: </span>
                <code className="text-foreground/70">
                  {JSON.stringify(execution.args)}
                </code>
              </div>
            )}

            {/* Result */}
            {execution.result && (
              <div>
                <span className="text-muted-foreground">Result: </span>
                <code className={cn(
                  "text-foreground/70",
                  execution.status === 'error' && "text-destructive"
                )}>
                  {execution.result.length > 100
                    ? execution.result.substring(0, 100) + '...'
                    : execution.result}
                </code>
              </div>
            )}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
