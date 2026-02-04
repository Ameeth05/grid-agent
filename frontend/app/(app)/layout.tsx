'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { AppSidebar } from '@/components/app/AppSidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
