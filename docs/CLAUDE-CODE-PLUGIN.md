# Claude Code Sync Plugin

Sync your Claude Code sessions to the OpenSync dashboard. Track coding sessions, analyze tool usage, and monitor token consumption across projects.

**Status:** Coming Soon

## Installation

```bash
npm install -g claude-code-sync
```

Or from the Claude Code marketplace (when available):

```bash
/plugin install claude-code-sync
```

## Authentication

All plugins use **API Key authentication**. No browser OAuth flow required.

### Step 1: Get Your API Key

1. Log into your OpenSync dashboard
2. Go to **Settings**
3. Click **Generate API Key**
4. Copy the key (starts with `osk_`)

### Step 2: Configure the Plugin

```bash
claude-code-sync login
```

Enter when prompted:
- **Convex URL**: Your deployment URL (e.g., `https://your-project.convex.cloud`)
- **API Key**: Your API key from Settings (e.g., `osk_abc123...`)

No browser authentication required.

### Configuration File

Credentials are stored at `~/.config/claude-code-sync/config.json`:

```json
{
  "convexUrl": "https://your-deployment.convex.cloud",
  "apiKey": "osk_your_api_key"
}
```

Or use environment variables:

```bash
export CLAUDE_SYNC_CONVEX_URL="https://your-deployment.convex.cloud"
export CLAUDE_SYNC_API_KEY="osk_your_api_key"
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `convexUrl` | string | required | Your Convex deployment URL (.cloud or .site) |
| `apiKey` | string | required | API key from OpenSync Settings (osk_*) |
| `autoSync` | boolean | `true` | Automatically sync when sessions end |
| `syncToolCalls` | boolean | `true` | Include tool call details |
| `syncThinking` | boolean | `false` | Include thinking/reasoning traces |

## CLI Commands

| Command | Description |
|---------|-------------|
| `claude-code-sync login` | Configure with Convex URL and API Key |
| `claude-code-sync logout` | Clear stored credentials |
| `claude-code-sync status` | Show authentication status |
| `claude-code-sync config` | Show current configuration |

### Check sync status

```bash
claude-code-sync status
```

Shows your current configuration and tests the connection to your Convex backend.

### Manual sync (via Claude Code command)

```
/claude-code-sync:sync-now
```

Manually sync the current session without waiting for it to end.

## What Gets Synced

| Data | Description |
|------|-------------|
| Session metadata | Project name, working directory, git branch, timestamps |
| User prompts | Your messages to Claude (truncated for privacy) |
| Tool calls | Which tools were used and their outcomes |
| Token usage | Input and output token counts |
| Model info | Which Claude model was used |

Sensitive data like passwords, tokens, and API keys are automatically redacted.

## How It Works

The plugin registers hooks that fire at key points in Claude Code's lifecycle:

1. **SessionStart**: Records when you begin a session
2. **UserPromptSubmit**: Tracks each prompt you send
3. **PostToolUse**: Logs tool executions
4. **Stop**: Notes when Claude finishes responding
5. **SessionEnd**: Syncs the full transcript

All events are sent to your Convex backend in real-time.

## Privacy

- All data goes to YOUR Convex deployment. No third parties.
- Sensitive fields are redacted before sync.
- Full file contents are not synced, only paths and lengths.
- Thinking traces are off by default.
- You control what gets synced via configuration.

## Requirements

- Claude Code v1.0.41 or later
- Python 3.10+ with `uv` available
- A deployed Convex backend (see [OpenSync Setup Guide](./SETUP.md))

---

## Backend Setup (For Maintainers)

If you're setting up the OpenSync backend to support Claude Code sessions, follow these additional steps.

### Step 1: Update the Convex Schema

Add the `source` field to distinguish between OpenCode and Claude Code sessions. In `convex/schema.ts`:

```typescript
sessions: defineTable({
  // Existing fields...
  
  // Add this field
  source: v.union(v.literal("opencode"), v.literal("claude-code")),
  
  // Claude Code specific fields
  startType: v.optional(v.string()),
  endReason: v.optional(v.string()),
  messageCount: v.optional(v.number()),
  toolCallCount: v.optional(v.number()),
  tokenUsage: v.optional(v.object({
    input: v.number(),
    output: v.number(),
  })),
  model: v.optional(v.string()),
})
  .index("by_session_id", ["sessionId"])
  .index("by_source", ["source"])
  .index("by_project", ["projectName"])
```

Push the schema:

```bash
npx convex dev
```

### Step 2: Add Sync Functions

Create `convex/sync.ts` with the `recordEvent` mutation to handle events from Claude Code. See the full implementation in the main codebase.

### Step 3: Run Migration (If Existing Data)

If you have existing OpenCode sessions, migrate them to include the source field:

```bash
npx convex run migrations:addSourceToExisting
```

### Step 4: Update the WebUI (Optional)

Add source filtering to the sessions list so users can filter between OpenCode and Claude Code sessions.

---

## Troubleshooting

### "No Convex URL configured"

Run `claude-code-sync login` to configure your Convex URL and API Key.

### "Invalid API key" errors

1. Go to OpenSync Settings
2. Generate a new API key
3. Run `claude-code-sync login` with the new key

### "Connection failed"

Check that:
1. Your Convex deployment is running
2. The URL is correct (can be `.convex.cloud` or `.convex.site`)
3. Your API key is valid (starts with `osk_`)

### Sync not working

Run `claude-code-sync status` to diagnose issues.

### Sessions not appearing in dashboard

1. Wait a few seconds for sync to complete
2. Refresh the OpenSync dashboard
3. Check your user account matches between plugin and dashboard

## URL Format

The plugin accepts both URL formats:
- `https://your-project.convex.cloud` (dashboard URL)
- `https://your-project.convex.site` (HTTP endpoint URL)

The plugin automatically normalizes to `.site` for API calls.

## Related

- [OpenSync Setup Guide](./SETUP.md) - Deploy your own OpenSync instance
- [OpenCode Plugin](./OPENCODE-PLUGIN.md) - Sync OpenCode sessions
- [Plugin Auth PRD](./PLUGIN-AUTH-PRD.md) - Authentication specification
- [API Reference](./API.md) - Access your sessions programmatically
