# Blog Next.js Service
# SEO-focused multi-language blog

## Overview

This is the **only** NextJS service - we're NOT rewriting it (SEO requirements).
We're migrating it to the new infra-git-ci structure as-is.

## Local Development

```bash
pnpm install
pnpm dev
```

## Production Build

```bash
pnpm build
pnpm start
```

## Deployment

Deployed via FluxCD GitOps from this repository.

Image: `ghcr.io/luminatools/blog-next:latest`
