# syntax=docker/dockerfile:1.6
# ============================================================================
# Generic Service Template
# Customize this Dockerfile for your specific service
# ============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder (customize based on your stack)
# -----------------------------------------------------------------------------
FROM ubuntu:22.04 AS builder

WORKDIR /build

# Configure APT for faster downloads (critical for Hetzner)
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4 && \
    echo 'Acquire::http::Timeout "20";' > /etc/apt/apt.conf.d/99timeout && \
    echo 'Acquire::http::MaxParallel "10";' >> /etc/apt/apt.conf.d/99timeout

# Install build dependencies
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy source and build
COPY . .
# RUN your-build-command-here

# -----------------------------------------------------------------------------
# Stage 2: Runtime
# -----------------------------------------------------------------------------
FROM ubuntu:22.04 AS runtime

WORKDIR /app

# Configure APT for faster downloads
RUN echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4

# Install runtime dependencies only
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser

# Copy build artifacts from builder
COPY --from=builder --chown=appuser:appuser /build/output /app/

# Switch to non-root user
USER appuser

# Health check (customize endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port (customize as needed)
EXPOSE 8080

# Run command (customize)
CMD ["./your-binary"]
