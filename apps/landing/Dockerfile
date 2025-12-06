# syntax=docker/dockerfile:1.6

# ============================================
# lum.tools Landing Page - Deno/Hono
# Optimized multi-stage build
# ============================================

FROM denoland/deno:alpine-2.1.4 AS builder

WORKDIR /app

# Copy shared libs first (better caching)
COPY libs/ /app/libs/

# Copy app source
COPY apps/landing/ /app/apps/landing/

# Cache dependencies (no lockfile for image builds)
RUN cd /app/apps/landing && deno cache --no-lock app/server.ts

# ============================================
# Production image
# ============================================
FROM denoland/deno:alpine-2.1.4

WORKDIR /app

# Use deno user (already exists in base image)
USER deno

# Copy from builder
COPY --from=builder --chown=deno:deno /app /app

WORKDIR /app/apps/landing

ENV PORT=3000
ENV ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "app/server.ts"]
