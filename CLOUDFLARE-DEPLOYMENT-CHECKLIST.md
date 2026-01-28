# Cloudflare Pages Deployment - Manual Steps Checklist

## ✅ Automated (Already Complete)

The following has been prepared for deployment:

- [x] `_redirects` file configured for SPA routing
- [x] `_headers` file created with security headers and caching
- [x] Build tested successfully (`npm run build` creates `dist/` folder)
- [x] Deployment guide created (`CLOUDFLARE-PAGES-DEPLOY.md`)
- [x] Git repository configured at `https://github.com/Rakesh-207/opensync.git`

---

## 📋 Manual Steps Required

Complete these steps in order:

### Phase 1: Push Code to GitHub

```bash
cd /Users/ayya/developer/opensync/opensync
git add public/_headers CLOUDFLARE-PAGES-DEPLOY.md
git commit -m "Add Cloudflare Pages deployment configuration"
git push origin main
```

### Phase 2: Create Cloudflare Pages Project

1. **Go to Cloudflare Dashboard:**
   - Visit: https://dash.cloudflare.com/
   - Navigate to: **Workers & Pages** > **Create application**

2. **Connect to Git:**
   - Select **Pages** > **Connect to Git**
   - Authorize Cloudflare to access GitHub
   - Select `opensync` repository

3. **Configure Build Settings:**
   ```
   Project name: opensync
   Production branch: main
   Framework preset: Vite
   Root directory: (leave empty)
   Build command: npm run build
   Build output directory: dist
   ```

### Phase 3: Set Environment Variables

In **Settings** > **Environment variables** (or during setup):

**Required Variables:**
```
VITE_CONVEX_URL=https://your-project-name.convex.cloud
VITE_WORKOS_CLIENT_ID=client_xxxxxxxxxxxxx
```

**Where to get these values:**
- `VITE_CONVEX_URL`: From your Convex deployment (e.g., `https://my-project-123.convex.cloud`)
- `VITE_WORKOS_CLIENT_ID`: From WorkOS Dashboard > API Keys

### Phase 4: Deploy

1. Click **Save and Deploy**
2. Wait ~2-3 minutes for build to complete
3. Note your deployment URL: `https://opensync.pages.dev` (or custom)

### Phase 5: Configure WorkOS

1. Go to [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **SSO Connections** > **Redirects**
3. Add redirect URI:
   ```
   https://opensync.pages.dev/callback
   ```
   (Replace with your actual Cloudflare Pages URL)

### Phase 6: Deploy Convex Backend (If Not Already Done)

```bash
cd /Users/ayya/developer/opensync/opensync

# Initialize Convex (first time only)
npx convex dev

# Deploy to production
npx convex deploy
```

### Phase 7: Set Convex Environment Variables

In [Convex Dashboard](https://dashboard.convex.dev):

1. Select your project
2. Go to **Settings** > **Environment Variables**
3. Add:
   ```
   WORKOS_CLIENT_ID=client_xxxxxxxxxxxxx
   OPENAI_API_KEY=sk-xxxxxxxxxxxxx
   ```

### Phase 8: Redeploy (If Env Vars Changed)

If you added environment variables after initial deployment:

1. Go to Cloudflare Pages > your project
2. Click **Retry deployment** or push a new commit

### Phase 9: Test Deployment

1. Visit your Cloudflare Pages URL
2. Click "Get Started"
3. Sign up or sign in
4. Verify dashboard loads correctly
5. Go to Settings and generate an API key

---

## 🔍 Prerequisites Checklist

Before starting, ensure you have:

- [ ] GitHub account with access to `Rakesh-207/opensync` repository
- [ ] Cloudflare account with Pages enabled
- [ ] Convex account and project deployed (or ready to deploy)
- [ ] WorkOS account with Client ID
- [ ] OpenAI API key (for semantic search)

---

## ⚠️ Common Issues

### Issue: Build Fails

**Solution:**
```bash
# Test build locally first
cd /Users/ayya/developer/opensync/opensync
npm install
npm run build
```

### Issue: Environment Variables Not Working

**Solution:**
- Ensure variables are set in **Settings** > **Environment variables** (not just during initial setup)
- Redeploy after adding variables
- Variable names must start with `VITE_` for frontend access

### Issue: WorkOS Redirect Fails

**Solution:**
- Verify redirect URI matches Cloudflare Pages URL exactly (no trailing slash)
- Wait 1-2 minutes after updating WorkOS settings
- Check browser console for specific error messages

### Issue: Cannot Find Convex

**Solution:**
- Verify `VITE_CONVEX_URL` is set correctly in Cloudflare Pages env vars
- Ensure Convex backend is deployed: `npx convex deploy`
- Check Convex dashboard for project URL

---

## 📊 Expected Timeline

| Step | Time Required |
|------|---------------|
| Push to GitHub | 2 minutes |
| Create Cloudflare project | 5 minutes |
| Initial deployment | 2-3 minutes |
| Configure WorkOS | 3 minutes |
| Deploy Convex | 5 minutes |
| Test deployment | 5 minutes |
| **Total** | **~22 minutes** |

---

## 🎯 Success Criteria

Deployment is successful when:

- [ ] Cloudflare Pages deployment completes without errors
- [ ] You can access the site at your Cloudflare Pages URL
- [ ] WorkOS authentication works (can sign in/sign up)
- [ ] Dashboard loads and displays correctly
- [ ] Can generate API key in Settings
- [ ] Sessions sync from plugins (after plugin setup)

---

## 📚 Additional Resources

- Full deployment guide: See `CLOUDFLARE-PAGES-DEPLOY.md`
- OpenSync docs: https://www.opensync.dev/docs
- Cloudflare Pages docs: https://developers.cloudflare.com/pages/
- Convex docs: https://docs.convex.dev/

---

## 🚀 After Deployment

Once your site is live:

1. **Install sync plugins:**
   ```bash
   # For Claude Code
   npm install -g claude-code-sync
   claude-code-sync login

   # For OpenCode
   npm install -g opencode-sync-plugin
   opencode-sync login
   ```

2. **Configure plugins:**
   - Enter your Convex URL (from Step 4)
   - Enter API key (generated in Settings)

3. **Start coding!** Sessions will sync to your Cloudflare Pages deployment.

---

## 🆘 Need Help?

If you encounter issues:

1. Check Cloudflare Pages deployment logs
2. Verify environment variables are set correctly
3. Review WorkOS redirect URIs
4. Check Convex dashboard for errors
5. Open an issue: https://github.com/waynesutton/opensync/issues

---

**Good luck with your deployment!** 🎉
