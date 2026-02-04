'use client'

import { MessageSquare, MoreHorizontal, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Conversation } from '@/types'
import { formatDate } from '@/lib/utils'

interface ChatHistoryProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

export function ChatHistory({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
}: ChatHistoryProps) {
  if (conversations.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-sm text-muted-foreground">
        No conversations yet
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
              activeConversationId === conversation.id
                ? 'bg-accent'
                : 'hover:bg-muted'
            )}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">
                {conversation.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(conversation.updatedAt)}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConversation(conversation.id)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
