# Traefik Metrics Scraper

Monitors Traefik access logs to track lrok tunnel traffic usage and report metrics to the platform API.

## Overview

This service continuously polls Traefik pod logs via the Kubernetes API, extracts tunnel-specific traffic data, aggregates it, and reports to the platform service for user attribution and billing.

**Key Features:**
- Real-time log processing from Traefik pods
- Traffic aggregation by subdomain (lrok tunnels)
- Automatic user attribution via platform API
- Minimal resource footprint (64Mi memory, 50m CPU)
- No external dependencies (reads logs via K8s API)

## Architecture

```
┌─────────────────┐
│  Traefik Pod    │
│  (namespace:    │
│   traefik)      │
└────────┬────────┘
         │
         │ K8s API (read logs)
         │
         ▼
┌─────────────────────────┐
│ Traefik Metrics Scraper │
│  - Poll logs every 60s  │
│  - Parse JSON logs      │
│  - Aggregate by         │
│    subdomain            │
└────────┬────────────────┘
         │
         │ HTTP POST
         │ /api/v1/activity-logs/tunnel-traffic
         │
         ▼
┌─────────────────────────┐
│   Platform Service      │
│  - Lookup tunnel owner  │
│  - Log traffic data     │
│  - Update quotas        │
└─────────────────────────┘
```

## How It Works

1. **Log Polling**: Every 60 seconds, the scraper retrieves recent logs from Traefik pods using the Kubernetes API
2. **Traffic Extraction**: Parses JSON-formatted access logs and filters for `*.t.lum.tools` domains
3. **Aggregation**: Groups traffic by subdomain (tunnel) and accumulates bytes in/out and request counts
4. **Reporting**: POSTs aggregated data to platform API with internal authentication
5. **User Attribution**: Platform looks up tunnel ownership and logs traffic to user's activity

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PLATFORM_API_URL` | `http://platform.platform.svc.cluster.local:3000` | Platform API endpoint |
| `PLATFORM_INTERNAL_SECRET` | *(required)* | Internal authentication secret |
| `REPORT_INTERVAL` | `60` | Seconds between reports |
| `LOG_LEVEL` | `INFO` | Logging verbosity (`DEBUG`, `INFO`) |

### Kubernetes Resources

- **CPU**: 50m request, 100m limit
- **Memory**: 64Mi request, 128Mi limit
- **Replicas**: 1 (single instance to avoid duplicate processing)

## Deployment

### Prerequisites

1. Platform service must be deployed and accessible
2. Traefik must be deployed in `traefik` namespace with JSON access logs
3. Internal secret must be configured

### Deploy via GitOps

The service is automatically deployed when changes are pushed to `main`:

```bash
# Make changes to apps/traefik-metrics-scraper/
git add apps/traefik-metrics-scraper/
git commit -m "Update traefik-metrics-scraper"
git push origin main
```

GitHub Actions will:
1. Build and push Docker image to `ghcr.io/ethanke/traefik-metrics-scraper:latest`
2. FluxCD will detect changes and apply to cluster

### Manual Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -k kubernetes/apps/traefik-metrics-scraper/

# Check deployment status
kubectl get pods -n traefik-metrics-scraper
kubectl logs -f -n traefik-metrics-scraper deployment/traefik-metrics-scraper
```

### Set Up Secrets

Create the required secret:

```bash
kubectl create secret generic traefik-metrics-scraper-secrets \
  -n traefik-metrics-scraper \
  --from-literal=platform-internal-secret="YOUR_SECRET_HERE"
```

Or use sealed-secrets/external-secrets in production.

## Monitoring

### Logs

View real-time processing:

```bash
kubectl logs -f -n traefik-metrics-scraper deployment/traefik-metrics-scraper
```

Example output:
```
[INFO] Starting Traefik access log scraper
[INFO] Platform URL: http://platform.platform.svc.cluster.local:3000
[INFO] Report interval: 60s
[INFO] Polling logs from pod: traefik-xyz123
[INFO] Reporting 3 tunnel(s)
[INFO] ✅ my-tunnel: ↓1024B ↑2048B (15req) → User:abc123def456
```

### Health Checks

The deployment includes a liveness probe that checks if the Python process is running:

```bash
kubectl get pods -n traefik-metrics-scraper
```

Healthy pod should show `1/1 Running`.

## RBAC Permissions

The scraper requires specific Kubernetes permissions:

- **ClusterRole** `traefik-log-reader`:
  - `pods` - get, list, watch
  - `pods/log` - get, list, watch
  - `namespaces` - get, list

These are scoped to read-only operations on pod logs.

## Troubleshooting

### No traffic reported

1. Check Traefik is logging in JSON format
2. Verify Traefik pods are in `traefik` namespace
3. Ensure tunnels use `*.t.lum.tools` domains
4. Check RBAC permissions

```bash
kubectl auth can-i get pods/log -n traefik --as=system:serviceaccount:traefik-metrics-scraper:traefik-metrics-scraper
```

### HTTP errors to platform

1. Verify `PLATFORM_API_URL` is correct
2. Check `PLATFORM_INTERNAL_SECRET` matches platform configuration
3. Ensure platform service is running

```bash
kubectl get svc -n platform
kubectl logs -n platform deployment/platform
```

### High memory usage

If memory exceeds limits:
1. Check `REPORT_INTERVAL` - lower values = more frequent processing
2. Review log volume - very high traffic may need tuning
3. Consider adjusting resource limits

## Development

### Local Testing

Run locally against a cluster:

```bash
cd apps/traefik-metrics-scraper

# Set environment
export PLATFORM_API_URL="http://localhost:3000"
export PLATFORM_INTERNAL_SECRET="dev-secret"
export LOG_LEVEL="DEBUG"

# Port-forward platform
kubectl port-forward -n platform svc/platform 3000:3000 &

# Run scraper
python3 scraper.py
```

### Build Docker Image

```bash
cd apps/traefik-metrics-scraper
docker build -t traefik-metrics-scraper:dev .
docker run --rm traefik-metrics-scraper:dev
```

## API Integration

### Platform API Endpoint

**POST** `/api/v1/activity-logs/tunnel-traffic`

**Headers:**
```
Content-Type: application/json
x-internal-secret: <PLATFORM_INTERNAL_SECRET>
```

**Request Body:**
```json
{
  "subdomain": "my-tunnel",
  "bytes_in": 1024,
  "bytes_out": 2048,
  "timestamp": "2025-12-07T12:00:00.000000"
}
```

**Response (201 Created):**
```json
{
  "status": "logged",
  "user_id": "abc123def456",
  "subdomain": "my-tunnel"
}
```

**Response (200 OK - Skipped):**
```json
{
  "status": "skipped",
  "reason": "tunnel not found or inactive"
}
```

## Migration Notes

This service was migrated from `lum.tools/services/traefik-metrics-scraper` to `infra-git-ci` with the following changes:

1. **Platform URL**: Updated from `http://platform-service.platform.svc.cluster.local` to `http://platform.platform.svc.cluster.local:3000`
2. **Image Registry**: Changed from `registry.lum.tools` to `ghcr.io/ethanke` (GitHub Container Registry)
3. **Namespace**: Moved from `traefik` to dedicated `traefik-metrics-scraper` namespace
4. **RBAC**: Upgraded from Role to ClusterRole for cross-namespace access
5. **CI/CD**: Integrated into GitHub Actions workflow (`apps.yaml`)

## License

Part of lum.tools infrastructure - internal use only.
