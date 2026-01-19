# Cursor Prompts for OpenSync Claude Code Support

Copy these prompts into Cursor to update the OpenSync backend to support Claude Code sessions.

---

## Prompt 1: Schema Update

```
Update `convex/schema.ts` to support Claude Code sessions. Add these fields to the sessions table:

**Source field (required for both OpenCode and Claude Code):**
- `source`: union of "opencode" | "claude-code", make it optional for backwards compatibility but new sessions should include it

**Claude Code specific fields (all optional):**
- `startType`: optional string ("new", "resume", "continue")
- `endReason`: optional string ("user_stop", "max_turns", "error", "completed")  
- `cwd`: optional string (current working directory)
- `gitBranch`: optional string
- `gitRepo`: optional string
- `thinkingEnabled`: optional boolean
- `permissionMode`: optional string
- `mcpServers`: optional array of strings
- `messageCount`: optional number
- `toolCallCount`: optional number
- `tokenUsage`: optional object with `input` (number) and `output` (number)
- `costEstimate`: optional number

Add these indexes:
- `by_source`: index on ["source"]

For the messages table, add these optional fields:
- `source`: optional union of "opencode" | "claude-code"
- `thinkingContent`: optional string
- `toolName`: optional string
- `toolArgs`: optional any (for JSON object)
- `toolResult`: optional string
- `durationMs`: optional number

Existing sessions without a source field should still work. Treat missing source as "opencode" for backwards compatibility.
```

---

## Prompt 2: HTTP Handlers Update

```
Update `convex/http.ts` to accept Claude Code sessions. The `/sync/session` and `/sync/message` endpoints need to:

1. Accept a `source` field in the request body with value "claude-code" (in addition to existing "opencode" support)

2. For `/sync/session`, handle these Claude Code fields in the request body:
   - `source` (optional, default "opencode"): "opencode" | "claude-code"
   - `startType` (optional): string
   - `endReason` (optional): string
   - `cwd` (optional): string
   - `gitBranch` (optional): string
   - `gitRepo` (optional): string
   - `thinkingEnabled` (optional): boolean
   - `permissionMode` (optional): string
   - `mcpServers` (optional): string[]
   - `messageCount` (optional): number
   - `toolCallCount` (optional): number
   - `tokenUsage` (optional): { input: number, output: number }
   - `costEstimate` (optional): number

3. For `/sync/message`, handle these additional fields:
   - `source` (optional): "opencode" | "claude-code"
   - `thinkingContent` (optional): string
   - `toolName` (optional): string
   - `toolArgs` (optional): object
   - `toolResult` (optional): string
   - `durationMs` (optional): number

4. Default `source` to "opencode" if not provided (backwards compatibility)

5. Validate that `source` is one of the allowed values if provided, return 400 error if invalid

6. Keep existing API key authentication unchanged

The existing fields (sessionId, title, projectPath, projectName, model, etc.) should continue to work the same for both sources. Just pass through the new fields to the mutation.
```

---

## Prompt 3: Dashboard Source Filter

```
Add a source filter to the sessions list in the OpenSync dashboard. Users should be able to filter sessions by their source (OpenCode vs Claude Code).

Implementation requirements:

1. Add a filter dropdown or segmented control near the search bar with options:
   - "All Sources" (default)
   - "OpenCode" 
   - "Claude Code"

2. Store the selected filter in component state

3. Pass the source filter to the sessions query. If "All Sources" is selected, don't filter by source. Otherwise filter where source equals the selected value.

4. On session cards/rows, show a small badge or icon indicating the source:
   - Use a terminal/code icon for OpenCode
   - Use the Claude/Anthropic icon or a different icon for Claude Code
   - Consider using different accent colors to distinguish them

5. The filter should work alongside existing search functionality

6. Handle sessions that don't have a source field (legacy data) - treat them as "opencode"

Add this to the main sessions list view, likely in the Dashboard or Sessions page component.
```

---

## Prompt 4: Stats by Source (Optional Enhancement)

```
Update the stats/analytics display to show breakdown by source.

In the Settings or Stats page, show:

1. Total sessions with breakdown:
   - Total: X sessions
   - OpenCode: Y sessions  
   - Claude Code: Z sessions

2. Token usage by source:
   - OpenCode: X tokens (Y input / Z output)
   - Claude Code: X tokens (Y input / Z output)

3. In the analytics queries, add grouping by source field

This helps users understand their usage across different coding tools.
```

---

## Testing Commands

After applying the prompts, test with these curl commands:

```bash
# Test session sync with Claude Code source
curl -X POST https://YOUR_CONVEX_URL.convex.site/sync/session \
  -H "Authorization: Bearer osk_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-claude-001",
    "source": "claude-code",
    "title": "Test Claude Code Session",
    "projectName": "my-project",
    "model": "claude-sonnet-4-20250514",
    "startType": "new",
    "cwd": "/Users/test/projects/my-project",
    "thinkingEnabled": false
  }'

# Test message sync
curl -X POST https://YOUR_CONVEX_URL.convex.site/sync/message \
  -H "Authorization: Bearer osk_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-claude-001",
    "messageId": "msg-001",
    "source": "claude-code",
    "role": "user",
    "content": "Help me fix this bug"
  }'

# Test tool call message
curl -X POST https://YOUR_CONVEX_URL.convex.site/sync/message \
  -H "Authorization: Bearer osk_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-claude-001",
    "messageId": "msg-002", 
    "source": "claude-code",
    "role": "assistant",
    "toolName": "read_file",
    "toolArgs": {"path": "src/index.ts"},
    "toolResult": "file contents here...",
    "durationMs": 150
  }'

# Verify session appears in API
curl -X GET "https://YOUR_CONVEX_URL.convex.site/api/sessions" \
  -H "Authorization: Bearer osk_YOUR_API_KEY"
```

Replace `YOUR_CONVEX_URL` and `YOUR_API_KEY` with your actual values.
