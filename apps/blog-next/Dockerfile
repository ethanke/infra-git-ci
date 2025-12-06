# Blog Next.js
# Multi-stage build for production

FROM node:20-bookworm-slim AS deps
ENV NODE_ENV=production PNPM_HOME=/root/.local/share/pnpm PATH=/root/.local/share/pnpm:$PATH
RUN corepack enable && mkdir -p /app
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM node:20-bookworm-slim AS builder
ENV NODE_ENV=production PNPM_HOME=/root/.local/share/pnpm PATH=/root/.local/share/pnpm:$PATH
RUN corepack enable && mkdir -p /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy built app
COPY --from=builder --chown=appuser:appuser /app/.next ./.next
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /app/public ./public
COPY --from=builder --chown=appuser:appuser /app/posts ./posts

USER appuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/en || exit 1

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
