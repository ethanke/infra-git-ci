# lum.tools GitOps Infrastructure

State-of-the-art Kubernetes infrastructure for lum.tools using GitOps principles.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GitHub Repository                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  terraform/ │  │ kubernetes/ │  │    apps/    │  │  .github/   │        │
│  │             │  │             │  │             │  │  workflows/ │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          ▼                │                │                │
┌─────────────────┐        │                │                │
│ GitHub Actions  │◀───────┴────────────────┴────────────────┘
│ (terraform)     │        │
└────────┬────────┘        │
         │                 │
         ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Hetzner Cloud                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Kubernetes Cluster (K3s)                          │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐                         │    │
│  │  │Control    │ │Control    │ │Control    │  (HA: 3 locations)      │    │
│  │  │Plane FSN1 │ │Plane NBG1 │ │Plane HEL1 │                         │    │
│  │  └───────────┘ └───────────┘ └───────────┘                         │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐   │    │
│  │  │                    FluxCD GitOps                             │   │    │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │   │    │
│  │  │  │ Source       │ │ Kustomize    │ │ Helm         │        │   │    │
│  │  │  │ Controller   │ │ Controller   │ │ Controller   │        │   │    │
│  │  │  └──────────────┘ └──────────────┘ └──────────────┘        │   │    │
│  │  └─────────────────────────────────────────────────────────────┘   │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐   │    │
│  │  │              Observability (LGTM Stack)                      │   │    │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐             │   │    │
│  │  │  │ Loki   │ │Grafana │ │ Tempo  │ │ Promtail │             │   │    │
│  │  │  │ (Logs) │ │  (UI)  │ │(Traces)│ │ (Collect)│             │   │    │
│  │  │  └────────┘ └────────┘ └────────┘ └──────────┘             │   │    │
│  │  └─────────────────────────────────────────────────────────────┘   │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐   │    │
│  │  │                    Applications                              │   │    │
│  │  │  platform | landing | blog | lum-growth | lrok | ...        │   │    │
│  │  └─────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Features

### 🏗️ Infrastructure
- **Kubernetes**: K3s on openSUSE MicroOS (immutable, auto-upgrading)
- **High Availability**: 3 control planes across FSN1, NBG1, HEL1
- **Networking**: Cilium CNI with Hubble (network observability)
- **Security**: WireGuard encryption, automatic TLS certificates
- **Storage**: Longhorn distributed storage + Hetzner CSI

### 🔄 GitOps
- **FluxCD**: Continuous delivery from Git
- **SOPS + Age**: Encrypted secrets in Git
- **Image Automation**: Automatic image tag updates
- **Preview Environments**: Ephemeral namespaces for PRs

### 📊 Observability
- **Logs**: Loki + Promtail (structured JSON logs)
- **Metrics**: Prometheus + Cilium metrics
- **Traces**: Tempo (OpenTelemetry compatible)
- **Dashboards**: Grafana with pre-configured dashboards

### 🤖 Agent-Ready
- **API Endpoints**: REST API for log/metrics queries
- **Webhooks**: Alert notifications for AI agents
- **Actions**: Pod restart, scale, rollback via API
- **RBAC**: Scoped permissions for agent operations

## Quick Start

### Prerequisites

```bash
# Install required tools
brew install terraform packer kubectl hcloud flux age sops

# Set Hetzner API token
export HCLOUD_TOKEN="your-token-here"

# Optional: Set GitHub token for FluxCD
export GITHUB_TOKEN="your-github-token"
```

### Deploy Infrastructure

```bash
# Full deployment (snapshots + cluster + FluxCD)
./scripts/deploy.sh

# Or step by step:
./scripts/deploy.sh plan    # Preview changes
./scripts/deploy.sh apply   # Apply infrastructure
```

### Bootstrap FluxCD

```bash
# If not done during deploy
export GITHUB_TOKEN="your-token"
./scripts/bootstrap-flux.sh
```

## Directory Structure

```
infra-git-ci/
├── terraform/              # Infrastructure as Code
│   ├── main.tf            # Kubernetes cluster definition
│   ├── variables.tf       # Configuration variables
│   ├── outputs.tf         # Exported values
│   └── packer/            # MicroOS snapshot builder
├── kubernetes/             # GitOps manifests
│   ├── flux-system/       # FluxCD configuration
│   ├── infrastructure/    # Cluster addons
│   │   ├── observability/ # LGTM stack
│   │   ├── cert-manager/  # TLS certificates
│   │   └── agent-monitoring/ # Agent API
│   └── apps/              # Application deployments
├── scripts/               # Automation scripts
│   ├── deploy.sh         # Main deployment script
│   └── bootstrap-flux.sh # FluxCD bootstrap
└── .github/workflows/     # CI/CD pipelines
    ├── terraform-plan.yaml
    ├── terraform-apply.yaml
    └── preview-deploy.yaml
```

## Cost Estimate

| Component | Type | Count | Cost/mo |
|-----------|------|-------|---------|
| Control Planes | CX22 | 3 | €11.85 |
| Worker Nodes | CX32 | 2 | €15.12 |
| Observability Node | CX22 | 1 | €3.95 |
| Load Balancer | LB11 | 1 | €5.95 |
| Storage (Volumes) | - | ~100GB | €4.00 |
| **Total** | | | **~€41/mo** |

*With autoscaling enabled (0-5 nodes), costs can vary based on workload.*

## Migration from Old Infrastructure

1. **Deploy new cluster** with this infrastructure
2. **Update DNS** to point to new load balancer IP
3. **Sync applications** via FluxCD
4. **Verify** all services are running
5. **Decommission** old infrastructure

DNS records to update:
- `*.lum.tools` → New load balancer IPv4
- `kube-api.lum.tools` → New control plane IP

## Contributing

1. Create a feature branch
2. Make changes to terraform/ or kubernetes/
3. Open PR - GitHub Actions will show plan
4. Merge after approval - Changes auto-apply

## Security

- Never commit secrets - use SOPS encryption
- Restrict `firewall_ssh_source` to your IP
- Rotate Hetzner API token periodically
- Use GitHub OIDC for keyless authentication (when configured)
