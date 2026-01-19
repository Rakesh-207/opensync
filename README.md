# OpenSync

Sync, search, and share your AI coding sessions. Built with Convex.

```
   ____                   _____                 
  / __ \                 / ____|                
 | |  | |_ __   ___ _ __| (___  _   _ _ __   ___ 
 | |  | | '_ \ / _ \ '_ \\___ \| | | | '_ \ / __|
 | |__| | |_) |  __/ | | |___) | |_| | | | | (__ 
  \____/| .__/ \___|_| |_|____/ \__, |_| |_|\___|
        | |                      __/ |          
        |_|                     |___/           
```

## What is this?

OpenSync stores your AI coding sessions from OpenCode and Claude Code in the cloud:

- **Automatic sync** as you code with OpenCode or Claude Code
- **Full-text search** across all sessions
- **Semantic search** to find sessions by meaning
- **Public sharing** with one click
- **API access** for context engineering and integrations
- **Usage stats** including tokens, cost, time
- **Eval exports** for DeepEval, OpenAI Evals, and Promptfoo (coming soon)

## Quick Start

### 1. Deploy Your Backend

```bash
# Clone the repo
git clone https://github.com/waynesutton/opensync.git
cd opensync

# Install dependencies
npm install

# Deploy to Convex
npx convex dev
```

See [SETUP.md](docs/SETUP.md) for detailed instructions.

### 2. Get Your API Key

1. Log into your OpenSync dashboard via WorkOS
2. Go to **Settings**
3. Click **Generate API Key**
4. Copy the key (starts with `osk_`)

### 3. Install a Plugin

**For OpenCode:** ([npm](https://www.npmjs.com/package/opencode-sync-plugin))

```bash
npm install -g opencode-sync-plugin
opencode-sync login
```

Enter when prompted:
- **Convex URL**: Your deployment URL (e.g., `https://your-project.convex.cloud`)
- **API Key**: Your API key from Settings (e.g., `osk_abc123...`)

Then add to your `opencode.json`:

```json
{
  "plugin": ["opencode-sync-plugin"]
}
```

**For Claude Code (Coming Soon):**

```bash
claude-code-sync login
```

Enter when prompted:
- **Convex URL**: Your deployment URL
- **API Key**: Your API key from Settings

Or configure via `~/.config/claude-code-sync/config.json`:

```json
{
  "convexUrl": "https://your-deployment.convex.cloud",
  "apiKey": "osk_your_api_key"
}
```

### 4. Start Coding

Your sessions sync automatically. No browser authentication required for plugins.

## Features

| Feature | Description |
|---------|-------------|
| Auto Sync | Sessions sync in real-time as you work |
| Full-Text Search | Search by keywords across all sessions |
| Semantic Search | Search by meaning using vector embeddings |
| Hybrid Search | Combines full-text and semantic for best results |
| Public Sharing | Share sessions with a single click (`/s/:slug`) |
| Markdown Export | Download sessions as Markdown files |
| API Access | Secure API for external integrations (API key auth) |
| Usage Stats | Track tokens, cost, time per session and overall |
| RAG Support | Built-in retrieval for context engineering |
| Session Management | View, search, and delete sessions |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│    OpenCode     │────▶│ opencode-sync   │──┐
│    (CLI)        │     │  plugin (npm)   │  │  API Key Auth
└─────────────────┘     └─────────────────┘  │  (osk_*)
                                             ├────────────────────┐
┌─────────────────┐     ┌─────────────────┐  │                    │
│  Claude Code    │────▶│ claude-code-sync│──┘                    ▼
│    (CLI)        │     │  plugin (py)    │              ┌─────────────────┐
└─────────────────┘     └─────────────────┘              │   Convex        │
                                                         │   (Backend)     │
┌─────────────────┐                                      └─────────────────┘
│   Web Browser   │────────────────────────────────────────────────┤
│   (Dashboard)   │  WorkOS JWT Auth                               │
└─────────────────┘                                                │
                                              ┌────────────┬───────┴────────┐
                                              ▼            ▼                ▼
                                       ┌──────────┐ ┌──────────┐     ┌──────────┐
                                       │  Web UI  │ │ API      │     │ OpenAI   │
                                       │  (React) │ │ (/api/*) │     │ Embed    │
                                       └──────────┘ └──────────┘     └──────────┘
```

**Authentication:**
- **Plugins** use API Key authentication (`osk_*` prefix). No browser required.
- **Web UI** uses WorkOS OAuth for enterprise authentication.
- **API Endpoints** accept both API Key and JWT tokens.

## API Endpoints

All endpoints require authentication via Bearer token (JWT or API key).

### Sync Endpoints (for plugin)

| Endpoint | Description |
|----------|-------------|
| `POST /sync/session` | Sync a session |
| `POST /sync/message` | Sync a message |
| `POST /sync/batch` | Batch sync sessions and messages |

### Public API

| Endpoint | Description |
|----------|-------------|
| `GET /api/sessions` | List all sessions |
| `GET /api/sessions/get?id=` | Get session with messages |
| `GET /api/search?q=&type=` | Search (fulltext/semantic/hybrid) |
| `GET /api/context?q=` | Get relevant context for LLM |
| `GET /api/export?id=&format=` | Export session (json/markdown/jsonl) |
| `GET /api/stats` | Get usage statistics |
| `GET /health` | Health check (no auth required) |

Generate an API key in Settings to use these endpoints.

## Project Structure

```
opensync/                # This repo - Convex backend + React UI
├── convex/              # Convex functions
│   ├── schema.ts        # Database schema
│   ├── sessions.ts      # Session queries/mutations
│   ├── messages.ts      # Message mutations
│   ├── search.ts        # Full-text and semantic search
│   ├── embeddings.ts    # Vector embedding generation
│   ├── http.ts          # HTTP endpoints (sync + API)
│   ├── api.ts           # Secure API functions
│   └── rag.ts           # RAG retrieval functions
├── src/                 # React frontend
│   ├── pages/           # Login, Dashboard, Settings, Docs, PublicSession
│   ├── components/      # Header, Sidebar, SessionViewer
│   └── lib/             # Auth utilities
└── docs/                # Documentation

opencode-sync-plugin/    # Published: npmjs.com/package/opencode-sync-plugin
├── src/
│   ├── index.ts         # Plugin hooks with API Key auth
│   └── cli.ts           # CLI commands (login, status, config)
├── package.json
└── README.md

claude-code-sync/        # Separate repo - Python plugin for Claude Code
├── src/
│   ├── index.ts         # Plugin hooks with API Key auth
│   └── cli.ts           # CLI commands (login, status, config)
├── package.json
└── README.md
```

**Note:** Plugins authenticate using API Keys (`osk_*`) generated in the OpenSync Settings page. No WorkOS OAuth flow required for plugins.

## Documentation

- [Setup Guide](docs/SETUP.md) - Full deployment instructions
- [API Reference](docs/API.md) - API endpoint documentation
- [OpenCode Plugin](docs/OPENCODE-PLUGIN.md) - OpenCode plugin installation
- [Claude Code Plugin](docs/CLAUDE-CODE-PLUGIN.md) - Claude Code plugin installation
- [Plugin Auth PRD](docs/PLUGIN-AUTH-PRD.md) - Plugin authentication specification
- [Sync for Evals PRD](docs/SYNC-FOR-EVALS-PRD.md) - Eval export feature specification
- [Features PRD](docs/PRD-FEATURES.md) - Future feature specifications
- `/docs` route in the web app provides interactive API documentation

## OpenSync ecosystem

Cloud synced dashboards that track session activity, tool usage, and token spend across projects.

| Project | Description | Links |
|---------|-------------|-------|
| **OpenSync** | Dashboards for OpenCode and Claude coding sessions | [Website](https://www.opensync.dev/) / [GitHub](https://github.com/waynesutton/opensync) |
| **opencode-sync-plugin** | Sync your OpenCode sessions to OpenSync | [GitHub](https://github.com/waynesutton/opencode-sync-plugin) / [npm](https://www.npmjs.com/package/opencode-sync-plugin) |
| **claude-code-sync** | Sync your Claude Code sessions to OpenSync | [GitHub](https://github.com/waynesutton/claude-code-sync) / [npm](https://www.npmjs.com/package/claude-code-sync) |

### Install the plugins

```bash
# For OpenCode
npm install -g opencode-sync-plugin

# For Claude Code
npm install -g claude-code-sync
```

## Tech Stack

- **Backend**: [Convex](https://convex.dev) - Real-time database with built-in search
- **Auth**: [WorkOS](https://workos.com) - Enterprise authentication
- **Frontend**: React + Vite + Tailwind
- **Embeddings**: OpenAI text-embedding-3-small

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex Vector Search](https://docs.convex.dev/search/vector-search)
- [Convex Full-Text Search](https://docs.convex.dev/search/text-search)
- [WorkOS User Management](https://workos.com/docs/user-management)

## License

MIT
