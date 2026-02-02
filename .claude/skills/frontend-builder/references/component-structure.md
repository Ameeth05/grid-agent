# Component Structure Reference

Complete hierarchy of all 27 React components in the GridAgent frontend.

## Directory Overview

```
frontend/components/
├── ui/           # 11 shadcn/ui primitives
├── chat/         # 6 chat-specific components
├── landing/      # 4 homepage components
├── layout/       # 3 layout components
├── auth/         # 2 authentication components
└── Providers.tsx # 1 context provider wrapper
```

## UI Components (shadcn/ui)

All from `@/components/ui/*`. Do NOT modify these directly - they are shadcn/ui primitives.

| Component | File | Usage |
|-----------|------|-------|
| Avatar | `ui/avatar.tsx` | User/bot icons in messages |
| Button | `ui/button.tsx` | Primary actions, submit |
| Card | `ui/card.tsx` | Content containers |
| Collapsible | `ui/collapsible.tsx` | Tool execution expand/collapse |
| Dialog | `ui/dialog.tsx` | Modal dialogs |
| DropdownMenu | `ui/dropdown-menu.tsx` | Context menus |
| Input | `ui/input.tsx` | Text inputs |
| ScrollArea | `ui/scroll-area.tsx` | Scrollable message list |
| Separator | `ui/separator.tsx` | Visual dividers |
| Textarea | `ui/textarea.tsx` | Chat input field |
| Tooltip | `ui/tooltip.tsx` | Hover hints |

### Adding New UI Components

```bash
npx shadcn-ui@latest add [component-name]
```

## Chat Components

Core components for the chat interface.

### ChatInterface.tsx
**Path:** `components/chat/ChatInterface.tsx`
**Type:** Client Component ('use client')

Main chat composition component. Manages:
- Connection state display (Wifi/WifiOff icons)
- Message input form
- File upload
- Sidebar for conversation history

**Key Dependencies:**
```typescript
import { useGridAgent } from '@/hooks/useGridAgent'
import { useAuth } from '@/hooks/useAuth'
import { MessageList } from './MessageList'
import { FileUpload } from './FileUpload'
import { Sidebar } from './Sidebar'
```

**State:**
- `input` - Current message text
- `files` - Attached files array
- `conversations` - Conversation list
- `activeConversationId` - Current conversation
- `hasInitialQueryRun` - Prevents duplicate initial query

### MessageList.tsx
**Path:** `components/chat/MessageList.tsx`
**Type:** Client Component

Renders scrollable list of messages.

**Props:**
```typescript
interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
}
```

**Features:**
- Auto-scroll to bottom on new messages
- Loading indicator when agent is thinking
- Uses ScrollArea from shadcn/ui

### Message.tsx
**Path:** `components/chat/Message.tsx`
**Type:** Client Component

Individual message bubble with avatar, content, and tool executions.

**Props:**
```typescript
interface MessageProps {
  message: ChatMessage
}
```

**Features:**
- User vs Assistant styling differentiation
- Streaming cursor animation (`isStreaming`)
- Tool execution list
- Token usage display
- Motion animations (framer-motion)

### ToolExecution.tsx
**Path:** `components/chat/ToolExecution.tsx`
**Type:** Client Component

Collapsible card showing tool name, args, result.

**Props:**
```typescript
interface ToolExecutionProps {
  execution: ToolExecution
}
```

**Visual States:**
- `running` - Blue border, spinning icon
- `completed` - Green border, checkmark
- `error` - Red border, X icon

### FileUpload.tsx
**Path:** `components/chat/FileUpload.tsx`
**Type:** Client Component

File attachment button and preview.

**Props:**
```typescript
interface FileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
}
```

### Sidebar.tsx
**Path:** `components/chat/Sidebar.tsx`
**Type:** Client Component

Conversation history panel.

**Props:**
```typescript
interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}
```

## Landing Components

Homepage sections.

### Hero.tsx
**Path:** `components/landing/Hero.tsx`
**Type:** Client Component

Main hero section with:
- Animated grid background
- Headline and description
- CTA buttons (Get Started, Learn More)
- Prompt chips for quick queries

### Features.tsx
**Path:** `components/landing/Features.tsx`
**Type:** Server Component

Feature grid showing product capabilities.

### GridAnimation.tsx
**Path:** `components/landing/GridAnimation.tsx`
**Type:** Client Component

Animated SVG grid background using framer-motion.

### PromptChips.tsx
**Path:** `components/landing/PromptChips.tsx`
**Type:** Client Component

Clickable example prompts that navigate to chat with query.

## Layout Components

Site-wide layout elements.

### Header.tsx
**Path:** `components/layout/Header.tsx`
**Type:** Client Component

Navigation header with:
- Logo/brand link
- Nav links (About, Watchlist, etc.)
- Theme toggle
- Auth button (sign in / user profile)

### Footer.tsx
**Path:** `components/layout/Footer.tsx`
**Type:** Server Component

Site footer with links and copyright.

### ThemeToggle.tsx
**Path:** `components/layout/ThemeToggle.tsx`
**Type:** Client Component

Dark/light mode toggle button using next-themes.

## Auth Components

Authentication UI.

### SignInButton.tsx
**Path:** `components/auth/SignInButton.tsx`
**Type:** Client Component

Sign in button that triggers Supabase OAuth.

### UserProfile.tsx
**Path:** `components/auth/UserProfile.tsx`
**Type:** Client Component

User avatar dropdown with:
- User info display
- Sign out action

## Providers

### Providers.tsx
**Path:** `components/Providers.tsx`
**Type:** Client Component

Wraps app with context providers:
- ThemeProvider (next-themes)
- AuthProvider (Supabase)

## Import Patterns

### Standard Import
```typescript
// UI components
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Custom components
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Header } from '@/components/layout/Header'
```

### Path Aliases
Configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Component Composition Rules

1. **Page components** compose layout + feature components
2. **Feature components** (chat, landing) use ui primitives
3. **UI primitives** are standalone, style-only
4. **Hooks** handle all state logic, not components
5. **Types** defined in `types/index.ts`, not inline

## Adding New Components

### Chat Feature
1. Create `components/chat/NewFeature.tsx`
2. Mark as client if uses hooks: `'use client'`
3. Define TypeScript props interface
4. Import in `ChatInterface.tsx`
5. Add to composition

### New Page
1. Create `app/[page]/page.tsx`
2. Import layout components (Header, Footer)
3. Add to `middleware.ts` if protected
4. Update Header nav links
