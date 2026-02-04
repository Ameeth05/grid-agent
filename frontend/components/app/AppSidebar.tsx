'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  Newspaper,
  LayoutDashboard,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { UserProfileCard } from './UserProfileCard'

const navItems = [
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
  { href: '/news', icon: Newspaper, label: 'ISO News' },
  { href: '/watchlist', icon: LayoutDashboard, label: 'Dashboard' },
]

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'h-screen border-r bg-card flex flex-col transition-all duration-200',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-3 border-b">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-lime overflow-hidden">
              <Image
                src="/logo.png"
                alt="GridAgent"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-lime tracking-wide">GRIDAGENT</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          variant="outline"
          asChild
          className={cn(
            'w-full gap-2 border-lime/30 hover:bg-lime/10 hover:border-lime/50',
            isCollapsed && 'px-0'
          )}
        >
          <Link href="/chat">
            <Plus className="h-4 w-4" />
            {!isCollapsed && <span>New Chat</span>}
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className={cn(
                'w-full justify-start gap-3',
                isCollapsed && 'justify-center px-0',
                isActive
                  ? 'bg-lime/10 text-lime hover:bg-lime/20'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </Button>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Profile at Bottom */}
      <div className="p-3 border-t">
        <UserProfileCard isCollapsed={isCollapsed} />
      </div>
    </aside>
  )
}
