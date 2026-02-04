'use client'

import { cn } from '@/lib/utils'

interface ShimmerProps {
  children: React.ReactNode
  className?: string
  isAnimating?: boolean
}

/**
 * Shimmer component - animated text effect like Claude Code
 * Shows a sweeping shimmer effect across text during loading states
 */
export function Shimmer({ children, className, isAnimating = true }: ShimmerProps) {
  if (!isAnimating) {
    return <span className={className}>{children}</span>
  }

  return (
    <span
      className={cn(
        'relative inline-block',
        className
      )}
    >
      <span className="relative">
        {children}
        <span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-lime/20 to-transparent animate-shimmer-sweep"
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      </span>
    </span>
  )
}
