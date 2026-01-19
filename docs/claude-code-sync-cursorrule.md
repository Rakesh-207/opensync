# Claude Code Sync Plugin Development

You are building `claude-code-sync`, a CLI tool that syncs Claude Code sessions to a Convex backend. This rule provides context for implementing the plugin correctly.

## Project Overview

A Node.js CLI that integrates with Claude Code's hook system to capture session data, tool usage, and messages, then syncs them to a Convex backend via HTTP endpoints.

## Tech Stack

- **Runtime**: Node.js 18+ with ES modules
- **Language**: TypeScript
- **CLI Framework**: Commander.js or yargs
- **HTTP Client**: Native fetch or undici
- **Config Storage**: `~/.config/claude-code-sync/config.json`
- **Build**: tsup or esbuild for single-file output

## Claude Code Hook Events

The plugin uses these hook events from Claude Code:

### SessionStart
Fires when a session begins. Source values: `startup`, `resume`, `clear`, `compact`

```typescript
interface SessionStartInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  hook_event_name: "SessionStart";
  source: "startup" | "resume" | "clear" | "compact";
}
```

### SessionEnd
Fires when session terminates. Reason values: `clear`, `logout`, `prompt_input_exit`, `exit`, `other`

```typescript
interface SessionEndInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  hook_event_name: "SessionEnd";
  reason: string;
}
```

### UserPromptSubmit
Fires when user submits a prompt, before Claude processes it.

```typescript
interface UserPromptSubmitInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  hook_event_name: "UserPromptSubmit";
  prompt: string;
}
```

### PostToolUse
Fires after a tool completes execution.

```typescript
interface PostToolUseInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  hook_event_name: "PostToolUse";
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_result: {
    success: boolean;
    output?: string;
    error?: string;
  };
}
```

### Stop
Fires when Claude finishes responding.

```typescript
interface StopInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  hook_event_name: "Stop";
  stop_hook_active: boolean;
}
```

## Hook Integration

Hooks receive JSON via stdin and output JSON via stdout. Exit codes control behavior:
- Exit 0: Success, stdout shown in verbose mode
- Exit 2: Blocking error, stderr fed to Claude

### Hook Configuration Format

For `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "claude-code-sync hook SessionStart"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "claude-code-sync hook SessionEnd"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "claude-code-sync hook UserPromptSubmit"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "claude-code-sync hook PostToolUse"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "claude-code-sync hook Stop"
          }
        ]
      }
    ]
  }
}
```

## CLI Commands

Implement these commands:

```
claude-code-sync login          # Interactive setup
claude-code-sync logout         # Clear credentials
claude-code-sync status         # Show config and test connection
claude-code-sync config         # Display current config
claude-code-sync config --json  # Output config as JSON
claude-code-sync set <key> <value>  # Update config option
claude-code-sync hook <event>   # Handle hook events (reads stdin)
```

## Config File Structure

Location: `~/.config/claude-code-sync/config.json`

```typescript
interface Config {
  convexUrl: string;      // https://project.convex.cloud or .site
  apiKey: string;         // osk_xxxxx
  autoSync: boolean;      // default: true
  syncToolCalls: boolean; // default: true
  syncThinking: boolean;  // default: false
}
```

## Environment Variables

Support these env vars as config overrides:

```
CLAUDE_SYNC_CONVEX_URL
CLAUDE_SYNC_API_KEY
CLAUDE_SYNC_AUTO_SYNC
CLAUDE_SYNC_TOOL_CALLS
CLAUDE_SYNC_THINKING
```

## API Endpoints

Send data to Convex via HTTP:

### POST /sync/session
```typescript
interface SessionPayload {
  sessionId: string;
  source: "claude-code";
  projectPath: string;
  projectName: string;
  cwd: string;
  gitBranch?: string;
  model?: string;
  startType: "new" | "resume" | "continue";
  endReason?: string;
  messageCount: number;
  toolCallCount: number;
  tokenUsage?: { input: number; output: number };
  costEstimate?: number;
  thinkingEnabled: boolean;
  permissionMode: string;
  mcpServers?: string[];
  startedAt: string;
  endedAt?: string;
}
```

### POST /sync/message
```typescript
interface MessagePayload {
  sessionId: string;
  messageId: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: string;
  durationMs?: number;
  tokenCount?: number;
  thinkingContent?: string;
  timestamp: string;
}
```

## Privacy and Redaction

Implement automatic redaction for sensitive patterns:

```typescript
const SENSITIVE_PATTERNS = [
  /api[_-]?key[s]?\s*[:=]\s*['"]?[\w-]+/gi,
  /token[s]?\s*[:=]\s*['"]?[\w-]+/gi,
  /password[s]?\s*[:=]\s*['"]?[^\s'"]+/gi,
  /secret[s]?\s*[:=]\s*['"]?[\w-]+/gi,
  /bearer\s+[\w-]+/gi,
  /sk-[a-zA-Z0-9]+/g,
  /osk_[a-zA-Z0-9]+/g,
];

function redactSensitive(content: string): string {
  let redacted = content;
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  return redacted;
}
```

## URL Normalization

Accept both `.convex.cloud` and `.convex.site`, normalize to `.site` for API calls:

```typescript
function normalizeConvexUrl(url: string): string {
  return url.replace(".convex.cloud", ".convex.site");
}
```

## Session State Management

Track session state in memory during hook execution:

```typescript
interface SessionState {
  sessionId: string;
  startedAt: Date;
  messageCount: number;
  toolCallCount: number;
  messages: MessagePayload[];
}

// Store in temp file for persistence across hook invocations
const STATE_FILE = "/tmp/claude-code-sync-state.json";
```

## Error Handling

- Never block Claude Code operations on sync failures
- Log errors to stderr with `[claude-code-sync]` prefix
- Retry failed syncs with exponential backoff
- Store failed syncs for later retry

## File Structure

```
claude-code-sync/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── commands/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   ├── status.ts
│   │   ├── config.ts
│   │   ├── set.ts
│   │   └── hook.ts
│   ├── hooks/
│   │   ├── session-start.ts
│   │   ├── session-end.ts
│   │   ├── user-prompt.ts
│   │   ├── post-tool-use.ts
│   │   └── stop.ts
│   ├── lib/
│   │   ├── config.ts     # Config management
│   │   ├── api.ts        # Convex API client
│   │   ├── state.ts      # Session state
│   │   ├── redact.ts     # Sensitive data redaction
│   │   └── git.ts        # Git branch detection
│   └── types.ts          # TypeScript interfaces
├── package.json
├── tsconfig.json
└── README.md
```

## Package.json

```json
{
  "name": "claude-code-sync",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "claude-code-sync": "./dist/index.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --watch"
  },
  "dependencies": {
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Testing Hooks Locally

```bash
# Test SessionStart hook
echo '{"session_id":"test123","hook_event_name":"SessionStart","source":"startup","cwd":"/project","transcript_path":"/path/to/transcript.jsonl","permission_mode":"default"}' | claude-code-sync hook SessionStart

# Test with debug output
claude --debug
```

## Reference Documentation

- Hooks Reference: https://code.claude.com/docs/en/hooks
- Create Plugins: https://code.claude.com/docs/en/plugins
- Agent SDK TypeScript: https://code.claude.com/docs/en/sdk/sdk-typescript
- Plugins in SDK: https://platform.claude.com/docs/en/agent-sdk/plugins
