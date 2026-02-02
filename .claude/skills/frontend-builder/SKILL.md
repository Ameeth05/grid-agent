---
name: frontend-builder
description: "Guide for GridAgent Next.js 14 frontend development. Use when: creating or modifying React components, implementing SSE/WebSocket client features, working with chat interface streaming, configuring Vercel deployment, integrating Supabase authentication, or debugging frontend connection issues. Comprehensive frontend design system for creating distinctive, production-grade interfaces that avoid generic AI aesthetics.Provides design workflows, aesthetic guidelines, code patterns, animation libraries, typography systems, color theory, and anti-patterns to create memorable, context-specific designs that feel genuinely crafted rather than generated
---

# Frontend Builder

Build and maintain the GridAgent Next.js 14 chat interface with real-time SSE/WebSocket communication.
This skill provides a comprehensive system for creating distinctive, production-grade frontend interfaces that transcend generic AI aesthetics. Every design should feel intentionally crafted for its specific context.

## Core Philosophy

**Every interface tells a story.** Design is not decoration applied to functionality - it's the synthesis of purpose, emotion, and interaction into a cohesive experience.

Before writing any code, establish:
1. **Context**: What problem does this solve? Who uses it? What emotion should it evoke?
2. **Concept**: What's the core metaphor or idea that drives all design decisions?
3. **Commitment**: Choose a bold direction and execute it with precision throughout.

Never use default font stacks. Always pair fonts intentionally:
```css
/* Bad - Generic AI Slop */
font-family: Inter, system-ui, sans-serif;

/* Good - Intentional Pairing */
font-family: 'Instrument Serif', 'Crimson Pro', serif;  /* Editorial */
font-family: 'Space Mono', 'JetBrains Mono', monospace;  /* Tech */
font-family: 'Bebas Neue', 'Oswald', sans-serif;  /* Bold Display */
font-family: 'Playfair Display', 'Libre Baskerville', serif;  /* Luxury */
```

## Quick Reference

### Key Files
| File | Purpose |
|------|---------|
| `frontend/lib/gridagent-client-sse.ts` | SSE client with connection handling |
| `frontend/hooks/useGridAgent.ts` | React hook for agent state management |
| `frontend/components/chat/ChatInterface.tsx` | Main chat UI composition |
| `frontend/types/index.ts` | TypeScript message definitions |
| `frontend/middleware.ts` | Auth route protection |

### Common Tasks

**Add new message type:**
1. Define type in `types/index.ts`
2. Handle in `gridagent-client-sse.ts` handleMessage()
3. Process in `useGridAgent.ts` switch statement

**Add chat feature:**
1. Create component in `components/chat/`
2. Import in `ChatInterface.tsx`
3. Wire to `useGridAgent` hook state

**Add protected page:**
1. Create `app/[page]/page.tsx`
2. Add route to `middleware.ts` protected paths

## Architecture

### Component Hierarchy
```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── page.tsx           # Landing (Hero + Features)
│   ├── chat/page.tsx      # Chat interface
│   ├── layout.tsx         # Root layout with Providers
│   └── auth/callback/     # Supabase OAuth callback
├── components/
│   ├── ui/                # shadcn/ui primitives (11)
│   ├── chat/              # Chat components (6)
│   ├── landing/           # Homepage components (4)
│   ├── layout/            # Header, Footer, ThemeToggle (3)
│   └── auth/              # SignInButton, UserProfile (2)
├── hooks/
│   ├── useGridAgent.ts    # Agent connection state
│   └── useAuth.ts         # Supabase auth state
└── lib/
    ├── gridagent-client-sse.ts
    ├── supabase/client.ts
    └── utils.ts
```

### Data Flow
```
User Input
    |
    v
ChatInterface (form submit)
    |
    v
useGridAgent.sendMessage()
    |
    v
GridAgentSSEClient.sendQuery() --> POST /query
    |
    v
SSE EventSource <-- GET /events (server pushes)
    |
    v
handleMessage() callback
    |
    v
setMessages() state update
    |
    v
MessageList re-renders
```

## SSE/WebSocket Integration

### Connection Lifecycle
1. User authenticates via Supabase
2. `ChatInterface` effect calls `connect(token)`
3. `startSession()` calls backend `/api/start-session`
4. Backend returns `{ api_url, session_id }`
5. `GridAgentSSEClient.connect(api_url, session_id)` opens EventSource

### Connection States
```typescript
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'
```

Display mapping in `ChatInterface.tsx`:
- `connected` -> green Wifi icon
- `connecting` -> yellow spinning Loader2
- `disconnected` -> gray WifiOff icon
- `error` -> red WifiOff icon

### Local Development Mode
```env
NEXT_PUBLIC_LOCAL_DEV=true
NEXT_PUBLIC_LOCAL_API_URL=http://localhost:8081
```

When `LOCAL_DEV=true`, `startSession()` bypasses backend and returns local URL directly.

For detailed message types, see `references/websocket-protocol.md`.

## Chat Interface Patterns

### Message Streaming
```typescript
// useGridAgent.ts handleMessage callback
case 'text':
  if (!currentAssistantMessageRef.current) {
    // Create new message with isStreaming: true
    const messageId = `msg_${Date.now()}`
    currentAssistantMessageRef.current = messageId
    setMessages(prev => [...prev, {
      id: messageId,
      role: 'assistant',
      content: message.content,
      isStreaming: true,
      toolExecutions: [],
    }])
  } else {
    // Append to existing message
    setMessages(prev => prev.map(msg =>
      msg.id === currentAssistantMessageRef.current
        ? { ...msg, content: msg.content + message.content }
        : msg
    ))
  }
```

### Tool Execution Display
Tool states: `running` | `completed` | `error`

```typescript
case 'tool_start':
  const toolExecution: ToolExecution = {
    id: `tool_${Date.now()}`,
    tool: message.tool,
    args: message.args,
    status: 'running',
  }
  toolExecutionsRef.current.push(toolExecution)
  // Update message.toolExecutions array

case 'tool_result':
  const lastTool = toolExecutionsRef.current.find(
    t => t.tool === message.tool && t.status === 'running'
  )
  if (lastTool) {
    lastTool.result = message.result
    lastTool.status = 'completed'
  }
```

Visual: `ToolExecution.tsx` uses Collapsible from shadcn/ui with animated expand/collapse.

### File Upload
1. `FileUpload` component captures files
2. Convert to base64: `fileToFileData(file)`
3. Send via `sendQueryWithFiles(content, files)`

```typescript
export async function fileToFileData(file: File): Promise<FileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve({ filename: file.name, content: base64, type: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

## Authentication Flow

### Supabase Integration
```typescript
// lib/supabase/client.ts - Browser client
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// middleware.ts - Session refresh
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  await supabase.auth.getUser() // Refreshes session
}
```

### Protected Routes Pattern
```typescript
// middleware.ts
const protectedPaths = ['/chat', '/watchlist']
if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}
```

### useAuth Hook
```typescript
const { isAuthenticated, user, getAccessToken, loading } = useAuth()

// In ChatInterface
if (authLoading) return <Loader />
if (!isAuthenticated) return <SignInPrompt />
```

## Vercel Deployment

### Environment Variables
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app

# Optional (local dev)
NEXT_PUBLIC_LOCAL_DEV=true
NEXT_PUBLIC_LOCAL_API_URL=http://localhost:8081
```

### Deployment Checklist
- [ ] All env vars configured in Vercel dashboard
- [ ] Supabase OAuth callback: `https://[app].vercel.app/auth/callback`
- [ ] Backend CORS allows `https://[app].vercel.app` (use regex pattern)
- [ ] Build passes locally: `npm run build`
- [ ] Type check passes: `npm run type-check`

### Supabase OAuth Setup
1. Enable Google provider in Supabase Auth settings
2. Add authorized redirect URI: `https://[project].supabase.co/auth/v1/callback`
3. Configure Google OAuth credentials in Supabase

## Anti-Patterns

### DO NOT
- Import server-only code in 'use client' components
- Store EventSource instance in React state (causes reconnect loops)
- Create new callback objects in render without useMemo/useCallback
- Parse SSE data without try/catch
- Forget to clean up EventSource on unmount

## Critical Anti-Patterns to Avoid

### The "AI Look" Checklist

NEVER do all of these together:
- ❌ Purple/blue gradient backgrounds
- ❌ Inter or system fonts
- ❌ Centered hero with subheading
- ❌ 3-column feature cards
- ❌ Rounded corners on everything
- ❌ Drop shadows on all cards
- ❌ #6366F1 as primary color
- ❌ 16px border radius
- ❌ "Modern", "Clean", "Simple" as only descriptors

### DO
- Use shadcn/ui components from `@/components/ui/*`
- Handle all 4 connection states in UI
- Show loading indicators during async ops
- Use refs for mutable values in hooks (currentAssistantMessageRef)
- Track connection attempt with useRef to prevent loops

### Common Bug: Infinite Reconnect Loop
```typescript
// BAD - Creates new object every render
const options = { onError: (e) => console.log(e) }
useGridAgent(options) // Triggers re-render loop

// GOOD - Memoize options
const options = useMemo(() => ({
  onError: (e) => console.error(e)
}), [])
useGridAgent(options)
```
## Final Reminder

You are not generating "a frontend" - you are crafting an experience. Every choice should serve the concept. Every detail should reinforce the story. The user should feel something when they see it.

Make it memorable. Make it distinctive. Make it feel designed, not generated.

## Resources

- `references/component-structure.md` - Full 27-component hierarchy with paths
- `references/websocket-protocol.md` - Complete message type definitions
