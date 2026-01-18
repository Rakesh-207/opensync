# OpenCode Plugin Development Guide

A reference guide documenting issues encountered and solutions implemented while building the `opencode-sync-plugin`. Use this as a reference for building future OpenCode plugins or similar CLI sync tools.

## Overview

Building a working OpenCode plugin requires understanding several constraints:

1. OpenCode runs plugins in Bun runtime
2. Plugins must follow specific export patterns
3. ESM module compatibility is critical
4. Config file locations must not conflict with OpenCode internals

## Issues and Solutions

### Issue 1: hook.config TypeError

**Error:**
```
TypeError: undefined is not an object (evaluating 'hook.config')
at init2 (src/plugin/index.ts:124:13)
```

**Cause:**
OpenCode iterates over ALL exports from a plugin module and treats each as a potential hook. If you export helper functions like `getConfig`, `setConfig`, OpenCode tries to access `.config` on them.

**Solution:**
Only export the plugin function from your main `index.ts`. Move all helper functions to a separate file.

**Before (broken):**
```typescript
// index.ts
export function getConfig() { ... }
export function setConfig() { ... }
export const MyPlugin = async (ctx) => { ... };
export default MyPlugin;
```

**After (working):**
```typescript
// config.ts
export function getConfig() { ... }
export function setConfig() { ... }

// index.ts
import { getConfig } from "./config.js";
const MyPlugin = async (ctx) => { ... };
export default MyPlugin;  // ONLY export the plugin
```

### Issue 2: Dynamic require() Not Supported in ESM

**Error:**
```
Error: Dynamic require of "readline" is not supported
```

**Cause:**
ESM modules do not support `require()`. Using `require()` inside functions fails at runtime.

**Solution:**
Use static ESM imports at the top of the file.

**Before (broken):**
```typescript
function getConfigPaths() {
  const { homedir } = require("os") as typeof import("os");
  const { join } = require("path") as typeof import("path");
  // ...
}
```

**After (working):**
```typescript
import { homedir } from "os";
import { join } from "path";

function getConfigPaths() {
  // use homedir() and join() directly
}
```

### Issue 3: Config File Conflicts

**Symptom:**
Config saves successfully but reads back as empty or contains unrelated data.

**Cause:**
OpenCode writes its own runtime state to `~/.config/opencode-sync/config.json`, overwriting plugin credentials.

**Solution:**
Use a unique, dedicated directory for your plugin config.

**Before (broken):**
```typescript
const configDir = join(homedir(), ".config", "opencode-sync");
```

**After (working):**
```typescript
const configDir = join(homedir(), ".opensync");
const configFile = join(configDir, "credentials.json");
```

### Issue 4: Silent Failures Hide Errors

**Symptom:**
Operations appear to complete but nothing actually happens.

**Cause:**
Empty catch blocks swallow errors, making debugging impossible.

**Solution:**
Log errors during development. Remove or minimize logging for production.

**Before (broken):**
```typescript
export function setConfig(cfg: Config): void {
  try {
    // write config
  } catch {
    // Silently fail - BAD!
  }
}
```

**After (working):**
```typescript
export function setConfig(cfg: Config): void {
  try {
    // write config
  } catch (e) {
    console.error("Error saving config:", e);
  }
}
```

### Issue 5: readline Module in ESM

**Error:**
```
Error: Dynamic require of "readline" is not supported
```

**Solution:**
Import `createInterface` directly from readline.

```typescript
import { createInterface } from "readline";

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
```

## Plugin Structure

### Recommended File Structure

```
my-plugin/
├── src/
│   ├── index.ts      # Plugin entry - ONLY exports the plugin function
│   ├── config.ts     # Config helpers for CLI
│   └── cli.ts        # CLI commands
├── dist/             # Built output
├── package.json
├── tsconfig.json
└── README.md
```

### package.json Requirements

```json
{
  "name": "my-opencode-plugin",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "bin": {
    "my-plugin": "dist/cli.js"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

### Plugin Function Signature

```typescript
// The plugin function receives a context object
const MyPlugin = async (ctx: Record<string, unknown>) => {
  return {
    // Event handler for OpenCode events
    event: async (input: { 
      event: { 
        type: string; 
        properties?: Record<string, unknown> 
      } 
    }) => {
      const { event } = input;
      
      // Handle different event types
      if (event.type === "session.created") {
        // ...
      }
      if (event.type === "message.updated") {
        // ...
      }
    },
  };
};

// ONLY export default - no named exports
export default MyPlugin;
```

## OpenCode Event Types

Based on working plugins, these events are available:

- `session.created` - New session started
- `session.updated` - Session metadata changed
- `session.idle` - Session became idle
- `message.updated` - Message completed
- `message.part.updated` - Streaming message update

## Testing Workflow

### 1. Build and Publish

```bash
npm run build
npm publish --otp=CODE
```

### 2. Clear Plugin Cache

OpenCode caches plugins. Always clear before testing:

```bash
rm -rf ~/.cache/opencode/node_modules
```

### 3. Reinstall Global Package

```bash
npm uninstall -g my-opencode-plugin
npm install -g my-opencode-plugin@latest
```

### 4. Test CLI

```bash
my-plugin --version
my-plugin login
my-plugin verify
```

### 5. Test Plugin Loading

```bash
opencode
```

If OpenCode shows a blank screen or crashes, the plugin has an issue.

## Debugging

### Check if Plugin is Registered

```bash
cat ~/.config/opencode/opencode.json
```

Should contain:
```json
{
  "plugin": ["my-opencode-plugin"]
}
```

### Check Plugin Cache

```bash
ls ~/.cache/opencode/node_modules/
```

### Remove Plugin to Debug

If OpenCode won't start:

```bash
# Remove from config
echo '{"$schema": "https://opencode.ai/config.json"}' > ~/.config/opencode/opencode.json

# Clear cache
rm -rf ~/.cache/opencode/node_modules

# Test OpenCode works without plugin
opencode
```

### Check Config File

```bash
cat ~/.opensync/credentials.json
```

## Checklist for New Plugins

- [ ] Only default export from index.ts
- [ ] No `require()` calls - use ESM imports
- [ ] Unique config directory (not under `~/.config/opencode-*`)
- [ ] `"type": "module"` in package.json
- [ ] `"strict": true` in tsconfig.json
- [ ] Error logging enabled (not silent catch)
- [ ] Test with fresh plugin cache
- [ ] Version command in CLI for debugging

## Reference Plugins

Working OpenCode plugins to study:

- [opencode-mem](https://github.com/tickernelz/opencode-mem) - Memory plugin
- [opencode-helicone-session](https://github.com/H2Shami/opencode-helicone-session) - Session tracking
- [opencode-openai-codex-auth](https://github.com/numman-ali/opencode-openai-codex-auth) - OAuth auth

## Version History

| Version | Issue | Fix |
|---------|-------|-----|
| 0.1.5 | Plugin blocks OpenCode | Attempted lazy loading conf package |
| 0.1.6 | Still blocking | Replaced conf with native fs |
| 0.1.7 | hook.config error | Added safe logging, default export |
| 0.1.9 | Still hook.config error | Minimal plugin returning {} |
| 0.2.0 | hook.config error | Moved config exports to separate file |
| 0.2.1 | Dynamic require error | Fixed readline import |
| 0.2.2 | Same error | Added version command |
| 0.2.3 | Config not saving | Changed config path to ~/.opensync |
| 0.2.4 | Config still not saving | Fixed ESM imports in config.ts |

## Key Lessons

1. **OpenCode treats all exports as hooks** - Only export the plugin function
2. **ESM is strict** - No dynamic require(), use static imports
3. **Bun runtime differs from Node** - Test in actual OpenCode, not just Node
4. **Config paths conflict** - Use unique directories
5. **Silent failures kill debugging** - Always log errors during development
6. **Clear cache between tests** - OpenCode caches aggressively
