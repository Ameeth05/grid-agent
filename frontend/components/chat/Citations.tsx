'use client'

import { FileText, ExternalLink } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface Citation {
  id: number
  source: string
  type?: 'file' | 'url' | 'document'
  path?: string
}

interface CitationsProps {
  citations: Citation[]
  className?: string
}

/**
 * Displays source citations for AI responses.
 *
 * Citations are extracted from AI output that includes
 * numbered references like [1], [2], etc.
 *
 * Format expected in AI output:
 * "The project has a 2-year timeline [1] with costs of $50M [2].
 *
 * Sources:
 * [1] PJM Queue Data - CycleProjects-All.csv
 * [2] TC2 Phase 1 Study Results"
 */
export function Citations({ citations, className }: CitationsProps) {
  if (!citations || citations.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'mt-4 pt-4 border-t border-border/50',
        className
      )}
    >
      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
        <FileText className="h-3 w-3" />
        Sources
      </p>
      <div className="space-y-1">
        {citations.map((citation) => (
          <div
            key={citation.id}
            className="flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
              {citation.id}
            </span>
            {citation.path ? (
              <a
                href={citation.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                {citation.source}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span>{citation.source}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Utility function to parse citations from message content.
 *
 * Looks for a "Sources:" section at the end of the message
 * and extracts numbered citations.
 */
export function parseCitations(content: string): {
  cleanContent: string
  citations: Citation[]
} {
  // Look for Sources section
  const sourcesMatch = content.match(/\n\s*Sources:\s*\n([\s\S]+)$/i)

  if (!sourcesMatch) {
    return { cleanContent: content, citations: [] }
  }

  const cleanContent = content.slice(0, sourcesMatch.index).trim()
  const sourcesSection = sourcesMatch[1]

  // Parse individual citations [1] Source name
  const citationRegex = /\[(\d+)\]\s*(.+?)(?=\n\[|\n*$)/g
  const citations: Citation[] = []

  let match
  while ((match = citationRegex.exec(sourcesSection)) !== null) {
    const id = parseInt(match[1], 10)
    const source = match[2].trim()

    // Detect if it's a URL
    const isUrl = source.startsWith('http://') || source.startsWith('https://')

    citations.push({
      id,
      source: isUrl ? new URL(source).hostname : source,
      type: isUrl ? 'url' : 'file',
      path: isUrl ? source : undefined
    })
  }

  return { cleanContent, citations }
}
