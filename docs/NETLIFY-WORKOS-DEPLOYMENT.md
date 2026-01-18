# Netlify and WorkOS Deployment Guide

This document covers the deployment issues encountered and fixes applied to get OpenSync running on Netlify with WorkOS AuthKit and Convex.

Built with Cursor and Claude Opus 4.5.

## The stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Convex (real-time database and functions) |
| Auth | WorkOS AuthKit |
| Hosting | Netlify |

## Problems encountered

### 1. TypeScript build errors

**Symptom:** Netlify build failed with errors about `import.meta.env` and missing Node types.

```
error TS2339: Property 'env' does not exist on type 'ImportMeta'.
```

**Root cause:** Vite uses `import.meta.env` for environment variables, but TypeScript needs type declarations for this.

**Fix:**
- Created `src/vite-env.d.ts` with Vite client types
- Added `@types/node` to devDependencies
- Updated `tsconfig.json` to include `"types": ["vite/client", "node"]`

### 2. Netlify 404 "Page not found" on all routes

**Symptom:** Direct navigation to `/login`, `/docs`, `/settings` returned Netlify's default 404 page.

**Root cause:** Netlify serves static files. When a user navigates directly to `/login`, Netlify looks for a file at that path. Since this is a Single Page Application (SPA), there is no `/login/index.html` file. React Router handles routing client-side, but only after `index.html` loads.

**Fix:**
- Created `public/_redirects` with SPA fallback rule:
  ```
  /*    /index.html   200
  ```
- Created `netlify.toml` with redirect configuration:
  ```toml
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```

The `200` status (not `301` or `302`) tells Netlify to serve `index.html` for all routes without changing the URL, allowing React Router to handle the path.

### 3. WorkOS login completes but user not authenticated

**Symptom:** User clicks "Sign in", completes WorkOS login, redirects back to app, but stays on login page. WorkOS shows the user as logged in.

**Root cause:** Multiple configuration issues:
1. Missing Netlify environment variables
2. Missing CORS configuration in WorkOS
3. Convex not receiving the JWT from WorkOS

**Fix:**

#### Netlify environment variables

Added these in Netlify dashboard (Site settings > Environment variables):

| Variable | Value |
|----------|-------|
| `VITE_CONVEX_URL` | `https://your-app.convex.cloud` |
| `VITE_WORKOS_CLIENT_ID` | `client_01XXXXX` |

These are build-time variables. The `VITE_` prefix makes them available to the frontend bundle.

#### Convex environment variables

Added in Convex dashboard (Settings > Environment Variables):

| Variable | Value |
|----------|-------|
| `WORKOS_CLIENT_ID` | `client_01XXXXX` |

This is used by `convex/auth.config.ts` to validate JWTs.

#### WorkOS CORS configuration

In WorkOS dashboard (Authentication > Sessions > CORS), added:
```
https://opensyncsessions.netlify.app
```

Without CORS configured, the browser blocks the token exchange request.

#### WorkOS redirect URIs

In WorkOS dashboard (Authentication > Redirects), configured:

| Setting | Value |
|---------|-------|
| Redirect URI | `https://opensyncsessions.netlify.app/callback` |
| App homepage URL | `https://opensyncsessions.netlify.app/` |
| Sign-in endpoint | `https://opensyncsessions.netlify.app/login` |
| Sign-out redirect | `https://opensyncsessions.netlify.app` |

### 4. Missing 404 page for invalid routes

**Symptom:** Users navigating to non-existent routes saw a blank page or unexpected behavior.

**Fix:** Added a catch-all route in `src/App.tsx`:

```tsx
<Route path="*" element={<NotFoundPage />} />
```

## Configuration files

### netlify.toml

```toml
# Netlify configuration for OpenSync SPA

[build]
  publish = "dist"
  command = "npm run build"

# Headers for security and caching
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"

# Cache static assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# SPA fallback - must be last
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### public/_redirects

```
# SPA fallback - serve index.html for all routes so React Router handles navigation
/*    /index.html   200
```

### src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string;
  readonly VITE_WORKOS_CLIENT_ID: string;
  readonly VITE_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### convex/auth.config.ts

```typescript
const clientId = process.env.WORKOS_CLIENT_ID;

export default {
  providers: [
    {
      type: "customJwt" as const,
      issuer: "https://api.workos.com/",
      algorithm: "RS256" as const,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      applicationID: clientId,
    },
    {
      type: "customJwt" as const,
      issuer: `https://api.workos.com/user_management/${clientId}`,
      algorithm: "RS256" as const,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
  ],
};
```

## Environment variable checklist

### Netlify (build-time, client-side)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CONVEX_URL` | Yes | Convex deployment URL |
| `VITE_WORKOS_CLIENT_ID` | Yes | WorkOS client ID |
| `VITE_REDIRECT_URI` | No | OAuth callback URL (defaults to `origin/callback`) |
| `CONVEX_DEPLOY_KEY` | Yes | For `npx convex deploy` during build |

### Convex (server-side)

| Variable | Required | Description |
|----------|----------|-------------|
| `WORKOS_CLIENT_ID` | Yes | For JWT validation in auth.config.ts |
| `OPENAI_API_KEY` | Yes | For embeddings and semantic search |

### WorkOS dashboard

| Setting | Value |
|---------|-------|
| Redirect URI | `https://your-domain.netlify.app/callback` |
| CORS origins | `https://your-domain.netlify.app` |
| Sign-out redirect | `https://your-domain.netlify.app` |

## Deployment steps

1. **Set Netlify environment variables**
   - Site settings > Environment variables
   - Add `VITE_CONVEX_URL` and `VITE_WORKOS_CLIENT_ID`

2. **Set Convex environment variables**
   - Convex dashboard > Settings > Environment Variables
   - Add `WORKOS_CLIENT_ID` (same value as `VITE_WORKOS_CLIENT_ID`)

3. **Configure WorkOS**
   - Add redirect URI: `https://your-app.netlify.app/callback`
   - Add CORS origin: `https://your-app.netlify.app`

4. **Deploy Convex**
   ```bash
   npx convex deploy
   ```

5. **Deploy to Netlify**
   - Push to main branch, or
   - Trigger deploy in Netlify dashboard

6. **Test the flow**
   - Navigate directly to `/login`
   - Click "Sign in"
   - Complete WorkOS authentication
   - Verify redirect back to dashboard

## Troubleshooting

### "Page not found" on direct navigation

Check that `_redirects` exists in `dist/` after build:
```bash
npm run build && cat dist/_redirects
```

Should output:
```
/*    /index.html   200
```

### Login redirects but user stays on login page

1. Open browser console, check for errors
2. Verify CORS is configured in WorkOS
3. Verify `WORKOS_CLIENT_ID` is set in Convex
4. Run `npx convex deploy` to sync auth config

### Environment variables not working

Remember:
- `VITE_` variables are embedded at build time
- After adding variables, trigger a new Netlify deploy
- Convex variables require `npx convex deploy` to take effect

## References

- [Netlify SPA routing guide](https://answers.netlify.com/t/support-guide-i-ve-deployed-my-site-but-i-still-see-page-not-found/125)
- [Convex WorkOS AuthKit docs](https://docs.convex.dev/auth/authkit/)
- [WorkOS AuthKit React docs](https://workos.com/docs/authkit/react)
- [Vite environment variables](https://vitejs.dev/guide/env-and-mode.html)
