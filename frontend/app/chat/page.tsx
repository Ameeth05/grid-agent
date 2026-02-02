'use client'

import { Suspense } from 'react'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ChatLoadingSkeleton } from '@/components/ui/skeleton'

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ChatLoadingSkeleton />}>
        <ChatInterface />
      </Suspense>
    </ErrorBoundary>
  )
}
