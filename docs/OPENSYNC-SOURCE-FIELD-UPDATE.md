# OpenSync Source Field Update

Add support for tracking the `source` of synced sessions to distinguish between different sync sources (claude-code, opencode, cursor, etc.). The claude-code-sync plugin sends a `source: "claude-code"` field but opensync doesn't currently store it.

## Context

The `claude-code-sync` npm plugin (https://github.com/waynesutton/clauder-plugin-files) syncs Claude Code sessions to opensync via the `/sync/session` and `/sync/message` HTTP endpoints. It sends data like:

```typescript
// SessionData from plugin
{
  sessionId: string,        // maps to externalId
  source: "claude-code",    // THIS IS NOT BEING STORED
  title?: string,
  projectPath?: string,
  projectName?: string,
  model?: string,
  // ... other fields
}
```

## Tasks

### 1. Update convex/schema.ts

Add a `source` field to the `sessions` table:

```typescript
source: v.optional(v.string()), // "claude-code", "opencode", "cursor", etc.
```

Add an index for filtering by source:

```typescript
.index("by_user_source", ["userId", "source"])
```

### 2. Update convex/sessions.ts

In the `upsert` internal mutation:
- Add `source: v.optional(v.string())` to args
- Store `source` when creating new sessions
- Update `source` when updating existing sessions (only if provided)

### 3. Update convex/http.ts

In the `/sync/session` endpoint, pass through the `source` field to the upsert mutation. The plugin sends it as `body.source`.

### 4. Update convex/analytics.ts

Add a query to get source stats (similar to `providerStats`):

```typescript
export const sourceStats = query({
  // Return sessions grouped by source with token counts, costs, etc.
});
```

Update `sessionsWithDetails` to accept an optional `filterSource` parameter.

### 5. (Optional) Update Dashboard UI

In `src/pages/Dashboard.tsx`:

- Add `filterSource` state similar to existing `filterProvider`
- Add source to `filterOptions` extraction
- Add source filter dropdown in SessionsView
- Consider adding a visual badge/icon to show session source (e.g., a Claude icon for "claude-code" sessions)

## Field Mapping Reference

| Plugin sends | OpenSync stores |
|--------------|-----------------|
| `sessionId` | `externalId` |
| `source` | `source` (NEW) |
| `projectPath` | `projectPath` |
| `projectName` | `projectName` |
| `model` | `model` |
| `title` | `title` |

## Expected Source Values

| Value | Description |
|-------|-------------|
| `"claude-code"` | Sessions from Claude Code via claude-code-sync plugin |
| `"opencode"` | Sessions from OpenCode CLI (existing) |
| `undefined` / `null` | Legacy sessions or unknown source |

## Data Flow

```
Claude Code → claude-code-sync plugin → /sync/session HTTP endpoint → sessions.upsert mutation → Convex DB
```

The plugin hooks into Claude Code lifecycle events:
- `SessionStart` - Creates/updates session
- `UserPromptSubmit` - Syncs user messages
- `PostToolUse` - Syncs tool call results
- `Stop` - Syncs assistant responses
- `SessionEnd` - Finalizes session

## Testing

After changes:

1. Run `npx convex dev` to push schema changes
2. Use `claude-code-sync synctest` to create a test session
3. Verify the session appears in the dashboard with source = "claude-code"
4. Test filtering by source in the UI

## Related Files

**OpenSync repo:**
- `convex/schema.ts` - Database schema
- `convex/sessions.ts` - Session upsert mutation
- `convex/http.ts` - HTTP sync endpoints
- `convex/analytics.ts` - Stats queries
- `src/pages/Dashboard.tsx` - Dashboard UI

**Plugin repo:**
- `src/index.ts` - Plugin entry point and SyncClient
- `src/cli.ts` - CLI commands and hooks
