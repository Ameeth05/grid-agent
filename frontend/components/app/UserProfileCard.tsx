'use client'

import { LogOut, Settings, User } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'

interface UserProfileCardProps {
  isCollapsed: boolean
}

export function UserProfileCard({ isCollapsed }: UserProfileCardProps) {
  const { user, signOut } = useAuth()

  if (!user) return null

  const initials = user.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email?.[0]?.toUpperCase() || 'U'

  const displayName = user.user_metadata?.full_name || user.email || 'User'
  const displayEmail = user.email || ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 px-3 py-2 h-auto hover:bg-muted/50',
            isCollapsed && 'justify-center px-0'
          )}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-lime/20 text-lime text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium truncate max-w-[140px]">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {displayEmail}
              </span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
