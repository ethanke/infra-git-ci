# Blog Scripts

This directory contains legacy scripts for the lum.tools blog. 

## ⚠️ DEPRECATED - Use New Structure

**All blog management functionality has been moved to `posts/` directory.**

Please use the new utilities:

- **Post Management**: `posts/utils/post-manager.js`
- **Database Operations**: `posts/utils/db-utils.js`  
- **Deployment**: `posts/utils/deploy.sh`

See `posts/README.md` for complete documentation.

## Migration Guide

### Old → New Commands

| Old Command | New Command |
|-------------|-------------|
| `node scripts/import-markdown-post.js` | `node posts/utils/post-manager.js import` |
| `node scripts/translate-post.js` | `node posts/utils/post-manager.js translate` |
| `node scripts/export-articles.js` | `node posts/utils/post-manager.js export` |
| `node scripts/seed-categories-tags.js` | `node posts/utils/db-utils.js seed` |
| `node scripts/check-schema.js` | `node posts/utils/db-utils.js check-schema` |
| `./scripts/deploy-prod.sh` | `./posts/utils/deploy.sh` |

### Benefits of New Structure

- **Single-purpose utilities** - Each tool has one clear responsibility
- **Better organization** - All post-related tools in `posts/` directory
- **Consolidated functionality** - Related operations combined into single tools
- **Improved documentation** - Comprehensive README with examples
- **Cleaner codebase** - Removed redundant and duplicate scripts 