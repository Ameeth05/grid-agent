# GridAgent

AI-powered research agent for US Power Markets. Transform weeks of due diligence into minutes.

![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-beta-yellow)

## Overview

GridAgent is an intelligent research assistant that helps energy professionals analyze interconnection queues, cluster studies, and market data across US Independent System Operators (ISOs).

### Supported ISOs
- **PJM** - Pennsylvania-New Jersey-Maryland Interconnection
- **MISO** - Midcontinent Independent System Operator
- **SPP** - Southwest Power Pool
- **ERCOT** - Electric Reliability Council of Texas
- **NYISO** - New York Independent System Operator
- **ISO-NE** - ISO New England

## Architecture

```
Frontend (Vercel)  <-->  Backend (Railway)  <-->  E2B Sandbox
     |                        |                       |
  Next.js 14              FastAPI              Claude Agent SDK
  Tailwind CSS         JWT Auth (Supabase)     Custom Tools
  Streamdown           Sandbox Manager         S3 Data Access
```

### Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 14, Tailwind CSS | User interface with real-time chat |
| Backend | FastAPI, Python | Auth, session management, sandbox orchestration |
| Sandbox | E2B, Claude Agent SDK | Isolated AI agent execution environment |
| Database | Supabase | Authentication, user data, S3 storage |

## Features

- **Natural Language Queries** - Ask questions about interconnection projects in plain English
- **Real-time Streaming** - See AI responses as they're generated
- **Source Citations** - Every answer includes references to source data
- **Tool Execution** - Watch the agent analyze data, run calculations, and generate insights
- **Syntax Highlighting** - Code blocks with Shiki syntax highlighting
- **LaTeX Support** - Mathematical formulas rendered with KaTeX

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account
- E2B account
- Anthropic API key

### Environment Variables

**Frontend (.env.local)**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_BACKEND_URL=your_backend_url
```

**Backend (.env)**
```env
ANTHROPIC_API_KEY=your_anthropic_key
E2B_API_KEY=your_e2b_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_S3_ENDPOINT=your_s3_endpoint
SUPABASE_S3_ACCESS_KEY=your_s3_access_key
SUPABASE_S3_SECRET_KEY=your_s3_secret_key
```

### Local Development

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Deployment

| Platform | Component | Guide |
|----------|-----------|-------|
| Vercel | Frontend | Connect GitHub repo, auto-deploys |
| Railway | Backend | Connect GitHub repo, set env vars |
| E2B | Sandbox | `cd e2b-template && e2b template build` |

## Project Structure

```
GridAgent/
├── frontend/           # Next.js frontend
│   ├── app/           # App router pages
│   ├── components/    # React components
│   └── lib/           # Utilities and services
├── backend/           # FastAPI backend
│   ├── main.py        # API endpoints
│   ├── auth.py        # JWT verification
│   └── sandbox_manager.py  # E2B lifecycle
├── e2b-template/      # E2B sandbox template
│   ├── Dockerfile     # Sandbox image
│   ├── gridagent_server.py  # Agent server
│   └── e2b.toml       # E2B configuration
└── CLAUDE.md          # Claude Code instructions
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check with diagnostics |
| GET | `/ready` | Readiness check for load balancers |
| POST | `/api/start-session` | Create or resume a sandbox session |

## Security

- JWT authentication via Supabase
- Command injection prevention with input validation
- Isolated sandbox execution per user
- S3 bucket isolation with user-specific prefixes

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

---

Built with [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) and [E2B](https://e2b.dev)
