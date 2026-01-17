# Plugin Authentication PRD

Specification for authenticating OpenSync plugins (OpenCode and Claude Code) using API Key authentication.

## Overview

All OpenSync plugins use **API Key authentication** instead of WorkOS OAuth. This simplifies the setup process and provides a consistent authentication method across all plugins.

## Authentication Flow

### User Setup

1. User deploys OpenSync backend (Convex)
2. User logs into OpenSync web dashboard via WorkOS
3. User navigates to **Settings > API Key**
4. User clicks "Generate API Key"
5. User receives API key starting with `osk_` (e.g., `osk_abc123xyz789...`)
6. User configures their plugin with:
   - Convex URL (`.cloud` or `.site` format)
   - API Key (`osk_*`)

### Plugin Authentication

Plugins authenticate by including the API key in the `Authorization` header:

```
Authorization: Bearer osk_your_api_key_here
```

No token refresh, no OAuth flow, no browser redirects.

## API Endpoints

### Base URL

Plugins use the Convex **site** URL (`.convex.site`) for HTTP endpoints:

```
https://your-project-123.convex.site
```

### URL Normalization

Plugins should accept **both** `.convex.cloud` and `.convex.site` URL formats from users and normalize internally to `.site`:

```typescript
// Normalize URL to .site format for HTTP endpoints
// Accepts both .convex.cloud and .convex.site formats
function normalizeToSiteUrl(url: string): string {
  if (url.includes(".convex.cloud")) {
    return url.replace(".convex.cloud", ".convex.site");
  }
  // Already .site or other format, return as-is
  return url;
}
```

**Why support both formats?**

- Users with WebUI hosted externally (Vercel, Netlify) see `.cloud` in Convex dashboard
- Users with WebUI self-hosted on Convex (via self-static-hosting) see `.site` in their browser
- Accepting both provides the best user experience regardless of hosting setup

### Sync Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sync/session` | POST | Create or update a session |
| `/sync/message` | POST | Create or update a message |
| `/sync/batch` | POST | Batch sync sessions and messages |
| `/health` | GET | Health check (no auth required) |

### Request Headers

All sync requests must include:

```
Content-Type: application/json
Authorization: Bearer osk_your_api_key
```

### Session Sync Payload

```json
{
  "externalId": "session_unique_id",
  "title": "Session title",
  "projectPath": "/path/to/project",
  "projectName": "project-name",
  "model": "claude-3-5-sonnet-20241022",
  "provider": "anthropic",
  "promptTokens": 1500,
  "completionTokens": 2000,
  "cost": 0.0245
}
```

### Message Sync Payload

```json
{
  "sessionExternalId": "session_unique_id",
  "externalId": "message_unique_id",
  "role": "user|assistant|system",
  "textContent": "The plain text content",
  "model": "claude-3-5-sonnet-20241022",
  "promptTokens": 500,
  "completionTokens": 1000,
  "durationMs": 5000,
  "parts": [
    { "type": "text", "content": "Plain text content" },
    { "type": "tool-call", "content": { "name": "read_file", "args": { "path": "src/app.ts" } } },
    { "type": "tool-result", "content": { "result": "file contents..." } }
  ]
}
```

## WebUI Updates Required

### Settings Page

The Settings page (`src/pages/Settings.tsx`) already has API key generation. No changes needed.

### Documentation Page

Update `src/pages/Docs.tsx` to reflect API Key authentication for plugins:

1. Update the FAQ section about plugin authentication
2. Update code examples to show API Key usage
3. Remove any references to WorkOS Client ID for plugin setup

### OPENCODE-PLUGIN.md

Update `docs/OPENCODE-PLUGIN.md` to match the new authentication flow:

```markdown
## Authentication

```bash
opencode-sync login
```

Enter when prompted:
- **Convex URL**: Your deployment URL (e.g., `https://your-project-123.convex.cloud`)
- **API Key**: Your API key from Settings (e.g., `osk_abc123...`)

No browser authentication required.
```

### SETUP.md

Update `docs/SETUP.md` Step 9 to reflect API Key authentication:

```markdown
## Step 9: Install the Plugin

Published on npm: [opencode-sync-plugin](https://www.npmjs.com/package/opencode-sync-plugin)

```bash
npm install -g opencode-sync-plugin
opencode-sync login
```

Enter:
- **Convex URL**: Your deployment URL (e.g., `https://your-project-123.convex.cloud`)
- **API Key**: Generate in OpenSync Settings page (starts with `osk_`)
```

## Claude Code Sync Plugin Specification

### Plugin Name

`claude-code-sync`

### Configuration File

`~/.config/claude-code-sync/config.json`:

```json
{
  "convexUrl": "https://your-project-123.convex.cloud",
  "apiKey": "osk_your_api_key"
}
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `claude-code-sync login` | Configure with Convex URL and API Key |
| `claude-code-sync logout` | Clear stored credentials |
| `claude-code-sync status` | Show authentication status |
| `claude-code-sync config` | Show current configuration |

### Event Hooks

Claude Code exposes similar events to OpenCode:

| Event | Description |
|-------|-------------|
| `session.created` | New coding session started |
| `session.updated` | Session metadata changed |
| `session.ended` | Session completed |
| `message.created` | New message in conversation |
| `message.updated` | Message content updated |
| `tool.called` | Tool/function was called |
| `tool.result` | Tool returned a result |

### Implementation Reference

Follow the same patterns as `opencode-sync-plugin`:

1. **Config storage**: Use `conf` package with project name `claude-code-sync`
2. **Authentication**: API Key in Authorization header
3. **URL normalization**: Accept both `.cloud` and `.site`, normalize to `.site` for API calls
4. **Deduplication**: Track synced sessions/messages by ID
5. **Error handling**: Log errors via plugin client, don't throw

### Sample Plugin Structure

```typescript
// claude-code-sync/src/index.ts

import Conf from "conf";
import { homedir } from "os";
import { join } from "path";

interface Config {
  convexUrl: string;
  apiKey: string;
}

const config = new Conf<Config>({
  projectName: "claude-code-sync",
  cwd: join(homedir(), ".config", "claude-code-sync"),
  configName: "config",
});

export function getConfig(): Config | null {
  const url = config.get("convexUrl");
  const key = config.get("apiKey");
  if (!url || !key) return null;
  return { convexUrl: url, apiKey: key };
}

export function setConfig(cfg: Config) {
  config.set("convexUrl", cfg.convexUrl);
  config.set("apiKey", cfg.apiKey);
}

export function clearConfig() {
  config.clear();
}

// Normalize URL to .site format for HTTP endpoints
// Accepts both .convex.cloud and .convex.site formats
function normalizeToSiteUrl(url: string): string {
  if (url.includes(".convex.cloud")) {
    return url.replace(".convex.cloud", ".convex.site");
  }
  return url;
}

// Get site URL for API calls
function getSiteUrl(): string | null {
  const cfg = getConfig();
  if (!cfg || !cfg.convexUrl) return null;
  return normalizeToSiteUrl(cfg.convexUrl);
}

// Sync functions follow same pattern as opencode-sync-plugin
async function syncSession(session: Session) {
  const cfg = getConfig();
  const siteUrl = getSiteUrl();
  if (!cfg || !siteUrl) return;
  
  await fetch(`${siteUrl}/sync/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      externalId: session.id,
      title: session.title,
      // ... other fields
    }),
  });
}
```

### Sample CLI

```typescript
// claude-code-sync/src/cli.ts

#!/usr/bin/env node

import { getConfig, setConfig, clearConfig } from "./index.js";

async function login() {
  console.log("\n  Claude Code Sync Login\n");
  
  const convexUrl = await prompt("Convex URL: ");
  const apiKey = await prompt("API Key (osk_...): ");
  
  if (!convexUrl || !apiKey) {
    console.error("Both Convex URL and API Key are required");
    process.exit(1);
  }
  
  // Validate URL format - accept both .cloud and .site
  if (!convexUrl.includes(".convex.cloud") && !convexUrl.includes(".convex.site")) {
    console.error("Invalid Convex URL. Should contain .convex.cloud or .convex.site");
    process.exit(1);
  }
  
  if (!apiKey.startsWith("osk_")) {
    console.error("Invalid API Key format. Should start with 'osk_'");
    process.exit(1);
  }
  
  setConfig({ convexUrl, apiKey });
  console.log("\nLogin successful!\n");
}

function status() {
  const cfg = getConfig();
  if (!cfg) {
    console.log("Not configured. Run: claude-code-sync login");
    return;
  }
  console.log("Configured");
  console.log("Convex URL:", cfg.convexUrl);
  console.log("API Key:", cfg.apiKey.slice(0, 8) + "...");
}
```

## Backend Validation

The OpenSync backend validates API keys in `convex/http.ts`:

```typescript
// Extract API key from Authorization header
const authHeader = request.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}

const token = authHeader.slice(7);

// Check if it's an API key (osk_*) or JWT
if (token.startsWith("osk_")) {
  // Validate API key against users table
  const user = await ctx.runMutation(internal.users.getByApiKey, { apiKey: token });
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), { status: 401 });
  }
  // Proceed with user context
} else {
  // Validate as JWT (for web clients)
  // ... existing JWT validation
}
```

## Security Considerations

1. **API keys are secrets**: Never log full API keys, only show first 8 and last 4 characters
2. **HTTPS only**: All sync endpoints require HTTPS
3. **User isolation**: API keys are tied to user accounts, ensuring data isolation
4. **Revocation**: Users can revoke API keys from the Settings page
5. **No expiration**: API keys don't expire (unlike JWTs), but can be manually revoked

## Migration Notes

### For Existing Users

If you previously used WorkOS OAuth authentication with the plugin:

1. Run `opencode-sync logout` to clear old credentials
2. Generate an API key in OpenSync Settings
3. Run `opencode-sync login` with your Convex URL and new API key

### Breaking Changes

- `workosClientId` config field removed
- `credentials.json` no longer used (was for OAuth tokens)
- Browser authentication flow removed

## Checklist

### WebUI Updates

- [ ] Update `docs/OPENCODE-PLUGIN.md` with API Key auth instructions
- [ ] Update `docs/SETUP.md` Step 9 with API Key auth
- [ ] Update `src/pages/Docs.tsx` FAQ section
- [ ] Verify Settings page API key generation works

### Claude Code Plugin

- [ ] Create `claude-code-sync` package
- [ ] Implement config storage with `conf`
- [ ] Implement CLI (login, logout, status, config)
- [ ] Implement event hooks for Claude Code
- [ ] Implement session sync
- [ ] Implement message sync
- [ ] Add deduplication for synced items
- [ ] Test end-to-end flow

### Backend

- [ ] Verify `/sync/session` accepts API key auth
- [ ] Verify `/sync/message` accepts API key auth
- [ ] Verify API key lookup by `osk_*` prefix
- [ ] Add API key validation logging

## Resources

- [OpenCode Plugin Spec](https://opencode.ai/docs/plugins/)
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions)
- [OpenSync API Reference](./API.md)
- [OpenSync Setup Guide](./SETUP.md)
