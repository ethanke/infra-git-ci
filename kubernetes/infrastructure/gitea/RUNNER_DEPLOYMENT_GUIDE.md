# Gitea Global Runners Deployment Guide

This directory contains the configuration for the Gitea Actions runners deployed on the cluster.

## Architecture

We use a **StatefulSet** with 4 replicas to provide 4 global runners. Each runner pod consists of:
1. **act-runner**: The Gitea runner agent that polls for jobs.
2. **docker-daemon**: A privileged Docker-in-Docker (DinD) sidecar that executes the actual jobs.

This architecture ensures that each runner has its own isolated Docker environment and persistent identity (via PVCs).

## Components

- **StatefulSet**: `gitea-global-runners` (4 replicas)
- **ServiceAccount**: `gitea-global-runners`
- **Secret**: `gitea-global-runners-secret` (contains registration token)
- **Storage**: 2Gi PVC per runner (`runner-data-gitea-global-runners-N`)

## Deployment

To deploy or update the runners:

```bash
# 1. Ensure the secret exists (contains registration token)
kubectl apply -f gitea-global-runners-secret.yaml

# 2. Apply RBAC and ServiceAccount
kubectl apply -f act-runner-serviceaccount.yaml
kubectl apply -f act-runner-rbac.yaml

# 3. Deploy the StatefulSet
kubectl apply -f gitea-global-runners-statefulset.yaml
```

## Registration Token

The registration token is stored in `gitea-global-runners-secret.yaml`. If you need to rotate it:
1. Go to Gitea Admin > Actions > Runners > Create new Runner
2. Copy the token
3. Update `gitea-global-runners-secret.yaml` (base64 encoded if editing directly, or use stringData)
4. Apply the secret
5. Restart the runner pods: `kubectl rollout restart statefulset gitea-global-runners -n gitea`

## Troubleshooting

**Runners Offline?**
Check the logs of the runner container:
```bash
kubectl logs -n gitea gitea-global-runners-0 -c act-runner
```

**Docker Issues?**
Check the logs of the dind sidecar:
```bash
kubectl logs -n gitea gitea-global-runners-0 -c docker-daemon
```

**Resetting a Runner**
If a runner is stuck or needs a clean slate:
1. Scale down the specific replica or delete the pod
2. If registration is broken, delete the PVC associated with that runner:
   ```bash
   kubectl delete pvc runner-data-gitea-global-runners-0 -n gitea
   ```
   The runner will re-register as a new runner upon restart.
