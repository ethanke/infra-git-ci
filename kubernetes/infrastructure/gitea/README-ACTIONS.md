# Gitea Actions Setup Guide

This guide explains how to set up Gitea Actions runners for CI/CD.

## Prerequisites

1. Gitea instance running at https://git.lum.tools
2. Kubernetes cluster access
3. Admin access to Gitea

## Step 1: Enable Actions in Gitea

Actions are enabled via the ConfigMap. The configuration has been updated in `configmap.yaml`:

```yaml
[actions]
ENABLED = true
DEFAULT_ACTIONS_URL = https://git.lum.tools
```

Apply the updated configuration:

```bash
export KUBECONFIG=/home/ethan/Work/lum.tools/infra/kubeconfig.yaml
kubectl apply -f configmap.yaml
kubectl rollout restart deployment/gitea -n gitea
```

Wait for Gitea to restart, then verify Actions are enabled:
- Go to https://git.lum.tools/admin/config/actions
- Ensure "Enable Actions" is checked

## Step 2: Get Runner Registration Token

1. Log in to Gitea as admin
2. Go to https://git.lum.tools/admin/runners
3. Copy the registration token (it will look like a long string)

## Step 3: Add Registration Token to Secrets

Add the registration token to the Gitea secrets:

```bash
export KUBECONFIG=/home/ethan/Work/lum.tools/infra/kubeconfig.yaml

# Edit the secret
kubectl edit secret gitea-secrets -n gitea
```

Add this line to `stringData`:
```yaml
  ACT_RUNNER_REGISTER_TOKEN: "your-registration-token-here"
```

Or use kubectl to patch it:
```bash
kubectl create secret generic gitea-secrets \
  --from-literal=ACT_RUNNER_REGISTER_TOKEN="your-token" \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Step 4: Deploy Actions Runner

Deploy the runner components:

```bash
export KUBECONFIG=/home/ethan/Work/lum.tools/infra/kubeconfig.yaml
cd /home/ethan/Work/lum.tools/infra/k8s/gitea

# Deploy ServiceAccount and RBAC
kubectl apply -f act-runner-serviceaccount.yaml
kubectl apply -f act-runner-rbac.yaml

# Deploy the runner
kubectl apply -f act-runner-deployment.yaml
```

## Step 5: Verify Runner Registration

Check if runners are registered:

```bash
# Check pod status
kubectl get pods -n gitea -l app=gitea-act-runner

# Check logs
kubectl logs -n gitea -l app=gitea-act-runner

# Verify in Gitea UI
# Go to https://git.lum.tools/admin/runners
# You should see runners listed as "Online"
```

## Troubleshooting

### Runner not registering

1. Check logs: `kubectl logs -n gitea -l app=gitea-act-runner`
2. Verify registration token is correct
3. Ensure Gitea Actions are enabled
4. Check network connectivity from runner pod to Gitea

### Runner not picking up jobs

1. Verify runner labels match workflow requirements
2. Check runner status in Gitea admin panel
3. Ensure runner has sufficient resources

### Docker socket issues

The runner uses the host's Docker socket. Ensure:
- Docker is running on the nodes
- `/var/run/docker.sock` is accessible
- Runner has privileged access (configured in deployment)

## Runner Configuration

The runner is configured with these labels:
- `ubuntu-latest:docker://node:20-bookworm`
- `ubuntu-22.04:docker://node:20-bookworm`
- `ubuntu-20.04:docker://node:20-bookworm`

These match common GitHub Actions runner labels for compatibility.

## Scaling Runners

To scale runners:

```bash
kubectl scale deployment gitea-act-runner -n gitea --replicas=3
```

Default is 2 replicas for high availability.

