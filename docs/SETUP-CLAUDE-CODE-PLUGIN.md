# Setup Guide: Claude Code Sync Plugin

Complete instructions for setting up the GitHub repository, publishing to npm, and updating the OpenSync backend.

## Part 1: Create the GitHub Repository

### Step 1: Create the repo on GitHub

1. Go to https://github.com/new
2. Repository name: `claude-code-sync`
3. Description: "Sync Claude Code sessions to OpenSync dashboard"
4. Make it **Public**
5. Add MIT License
6. Click **Create repository**

### Step 2: Clone and add files

```bash
# Clone the empty repo
git clone https://github.com/waynesutton/claude-code-sync.git
cd claude-code-sync

# Copy all plugin files into this directory
# (package.json, tsconfig.json, src/, docs/, README.md, LICENSE, etc.)

# Install dependencies
npm install

# Build to verify everything works
npm run build

# Commit and push
git add .
git commit -m "Initial commit: Claude Code sync plugin"
git push origin main
```

### Step 3: Add GitHub topics

Go to repo Settings and add topics:
- `claude`
- `claude-code`
- `sync`
- `opensync`
- `convex`
- `ai`
- `coding-assistant`

---

## Part 2: Publish to npm

### Step 1: Create npm account (if needed)

1. Go to https://www.npmjs.com/signup
2. Create account or sign in

### Step 2: Login to npm CLI

```bash
npm login
```

Enter your npm username, password, and email.

### Step 3: Verify package.json

Make sure these fields are correct:

```json
{
  "name": "claude-code-sync",
  "version": "0.1.0",
  "description": "Sync your Claude Code sessions to OpenSync dashboard",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "claude-code-sync": "./dist/cli.js"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/waynesutton/claude-code-sync.git"
  },
  "author": "Wayne Sutton",
  "license": "MIT"
}
```

### Step 4: Build and publish

```bash
# Build TypeScript
npm run build

# Check what will be published
npm pack --dry-run

# Publish to npm
npm publish
```

### Step 5: Verify publication

1. Go to https://www.npmjs.com/package/claude-code-sync
2. Verify the package page looks correct
3. Test installation:

```bash
npm install -g claude-code-sync
claude-code-sync --version
claude-code-sync --help
```

---

## Part 3: Update OpenSync Backend

The OpenSync backend needs schema updates and HTTP handler changes to support Claude Code sessions.

### Step 1: Update the Convex schema

Open Cursor in the OpenSync repo and give it this prompt:

---

**Prompt for Cursor (Schema Update):**

> Update `convex/schema.ts` to support Claude Code sessions. Add these fields to the sessions table:
>
> **Source field (required for both OpenCode and Claude Code):**
> - `source`: union of "opencode" | "claude-code", required field
>
> **Claude Code specific fields (all optional):**
> - `startType`: optional string ("new", "resume", "continue")
> - `endReason`: optional string ("user_stop", "max_turns", "error", "completed")  
> - `cwd`: optional string (current working directory)
> - `gitBranch`: optional string
> - `gitRepo`: optional string
> - `thinkingEnabled`: optional boolean
> - `permissionMode`: optional string
> - `mcpServers`: optional array of strings
> - `messageCount`: optional number
> - `toolCallCount`: optional number
> - `tokenUsage`: optional object with `input` (number) and `output` (number)
> - `costEstimate`: optional number
>
> Add these indexes:
> - `by_source`: index on ["source"]
> - `by_source_and_user`: compound index on ["userId", "source"]
>
> For the messages table, add:
> - `source`: optional union of "opencode" | "claude-code"
> - `thinkingContent`: optional string
> - `toolName`: optional string
> - `toolArgs`: optional any (for JSON object)
> - `toolResult`: optional string
> - `durationMs`: optional number
>
> Make sure existing sessions without a source field still work (source should be optional with a default behavior treating missing as "opencode" for backwards compatibility in queries).

---

### Step 2: Update HTTP handlers

Give Cursor this prompt:

---

**Prompt for Cursor (HTTP Handlers):**

> Update `convex/http.ts` to accept Claude Code sessions. The `/sync/session` and `/sync/message` endpoints need to:
>
> 1. Accept a `source` field in the request body with value "claude-code" (in addition to existing "opencode" support)
>
> 2. For `/sync/session`, handle these Claude Code fields:
>    - `source` (required): "opencode" | "claude-code"
>    - `startType` (optional): string
>    - `endReason` (optional): string
>    - `cwd` (optional): string
>    - `gitBranch` (optional): string
>    - `gitRepo` (optional): string
>    - `thinkingEnabled` (optional): boolean
>    - `permissionMode` (optional): string
>    - `mcpServers` (optional): string[]
>    - `messageCount` (optional): number
>    - `toolCallCount` (optional): number
>    - `tokenUsage` (optional): { input: number, output: number }
>    - `costEstimate` (optional): number
>
> 3. For `/sync/message`, handle these fields:
>    - `source` (optional): "opencode" | "claude-code"
>    - `thinkingContent` (optional): string
>    - `toolName` (optional): string
>    - `toolArgs` (optional): object
>    - `toolResult` (optional): string
>    - `durationMs` (optional): number
>
> 4. Default `source` to "opencode" if not provided (backwards compatibility)
>
> 5. Validate that `source` is one of the allowed values, return 400 if invalid
>
> 6. Keep existing API key authentication - don't change auth logic
>
> The existing fields (sessionId, title, projectPath, etc.) should continue to work for both sources.

---

### Step 3: Add source filter to the dashboard

Give Cursor this prompt:

---

**Prompt for Cursor (Dashboard Filter):**

> Add a source filter to the sessions list in the OpenSync dashboard. Users should be able to filter sessions by:
>
> 1. All sources (default)
> 2. OpenCode only
> 3. Claude Code only
>
> Implementation:
> - Add a dropdown or toggle filter near the search bar
> - Store filter preference in local state
> - Pass source parameter to the sessions query
> - Show a small badge or icon on session cards indicating the source
> - Use different colors or icons: one for OpenCode, one for Claude Code
>
> The filter should work with existing search and pagination.

---

### Step 4: Deploy and test

```bash
# In the OpenSync repo
npx convex dev

# Test the endpoints
curl -X POST https://your-project.convex.site/sync/session \
  -H "Authorization: Bearer osk_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-claude-123",
    "source": "claude-code",
    "title": "Test Claude Code Session",
    "model": "claude-sonnet-4-20250514",
    "startType": "new"
  }'

# Should return success
```

---

## Part 4: Test End-to-End

### Step 1: Install the plugin

```bash
npm install -g claude-code-sync
```

### Step 2: Configure

```bash
claude-code-sync login
# Enter your Convex URL and API key
```

### Step 3: Verify status

```bash
claude-code-sync status
# Should show "Connected to Convex backend"
```

### Step 4: Use Claude Code

Start a Claude Code session and do some coding. When the session ends, check your OpenSync dashboard. You should see the session with source "claude-code".

---

## Part 5: Publish Updates

### Updating npm package

When you make changes:

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Build and publish
npm run build
npm publish

# Push version tag to GitHub
git push origin main --tags
```

### Version numbering

- `0.1.x` - Bug fixes
- `0.2.0` - New features (backwards compatible)
- `1.0.0` - First stable release

---

## Part 6: GitHub Actions (Optional)

Create `.github/workflows/publish.yml` for automated publishing:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Publish
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

To set this up:

1. Go to npmjs.com → Access Tokens → Generate New Token (Automation)
2. Copy the token
3. Go to GitHub repo → Settings → Secrets → Actions
4. Add secret named `NPM_TOKEN` with the token value

Now when you create a GitHub release, it automatically publishes to npm.

---

## Checklist

### GitHub Setup
- [ ] Create repository `waynesutton/claude-code-sync`
- [ ] Push all plugin files
- [ ] Add topics and description
- [ ] Add LICENSE file

### npm Setup
- [ ] Login to npm
- [ ] Verify package.json
- [ ] Build and test locally
- [ ] Publish to npm
- [ ] Verify at npmjs.com/package/claude-code-sync

### OpenSync Backend
- [ ] Update schema with source field and Claude Code fields
- [ ] Update HTTP handlers to accept source
- [ ] Add source filter to dashboard
- [ ] Deploy to Convex
- [ ] Test sync endpoints

### Testing
- [ ] Install plugin globally
- [ ] Run `claude-code-sync login`
- [ ] Run `claude-code-sync status`
- [ ] Use Claude Code and verify session appears in dashboard
- [ ] Verify source filter works

### Documentation
- [ ] Copy CLAUDE-CODE-PLUGIN.md to OpenSync docs folder
- [ ] Update OpenSync README to mention Claude Code support
- [ ] Link to npm package from documentation

---

## File Structure Summary

After setup, you should have:

```
claude-code-sync/                  # GitHub repo
├── src/
│   ├── index.ts                   # Plugin entry point and hooks
│   └── cli.ts                     # CLI commands
├── docs/
│   └── CLAUDE-CODE-PLUGIN.md      # User documentation
├── dist/                          # Built files (gitignored)
│   ├── index.js
│   ├── index.d.ts
│   └── cli.js
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
├── .gitignore
└── .npmignore
```

And in OpenSync:

```
opensync/
├── convex/
│   ├── schema.ts                  # Updated with source field
│   └── http.ts                    # Updated handlers
├── docs/
│   ├── CLAUDE-CODE-PLUGIN.md      # Copy of plugin docs
│   └── ...
└── ...
```
