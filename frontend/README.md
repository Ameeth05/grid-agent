# GridAgent Frontend

A sophisticated Next.js application for GridAgent - AI Analyst for US Grid and Power Markets.

## Features

- **Landing Page**: Professional hero section with animated grid background, example prompt chips, and feature showcase
- **Chat Interface**: Real-time WebSocket communication with the AI agent, tool execution display, file upload support
- **Authentication**: Supabase Auth integration with Google OAuth and email/password
- **Dark/Light Mode**: System-aware theme with persistent preference
- **Responsive Design**: Mobile-first design with collapsible sidebar

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animation**: Framer Motion
- **Auth**: Supabase (@supabase/ssr)
- **WebSocket**: Custom client for E2B sandbox communication

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (for auth)
- Backend API running (Railway)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your environment variables in .env.local
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Landing page
│   ├── chat/              # Chat interface
│   ├── about/             # About page
│   ├── watchlist/         # Project watchlist
│   ├── blog/              # Blog posts
│   ├── news/              # Grid news
│   └── auth/callback/     # OAuth callback handler
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── landing/           # Landing page components
│   ├── chat/              # Chat interface components
│   ├── layout/            # Header, Footer, ThemeToggle
│   └── auth/              # Auth components
├── lib/
│   ├── supabase/          # Supabase client configuration
│   ├── gridagent-client.ts # WebSocket client
│   └── utils.ts           # Utility functions
├── hooks/
│   ├── useAuth.ts         # Authentication hook
│   ├── useGridAgent.ts    # WebSocket agent hook
│   └── useTheme.ts        # Theme management hook
└── types/
    └── index.ts           # TypeScript types
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

## WebSocket Communication

The frontend connects directly to the E2B sandbox via WebSocket (not proxied through backend).

### Flow

1. User signs in via Supabase Auth
2. Frontend calls `POST /api/start-session` with JWT token
3. Backend returns WebSocket URL for the sandbox
4. Frontend connects directly to sandbox WebSocket
5. Messages are streamed in real-time

### Message Types

**Outgoing (to sandbox)**:
- `query`: Send a text query
- `query_with_files`: Send query with file attachments
- `upload_file`: Upload a file

**Incoming (from sandbox)**:
- `text`: Streamed text response
- `tool_start`: Tool execution started
- `tool_result`: Tool execution completed
- `error`: Error message
- `done`: Query completed with token usage

## Design System

- **Colors**: Electric blue (#3B82F6) as accent, deep navy/charcoal for dark mode
- **Typography**: Inter font family
- **Components**: shadcn/ui with custom variants
- **Animations**: Framer Motion for smooth transitions

## License

MIT
