# Publishing to npm

Guide for publishing npm packages from the terminal.

## Prerequisites

1. Create an npm account at [npmjs.com](https://www.npmjs.com/signup)
2. Verify your email address
3. Node.js and npm installed locally

## Login to npm

```bash
npm login
```

Enter your:

- Username
- Password
- Email
- One time password (if 2FA is enabled)

Verify you're logged in:

```bash
npm whoami
```

## Prepare Your Package

### Required files

Your project needs a `package.json` with these fields:

```json
{
  "name": "your-package-name",
  "version": "1.0.0",
  "description": "What your package does",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "your-cli": "./dist/cli.js"
  },
  "files": [
    "dist"
  ],
  "keywords": ["relevant", "keywords"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/repo"
  }
}
```

### Key fields explained

| Field | Purpose |
|-------|---------|
| `name` | Package name on npm (must be unique) |
| `version` | Semantic version (major.minor.patch) |
| `main` | Entry point for `require()` |
| `types` | TypeScript definitions |
| `bin` | CLI commands your package provides |
| `files` | Files to include when publishing |

### Build before publishing

```bash
npm run build
```

## Publish

### First publish

```bash
npm publish
```

For scoped packages (e.g., `@username/package`):

```bash
npm publish --access public
```

### Update and republish

1. Update version in `package.json`
2. Build your changes
3. Publish

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major

# Then publish
npm publish
```

Or do it all at once:

```bash
npm version patch && npm publish
```

## Verify Publication

Check your package is live:

```bash
npm view your-package-name
```

Or visit `https://www.npmjs.com/package/your-package-name`

## Test Installation

```bash
npm install -g your-package-name
your-cli --version
```

## Common Issues

### "You do not have permission"

Package name is taken. Choose a different name or use a scoped name:

```json
{
  "name": "@yourusername/package-name"
}
```

### "Private package"

Add `--access public` flag or update `package.json`:

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

### "Missing files"

Check your `files` array in `package.json` includes all necessary files:

```json
{
  "files": [
    "dist",
    "README.md"
  ]
}
```

Preview what gets published:

```bash
npm pack --dry-run
```

### "Version already exists"

Bump the version:

```bash
npm version patch
```

## Unpublish (caution)

You can unpublish within 72 hours of publishing:

```bash
npm unpublish your-package-name@1.0.0
```

After 72 hours, you cannot unpublish. You can only deprecate:

```bash
npm deprecate your-package-name "This package is no longer maintained"
```

## Best Practices

1. **Test locally first**: Use `npm link` to test your package before publishing
2. **Include a README**: Good documentation helps adoption
3. **Add a LICENSE**: MIT is common for open source
4. **Use .npmignore**: Exclude test files, configs, and source from the published package
5. **Semantic versioning**: Follow semver for predictable updates
6. **Changelog**: Document changes between versions

## Quick Reference

| Command | Action |
|---------|--------|
| `npm login` | Authenticate with npm |
| `npm whoami` | Show logged in user |
| `npm publish` | Publish package |
| `npm version patch` | Bump patch version |
| `npm version minor` | Bump minor version |
| `npm version major` | Bump major version |
| `npm pack --dry-run` | Preview published files |
| `npm view pkg` | View package info |
| `npm unpublish pkg@ver` | Remove specific version |
| `npm deprecate pkg "msg"` | Mark package deprecated |

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm publish docs](https://docs.npmjs.com/cli/publish)
