# syntax=docker/dockerfile:1.6

# ============================================
# lum.tools Platform - Deno/Hono
# ============================================

FROM denoland/deno:alpine-2.1.4 AS builder

WORKDIR /app

# Copy shared libs first (better caching)
COPY libs/ /app/libs/

# Copy app source
COPY apps/platform/ /app/apps/platform/

# Cache dependencies (no lockfile for image builds)
RUN cd /app/apps/platform && deno cache --no-lock app/server.ts

# ============================================
# Production image
# ============================================
FROM denoland/deno:alpine-2.1.4

WORKDIR /app

# Use deno user (already exists in base image)
USER deno

# Copy from builder
COPY --from=builder --chown=deno:deno /app /app

WORKDIR /app/apps/platform

ENV PORT=3000
ENV ENV=production

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD deno eval "const r = await fetch('http://localhost:3000/health'); if(!r.ok) Deno.exit(1)"

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "app/server.ts"]
