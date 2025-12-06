# syntax=docker/dockerfile:1.6

FROM node:20-bullseye-slim AS deps
ENV NODE_ENV=production PNPM_HOME=/root/.local/share/pnpm PATH=/root/.local/share/pnpm:$PATH
RUN corepack enable && mkdir -p /app
WORKDIR /app

# Install lum-internals dependencies first
COPY lum-internals/package.json ./lum-internals/
WORKDIR /app/lum-internals
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile || pnpm install

# Install main app dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile || pnpm install

FROM node:20-bullseye-slim AS builder
ENV NODE_ENV=production PNPM_HOME=/root/.local/share/pnpm PATH=/root/.local/share/pnpm:$PATH
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4
RUN corepack enable && mkdir -p /app && apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/lum-internals/node_modules ./lum-internals/node_modules
COPY . .
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm build

FROM node:20-bullseye-slim AS runner
ENV NODE_ENV=production DEV_MODE=false
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN useradd -r -u 1001 -g root nextjs
USER nextjs
WORKDIR /app

COPY --from=builder --chown=nextjs:root /app ./

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
