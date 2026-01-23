# codex-sync Setup Guide

Complete guide to building, publishing, and integrating codex-sync with OpenSync.

## Prerequisites

- Node.js 18+
- npm account (for publishing)
- OpenSync deployment
- OpenAI Codex CLI installed

## Project Structure

```
codex-sync/
├── src/
│   ├── index.ts           # Module exports
│   ├── cli.ts             # CLI entry point
│   ├── config.ts          # Configuration management
│   ├── parser.ts          # JSONL session parser
│   ├── client.ts          # OpenSync API client
│   ├── hook.ts            # Codex notify hook handler
│   ├── toml.ts            # TOML config utilities
│   └── types.ts           # TypeScript interfaces
├── docs/
│   ├── setup-codex-sync.md    # This file
│   ├── codex-sync-docs.md     # Architecture docs
│   └── codex-commands.md      # CLI reference
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

## Building from Source

### 1. Clone and Install

```bash
git clone https://github.com/waynesutton/codex-sync-plugin-plugin.git
cd codex-sync
npm install
```

### 2. Build TypeScript

```bash
npm run build
```

This compiles TypeScript to `dist/` directory.

### 3. Test Locally

```bash
# Link for local testing
npm link

# Test commands
codex-sync --help
codex-sync version
```

### 4. Run Development Mode

```bash
npm run watch
```

## Publishing to npm

### 1. Prepare for Publishing

Update `package.json`:

```json
{
  "name": "codex-sync",
  "version": "1.0.0",
  "description": "Sync your OpenAI Codex CLI sessions to OpenSync dashboard",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "codex-sync": "./dist/cli.js"
  }
}
```

### 2. Login to npm

```bash
npm login
```

### 3. Publish

```bash
# Dry run first
npm publish --dry-run

# Actual publish
npm publish
```

### 4. Verify Publication

```bash
npm view codex-sync
```

## Adding to OpenSync

### 1. Update OpenSync Schema

Add `codex-cli` to the source enum in `convex/schema.ts`:

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    // ... existing fields
    source: v.union(
      v.literal("opencode"),
      v.literal("claude-code"),
      v.literal("codex-cli"), // Add this line
      v.literal("api"),
    ),
    // ... rest of schema
  }),
});
```

### 2. Update Dashboard UI

Add Codex CLI option to source dropdown in `src/components/SessionFilters.tsx`:

```tsx
const sourceOptions = [
  { value: "all", label: "All Sources" },
  { value: "opencode", label: "OpenCode" },
  { value: "claude-code", label: "Claude Code" },
  { value: "codex-cli", label: "Codex CLI" }, // Add this line
];
```

### 3. Update Documentation

Add codex-sync to OpenSync README ecosystem table:

```markdown
| Package                                                | Description             | Install                     |
| ------------------------------------------------------ | ----------------------- | --------------------------- |
| [codex-sync](https://www.npmjs.com/package/codex-sync) | Sync Codex CLI sessions | `npm install -g codex-sync` |
```

### 4. Deploy Changes

```bash
cd opensync
npx convex deploy
npm run build
# Deploy frontend
```

## Configuration Files

### Plugin Config Location

```
~/.config/codex-sync/config.json
```

Example:

```json
{
  "convexUrl": "https://your-project.convex.cloud",
  "apiKey": "osk_your_api_key",
  "autoSync": true,
  "syncToolCalls": true,
  "syncThinking": false,
  "debug": false
}
```

### Codex CLI Config Location

```
~/.codex/config.toml
```

The plugin adds this line:

```toml
notify = ["codex-sync", "hook", "agent-turn-complete"]
```

## API Endpoints Used

The plugin calls these OpenSync endpoints:

| Endpoint        | Method | Description            |
| --------------- | ------ | ---------------------- |
| `/health`       | GET    | Connection test        |
| `/sync/session` | POST   | Create/update session  |
| `/sync/message` | POST   | Add message to session |
| `/sync/batch`   | POST   | Batch sync             |

### Session Payload

```typescript
{
  externalId: string;      // Codex session ID
  source: "codex-cli";     // Source identifier
  projectPath: string;     // Working directory
  model?: string;          // gpt-5-codex, etc.
  startedAt: number;       // Unix timestamp ms
  endedAt?: number;        // Unix timestamp ms
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;           // Calculated cost
}
```

### Message Payload

```typescript
{
  sessionId: string;       // OpenSync session ID
  role: "user" | "assistant" | "tool";
  content: string;
  timestamp: number;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
}
```

## Testing the Integration

### 1. Install and Configure

```bash
npm install -g codex-sync
codex-sync login
codex-sync setup
codex-sync verify
```

### 2. Run a Codex Session

```bash
codex "list files in this directory"
```

### 3. Check OpenSync Dashboard

Sessions should appear in the dashboard with source "Codex CLI".

### 4. Debug Issues

```bash
# Enable debug mode
codex-sync set debug true

# Check logs (stderr)
codex "hello" 2>&1 | grep codex-sync

# Manual sync
codex-sync sync --limit 1
```

## Versioning

Follow semver:

- **MAJOR**: Breaking API changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes

```bash
# Bump version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Publish
npm publish
```

## Release Checklist

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run `npm run build`
- [ ] Run `npm publish --dry-run`
- [ ] Publish: `npm publish`
- [ ] Tag release: `git tag v1.0.0`
- [ ] Push tags: `git push --tags`
- [ ] Update OpenSync docs if needed

## Troubleshooting Build Issues

### TypeScript Errors

```bash
# Clean and rebuild
rm -rf dist
npm run build
```

### Module Resolution

Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true
  }
}
```

### Shebang Issues

The CLI needs the shebang for npm bin:

```typescript
#!/usr/bin/env node
// ... rest of cli.ts
```

## Support

- GitHub Issues: [codex-sync/issues](https://github.com/waynesutton/codex-sync-plugin-plugin/issues)
- OpenSync Docs: [opensync.dev/docs](https://opensync.dev/docs)
