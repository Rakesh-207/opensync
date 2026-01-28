# Cloudflare Pages Deployment Guide for OpenSync

This guide provides step-by-step instructions to deploy the OpenSync frontend on Cloudflare Pages using GitHub Integration.

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account with repository access
- [ ] Cloudflare account with Pages enabled
- [ ] Convex backend deployed and URL available
- [ ] WorkOS account configured with Client ID
- [ ] OpenAI API key (for semantic search functionality)

## Quick Overview

**Architecture:**
- **Frontend:** React + Vite deployed on Cloudflare Pages
- **Backend:** Convex (separate deployment required)
- **Auth:** WorkOS (redirect URIs need to match Cloudflare Pages domain)

## Deployment Steps

### Step 1: Push Code to GitHub

Your repository is already set up at: `https://github.com/Rakesh-207/opensync.git`

Verify the repository is up to date:

```bash
cd /Users/ayya/developer/opensync/opensync
git status
git push origin main
```

### Step 2: Create Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** > **Create application**
3. Select **Pages** > **Connect to Git**
4. Choose GitHub and authorize Cloudflare
5. Select the `opensync` repository

### Step 3: Configure Build Settings

In the Cloudflare Pages setup form, configure:

| Setting | Value |
|---------|-------|
| **Project name** | `opensync` (or your preferred name) |
| **Production branch** | `main` |
| **Framework preset** | `Vite` (auto-detected) |
| **Root directory** | Leave empty (or set to `/` if required) |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

**Node.js version:** Set to `18` or `20` in Settings > Environment

### Step 4: Set Environment Variables

In **Settings** > **Environment variables** (or during setup):

**Frontend Environment Variables:**
```
VITE_CONVEX_URL=https://your-project-name.convex.cloud
VITE_WORKOS_CLIENT_ID=client_xxxxxxxxxxxxx
```

Replace with your actual values:
- `VITE_CONVEX_URL`: Your Convex deployment URL
- `VITE_WORKOS_CLIENT_ID`: Your WorkOS Client ID

### Step 5: Deploy

Click **Save and Deploy**. Cloudflare Pages will:

1. Clone your repository
2. Install dependencies (`npm install`)
3. Build the project (`npm run build`)
4. Deploy to Cloudflare's global CDN

**Wait time:** ~2-3 minutes for first deployment

### Step 6: Note Your Cloudflare Pages URL

After successful deployment, you'll see:
```
https://your-project-name.pages.dev
```
or
```
https://your-project-name.yourdomain.com
```

**Save this URL** - you'll need it for WorkOS configuration.

## Post-Deployment Configuration

### Step 7: Update WorkOS Redirect URI

1. Go to [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **SSO Connections** > **Redirects**
3. Add your Cloudflare Pages URL:
   ```
   https://your-project-name.pages.dev/callback
   ```

### Step 8: Deploy Convex Backend (If not already done)

```bash
cd /Users/ayya/developer/opensync/opensync

# If you haven't set up Convex yet
npx convex dev

# Then deploy to production
npx convex deploy
```

### Step 9: Set Convex Environment Variables

In [Convex Dashboard](https://dashboard.convex.dev):

1. Select your project
2. Go to **Settings** > **Environment Variables**
3. Add:
   ```
   WORKOS_CLIENT_ID=client_xxxxxxxxxxxxx
   OPENAI_API_KEY=sk-xxxxxxxxxxxxx
   ```

### Step 10: Redeploy Cloudflare Pages (If env vars changed)

After adding environment variables:
1. Go to Cloudflare Pages > your project
2. Click **Retry deployment** or push a new commit

## Verification

### Test the Deployment

1. Visit your Cloudflare Pages URL
2. Click "Get Started" to sign in
3. Sign up or sign in with email
4. Verify dashboard loads
5. Go to Settings and generate an API key

### Troubleshooting

**Issue: "Setup incomplete" banner**
- Ensure `VITE_CONVEX_URL` and `VITE_WORKOS_CLIENT_ID` are set in Cloudflare Pages env vars
- Redeploy after setting variables

**Issue: Login redirects but stays on login page**
- Verify WorkOS redirect URI matches your Cloudflare Pages URL exactly
- Check `WORKOS_CLIENT_ID` is set in Convex env vars
- Run `npx convex deploy` after changing Convex env vars

**Issue: "Invalid token" errors**
- Ensure `VITE_WORKOS_CLIENT_ID` in Cloudflare Pages matches `WORKOS_CLIENT_ID` in Convex
- Verify no typos in Client IDs

**Issue: Semantic search not working**
- Verify `OPENAI_API_KEY` is set in Convex environment variables
- Run `npx convex deploy`
- Wait 1-2 minutes (embeddings generate asynchronously)

## Cloudflare Pages Features

### Automatic Deployments

Every push to `main` branch triggers automatic deployment:
- View deployment logs in the Cloudflare Dashboard
- Each deployment gets a unique URL for testing
- Previous deployments are retained for rollback

### Preview Deployments

Pull requests get preview URLs:
- Share preview URL with team for testing
- Automatic cleanup after 30 days

### Custom Domain (Optional)

1. Go to **Settings** > **Custom domains**
2. Add your domain (e.g., `opensync.yourdomain.com`)
3. Update DNS records (CNAME to Cloudflare)
4. Update WorkOS redirect URI to match new domain

### Edge Functions (Optional)

Cloudflare Pages supports Edge Functions for server-side logic:
- Add functions to `functions/` directory
- Useful for middleware, redirects, etc.

## File Structure

```
opensync/
├── public/
│   ├── _redirects       # SPA routing (auto-used by Cloudflare)
│   ├── _headers         # Security headers (auto-used by Cloudflare)
│   ├── favicon.svg      # Site icon
│   └── og-image.png    # Social preview image
├── src/                # React source code
├── convex/             # Convex backend (not deployed to Cloudflare)
├── index.html          # Entry point
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
└── dist/              # Build output (created during deployment)
```

## Environment Variables Reference

### Frontend (Cloudflare Pages)
| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_CONVEX_URL` | Convex backend URL | ✅ Yes |
| `VITE_WORKOS_CLIENT_ID` | WorkOS auth client ID | ✅ Yes |
| `NODE_VERSION` | Node.js version | Optional |

### Backend (Convex)
| Variable | Purpose | Required |
|----------|---------|----------|
| `WORKOS_CLIENT_ID` | WorkOS auth verification | ✅ Yes |
| `OPENAI_API_KEY` | Semantic search embeddings | ✅ Yes |

## Performance Optimization

The following optimizations are automatically applied:

1. **Static Asset Caching:** Configured in `public/_headers`
2. **Code Splitting:** Vite automatically chunks code
3. **Asset Minification:** CSS and JS minified during build
4. **Global CDN:** Served from 300+ edge locations worldwide

## Security

Configured security headers (in `public/_headers`):

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Backup and Rollback

Cloudflare Pages retains previous deployments:
- Go to **Deployments** tab
- View deployment history
- Promote any previous deployment to production

## Monitoring

Access deployment logs:
1. Cloudflare Pages > your project
2. Click on any deployment
3. View build logs, function logs, and analytics

## Cost

Cloudflare Pages Free Tier includes:
- Unlimited bandwidth
- Unlimited requests
- 500 builds/month
- Up to 3 active projects

Paid plans available for:
- More builds
- More projects
- Advanced features

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Vite on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/vite/)
- [OpenSync Documentation](https://www.opensync.dev/docs)
- [Convex Documentation](https://docs.convex.dev/)

## Support

For deployment issues:
1. Check Cloudflare Pages deployment logs
2. Verify environment variables are set correctly
3. Review WorkOS redirect URIs
4. Check Convex dashboard for errors
5. Open an issue on [GitHub](https://github.com/waynesutton/opensync/issues)

## Next Steps

After successful deployment:

1. Install sync plugins:
   - **Claude Code:** `npm install -g claude-code-sync && claude-code-sync login`
   - **OpenCode:** `npm install -g opencode-sync-plugin && opencode-sync login`

2. Configure plugins with your Convex URL and API key

3. Start coding - sessions will sync to your Cloudflare Pages deployment

---

**Deployment complete!** 🎉

Your OpenSync frontend is now live on Cloudflare Pages with automatic deployments, global CDN, and SSL/TLS encryption.
