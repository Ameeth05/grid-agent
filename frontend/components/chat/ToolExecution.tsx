'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { ToolExecution as ToolExecutionType } from '@/types'

interface ToolExecutionProps {
  execution: ToolExecutionType
}

export function ToolExecution({ execution }: ToolExecutionProps) {
  const [isOpen, setIsOpen] = useState(false)

  const statusIcon = {
    running: <Loader2 className="h-4 w-4 animate-spin text-electric-500" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-destructive" />,
  }[execution.status]

  const toolDisplayName = execution.tool
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors',
            'hover:bg-muted/50',
            execution.status === 'running' && 'border-electric-500/30 bg-electric-500/5',
            execution.status === 'completed' && 'border-green-500/30 bg-green-500/5',
            execution.status === 'error' && 'border-destructive/30 bg-destructive/5'
          )}
        >
          {statusIcon}
          <span className="flex-1 text-left font-medium text-sm">{toolDisplayName}</span>
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </CollapsibleTrigger>

      <AnimatePresence>
        {isOpen && (
          <CollapsibleContent forceMount>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3 mt-2 rounded-lg bg-muted/30 border text-sm space-y-3">
                {/* Arguments */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Arguments
                  </div>
                  <pre className="p-2 rounded bg-background/50 text-xs overflow-x-auto">
                    {JSON.stringify(execution.args, null, 2)}
                  </pre>
                </div>

                {/* Result */}
                {execution.result && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Result
                    </div>
                    <pre
                      className={cn(
                        'p-2 rounded text-xs overflow-x-auto max-h-60 overflow-y-auto',
                        execution.status === 'error'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-background/50'
                      )}
                    >
                      {execution.result}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  )
}
