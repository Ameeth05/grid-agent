'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Streamdown } from 'streamdown'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { Check, Copy, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreamdownMessageProps {
  content: string
  isStreaming?: boolean
  className?: string
}

/**
 * Enhanced Streamdown renderer with:
 * - Syntax highlighted code blocks (Shiki)
 * - Copy button on code blocks
 * - Language labels
 * - LaTeX math rendering (KaTeX)
 * - Streaming cursor animation
 */
export function StreamdownMessage({
  content,
  isStreaming = false,
  className
}: StreamdownMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Add copy buttons and language labels to code blocks after render
  const enhanceCodeBlocks = useCallback(() => {
    if (!containerRef.current) return

    const codeBlocks = containerRef.current.querySelectorAll('pre')
    codeBlocks.forEach((pre) => {
      // Skip if already enhanced
      if (pre.dataset.enhanced) return
      pre.dataset.enhanced = 'true'

      // Get language from class (Shiki adds "language-xxx")
      const codeEl = pre.querySelector('code')
      const langClass = codeEl?.className.match(/language-(\w+)/)?.[1]
      const language = langClass || 'text'

      // Create wrapper for header
      const wrapper = document.createElement('div')
      wrapper.className = 'code-block-wrapper relative group'

      // Create header with language label and copy button
      const header = document.createElement('div')
      header.className = 'code-block-header flex items-center justify-between px-4 py-2 bg-muted/80 border-b border-border/50 rounded-t-lg text-xs text-muted-foreground'

      // Language label
      const langLabel = document.createElement('span')
      langLabel.className = 'flex items-center gap-1.5 font-medium'
      langLabel.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>${language}`
      header.appendChild(langLabel)

      // Copy button
      const copyBtn = document.createElement('button')
      copyBtn.className = 'copy-btn flex items-center gap-1 px-2 py-1 rounded hover:bg-background/50 transition-colors opacity-0 group-hover:opacity-100'
      copyBtn.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy</span>`

      copyBtn.addEventListener('click', async () => {
        const code = codeEl?.textContent || ''
        await navigator.clipboard.writeText(code)

        // Show copied state
        copyBtn.innerHTML = `<svg class="w-3.5 h-3.5 text-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span class="text-lime">Copied!</span>`

        setTimeout(() => {
          copyBtn.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy</span>`
        }, 2000)
      })

      header.appendChild(copyBtn)

      // Wrap pre element
      pre.parentNode?.insertBefore(wrapper, pre)
      wrapper.appendChild(header)
      wrapper.appendChild(pre)

      // Remove top border radius from pre (header has it)
      pre.style.borderTopLeftRadius = '0'
      pre.style.borderTopRightRadius = '0'
      pre.style.marginTop = '0'
    })
  }, [])

  // Enhance code blocks after content changes
  useEffect(() => {
    // Small delay to ensure Streamdown has rendered
    const timeout = setTimeout(enhanceCodeBlocks, 50)
    return () => clearTimeout(timeout)
  }, [content, enhanceCodeBlocks])

  if (!content) {
    return null
  }

  return (
    <div ref={containerRef} className={cn('streamdown-wrapper', className)}>
      <Streamdown
        plugins={{ code, math }}
        isAnimating={isStreaming}
        className="streamdown-content"
      >
        {content}
      </Streamdown>
    </div>
  )
}

/**
 * Streaming cursor component - shows typing indicator
 */
export function StreamingCursor() {
  return (
    <span className="inline-flex items-center ml-1">
      <span className="w-2 h-5 bg-lime animate-pulse rounded-sm" />
    </span>
  )
}

/**
 * Skeleton loader for when content is loading
 */
export function StreamdownSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-20 bg-muted rounded w-full mt-4" />
      <div className="h-4 bg-muted rounded w-2/3" />
    </div>
  )
}
