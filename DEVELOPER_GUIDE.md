# Infrastructure Refactor - Developer Guide

This document describes the new infrastructure setup and development workflows.

## Quick Start

### 1. Set Up kubectl Context
```bash
source scripts/k8s-context.sh
```

### 2. View Service Logs
```bash
./scripts/logs.sh <service> <namespace>

# Examples:
./scripts/logs.sh postgres production-db
./scripts/logs.sh gitea gitea
./scripts/logs.sh frps frp
```

### 3. Port Forward to Services
```bash
./scripts/port-forward.sh <service> <namespace> <local:remote>

# Examples:
./scripts/port-forward.sh postgres production-db 5432:5432
./scripts/port-forward.sh redis production-db 6379:6379
./scripts/port-forward.sh gitea gitea 3000:3000
```

## What Changed

### Terraform Improvements
✅ **Egress node** with floating IP for outbound traffic  
✅ **cx32 autoscaler pool** for memory-intensive workloads  
✅ **Multi-zone agents** (fsn1 + nbg1) for resilience  
✅ **Control plane LB** for HA  
✅ **DNS servers** (Cloudflare + Google)  
✅ **etcd S3 backup** variables (ready to configure)

### Migrated Services
✅ **PostgreSQL** - StatefulSet with PDB  
✅ **Redis** - StatefulSet with PDB  
✅ **Gitea** - Git hosting + CI runners  
✅ **FRP** - lrok tunnel backend  
✅ **cert-manager Porkbun webhook** - DNS-01 challenges

### New Infrastructure
✅ **Network policies** - Default deny with explicit allows  
✅ **Dev tooling scripts** - Logs, port-forward, context

## Directory Structure

```
infra-git-ci/
├── terraform/
│   ├── main.tf              # Improved cluster config
│   ├── variables.tf         # Including etcd S3 backup vars
│   └── outputs.tf
├── kubernetes/
│   ├── infrastructure/
│   │   ├── databases/       # PostgreSQL + Redis
│   │   ├── gitea/           # Git hosting + runners
│   │   ├── frp/             # lrok tunnel backend
│   │   ├── cert-manager-porkbun/  # DNS-01 webhook
│   │   ├── network-policies/      # Security rules
│   │   └── observability/   # LGTM stack
│   └── apps/
│       └── registry/
└── scripts/
    ├── deploy.sh           # Main deployment
    ├── k8s-context.sh      # Set kubectl context
    ├── logs.sh             # Tail service logs
    └── port-forward.sh     # Local access
```

## Network Policies

Default deny rules are applied to:
- `default` namespace
- `production-db` namespace
- `gitea` namespace
- `frp` namespace

Explicit allows for:
- DNS queries (all pods → kube-system)
- Ingress traffic (traefik → services)
- Observability (metrics scraping)

## Next Steps

### SOPS Integration (TODO)
```bash
# 1. Generate Age key
age-keygen -o age.key

# 2. Create Kubernetes secret
kubectl create secret generic sops-age \
  --from-file=age.key \
  -n flux-system

# 3. Configure .sops.yaml
# 4. Encrypt secrets: sops -e secret.yaml > secret.enc.yaml
```

### Remaining Services to Migrate
- [ ] LiteLLM (LLM proxy)
- [ ] n8n (workflow automation)
- [ ] Argo Workflows
- [ ] Browserless
- [ ] MinIO (S3)
- [ ] Other services as needed

## Deployment

### Full Deploy
```bash
export HCLOUD_TOKEN="your-token"
./scripts/deploy.sh
```

### Plan Only
```bash
export HCLOUD_TOKEN="your-token"
./scripts/deploy.sh plan
```

### Apply Existing Plan
```bash
./scripts/deploy.sh apply
```

## Monitoring

Access observability stack:
```bash
# Port forward to Grafana
./scripts/port-forward.sh grafana observability 3000:3000

# Then open: http://localhost:3000
```

## Troubleshooting

### Pods not starting
```bash
kubectl get pods -A | grep -v Running
kubectl describe pod <pod-name> -n <namespace>
```

### Network issues
```bash
# Check network policies
kubectl get networkpolicy -A

# Test DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup kubernetes.default
```

### FluxCD reconciliation
```bash
flux get all
flux reconcile kustomization infrastructure --with-source
```
