# Service Templates

Standardized templates for deploying services to lum.tools infrastructure.

## Available Templates

| Template | Use Case | Stack |
|----------|----------|-------|
| `python-fastapi` | Python APIs and backends | FastAPI + Uvicorn |
| `nextjs` | Frontend apps and full-stack | Next.js 14+ |
| `generic` | Custom services | Any (bring your own Dockerfile) |

## Quick Start

```bash
# Create a new service using the scaffolding script
./scripts/create-service.sh my-service --type python-fastapi --domain myapp.lum.tools

# Or copy a template manually
cp -r templates/python-fastapi services/my-service
```

## Template Structure

Each template includes:

```
<template>/
├── Dockerfile              # Multi-stage build with BuildKit
├── .env.example           # Environment variables template
└── k8s/
    ├── base/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   ├── ingress.yaml
    │   └── kustomization.yaml
    └── overlays/
        ├── dev/
        │   └── kustomization.yaml
        └── prod/
            └── kustomization.yaml
```

## Customization

After scaffolding, customize these files:

1. **Dockerfile** - Add your dependencies
2. **deployment.yaml** - Adjust resources, probes
3. **.env.example** - Define your environment variables
4. **overlays/** - Environment-specific configurations

## Best Practices

- ✅ Always use multi-stage builds
- ✅ Set resource requests and limits
- ✅ Define health probes
- ✅ Use SOPS for secrets (`.enc.yaml`)
- ✅ Keep base configs minimal, use overlays for env-specific settings
