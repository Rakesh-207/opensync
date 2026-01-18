# OpenSync CLI Commands

Reference for all `opencode-sync` CLI commands.

## Installation

```bash
npm install -g opencode-sync-plugin
```

## Commands

### login

Configure the plugin with your Convex URL and API Key.

```bash
opencode-sync login
```

**Prompts:**
- Convex URL (e.g., `https://your-project.convex.cloud`)
- API Key (starts with `osk_`)

**Output on success:**
- Confirmation message
- Instructions to add plugin to OpenCode config

### verify

Check that credentials and OpenCode configuration are set up correctly.

```bash
opencode-sync verify
```

**Checks:**
- Credentials exist in `~/.config/opencode-sync/config.json`
- OpenCode config exists at `~/.config/opencode/opencode.json` or `./opencode.json`
- Plugin is registered in the config

**Output:**
- Status of each check (OK or MISSING)
- Instructions to fix any issues

### logout

Clear stored credentials.

```bash
opencode-sync logout
```

Removes the API key and Convex URL from local config.

### sync

Test connectivity to the backend and create a test session.

```bash
opencode-sync sync
```

**What it does:**
- Tests the health endpoint
- Tests the sync endpoint with your API key
- Creates a test session in your OpenSync dashboard

**Output on success:**
```
  OpenSync Connectivity Test

  Testing backend health...
  Health: OK
  Response: {"status":"ok","timestamp":1234567890}

  Testing sync endpoint...
  Sync: OK
  Response: {"ok":true,"sessionId":"abc123"}

  Test session created. Check your OpenSync dashboard.
```

Use this to verify your credentials work before troubleshooting plugin issues.

### sync --all

Sync all local OpenCode sessions to the cloud.

```bash
opencode-sync sync --all
```

**What it does:**
- Reads all sessions from `~/.local/share/opencode/storage/session/`
- Reads messages for each session from `~/.local/share/opencode/storage/message/`
- Syncs sessions with aggregated token counts and costs
- Syncs all messages for each session

**Output on success:**
```
  OpenSync: Syncing All Local Sessions

  Found 12 sessions

  Syncing: What does this app do?... OK (7 messages)
  Syncing: Cooking tips... OK (3 messages)
  Syncing: Fix the bug... OK (15 messages)

  Summary:
    Sessions synced: 12
    Messages synced: 87

  Check your OpenSync dashboard to view synced sessions.
```

Use this to bulk import existing OpenCode sessions that were created before installing the plugin.

### status

Show current authentication status.

```bash
opencode-sync status
```

**Output:**
- Whether configured or not
- Convex URL (if set)
- Masked API Key (if set)

### config

Show current configuration details.

```bash
opencode-sync config
```

**Output:**
- Convex URL
- Masked API Key

### version

Show the installed version.

```bash
opencode-sync version
opencode-sync -v
opencode-sync --version
```

### help

Show help message with all commands.

```bash
opencode-sync help
opencode-sync -h
opencode-sync --help
```

## Setup Flow

1. Install the package globally:
   ```bash
   npm install -g opencode-sync-plugin
   ```

2. Log in with your credentials:
   ```bash
   opencode-sync login
   ```

3. Add the plugin to OpenCode config:
   ```bash
   mkdir -p ~/.config/opencode && echo '{
     "$schema": "https://opencode.ai/config.json",
     "plugin": ["opencode-sync-plugin"]
   }' > ~/.config/opencode/opencode.json
   ```

4. Verify setup:
   ```bash
   opencode-sync verify
   ```

5. Test connectivity:
   ```bash
   opencode-sync sync
   ```

6. Sync existing sessions (optional):
   ```bash
   opencode-sync sync --all
   ```

7. Start OpenCode:
   ```bash
   opencode
   ```

## Troubleshooting

### Reset everything

```bash
# Remove credentials
opencode-sync logout

# Clear OpenCode plugin cache
rm -rf ~/.cache/opencode/node_modules

# Reinstall
npm uninstall -g opencode-sync-plugin
npm install -g opencode-sync-plugin@latest

# Start fresh
opencode-sync login
```

### Check version

```bash
opencode-sync version
```

### Config file locations

- Credentials: `~/.opensync/credentials.json`
- OpenCode config (global): `~/.config/opencode/opencode.json`
- OpenCode config (project): `./opencode.json`
