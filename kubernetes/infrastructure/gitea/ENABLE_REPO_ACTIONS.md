# Enable Gitea Actions for Repositories

## Issue
Actions are enabled at the Gitea instance level, but the "Actions" tab doesn't appear in repositories because **Actions are disabled by default for each repository**.

## Solution: Enable Actions Per Repository

### Steps to Enable Actions for a Repository

1. **Navigate to Repository Settings:**
   - Go to your repository: https://git.lum.tools/ethanke/lum-qa
   - Click on **"Settings"** (gear icon in the repository navigation)

2. **Enable Repository Actions:**
   - Scroll down to **"Advanced Settings"** section
   - Check the box: **"Enable Repository Actions"**
   - Click **"Update Settings"** to save

3. **Verify:**
   - After enabling, refresh the repository page
   - You should now see an **"Actions"** tab in the repository navigation bar
   - The tab will show workflow runs and allow you to view logs

### For lum-qa Repository

**Direct link to settings:**
https://git.lum.tools/ethanke/lum-qa/settings

**Steps:**
1. Go to: https://git.lum.tools/ethanke/lum-qa/settings
2. Scroll to "Advanced Settings"
3. Enable "Enable Repository Actions"
4. Click "Update Settings"
5. Check that the "Actions" tab appears

### Alternative: Enable via API (if needed)

If you prefer to enable via API:

```bash
# Get your Gitea token first (from Settings -> Applications -> Generate Token)
GITEA_TOKEN="your-token-here"
REPO_OWNER="ethanke"
REPO_NAME="lum-qa"

curl -X PATCH \
  -H "Authorization: token $GITEA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"actions_enabled": true}' \
  "https://git.lum.tools/api/v1/repos/$REPO_OWNER/$REPO_NAME"
```

## Why This Is Required

According to Gitea documentation:
- Actions are enabled at the **instance level** (which we've done ✅)
- But they are **disabled by default** for each repository
- Each repository owner must explicitly enable Actions for their repository
- This is a security feature to prevent accidental workflow execution

## After Enabling

Once Actions are enabled for the repository:
- ✅ "Actions" tab will appear in the repository navigation
- ✅ Workflow files in `.gitea/workflows/` will be recognized
- ✅ Workflows will trigger on push events
- ✅ You can view workflow runs and logs
- ✅ You can configure repository secrets

## References

- [Gitea Actions Quickstart](https://docs.gitea.com/1.24/usage/actions/quickstart)
- Gitea version: 1.21.11 (Actions enabled by default in 1.21.0+)

