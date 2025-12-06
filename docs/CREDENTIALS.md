# Credentials and Providers Configuration

This document lists all credentials and providers required for the lum.tools infrastructure.

## Required Credentials

### Infrastructure Providers

| Provider | Secret/Variable | Purpose | Where to Set |
|----------|----------------|---------|--------------|
| **Hetzner Cloud** | `HCLOUD_TOKEN` | Terraform cluster provisioning | GitHub Secrets, `.env` |
| **Container Registry** | `registry-creds` | Pull images from registry.lum.tools | K8s Secret (SOPS) |
| **Porkbun DNS** | `porkbun-credentials` | DNS for lum.tools | K8s Secret (SOPS) |
| **Namecheap DNS** | `namecheap-credentials` | DNS for lrok.space | K8s Secret (SOPS) |
| **GitHub** | `GITHUB_TOKEN` | FluxCD bootstrap, Actions | GitHub Secrets |

### Application Secrets (per-service)

| Secret | Services Using It | Where to Set |
|--------|-------------------|--------------|
| `DATABASE_URL` | platform, lrok, judge | K8s Secret (SOPS) |
| `REDIS_URL` | platform, litellm | K8s Secret (SOPS) |
| `FIREBASE_*` | platform-front | K8s Secret / Build Args |
| `STRIPE_*` | platform | K8s Secret (SOPS) |

## DNS Provider Configuration

### lum.tools (Porkbun)
- **Provider**: Porkbun
- **API Portal**: https://porkbun.com/account/api
- **Managed by**: external-dns + Porkbun webhook
- **Certificates**: cert-manager with letsencrypt-prod issuer

### lrok.space (Namecheap)
- **Provider**: Namecheap
- **API Username**: `ethanke`
- **API Key**: `e0d30246a2ed4d56ba3d1b3cab29caa2`
- **Managed by**: external-dns + Namecheap webhook
- **Certificates**: cert-manager with letsencrypt-namecheap issuer

> ⚠️ **IMPORTANT**: Namecheap API requires IP whitelisting. Ensure your cluster's egress IP is whitelisted in the Namecheap console.

## Setup Instructions

### 1. Hetzner Cloud Token

```bash
# Set for local development
export HCLOUD_TOKEN="your-hetzner-token"

# For GitHub Actions, add to repository secrets:
# Settings → Secrets → Actions → New repository secret
# Name: HCLOUD_TOKEN
# Value: your-hetzner-token
```

### 2. Container Registry Credentials

```bash
# Create the Kubernetes secret
kubectl create secret docker-registry registry-creds \
  --docker-server=registry.lum.tools \
  --docker-username=your-username \
  --docker-password=your-password \
  -n <namespace>

# Or encrypt with SOPS and commit
sops -e registry-creds.yaml > registry-creds.enc.yaml
rm registry-creds.yaml
```

### 3. Porkbun DNS Credentials

```bash
# Get from Porkbun: https://porkbun.com/account/api
cat <<EOF > porkbun-credentials.yaml
apiVersion: v1
kind: Secret
metadata:
  name: porkbun-credentials
  namespace: external-dns
type: Opaque
stringData:
  api-key: "your-api-key"
  secret-api-key: "your-secret-key"
EOF

sops -e porkbun-credentials.yaml > porkbun-credentials.enc.yaml
rm porkbun-credentials.yaml
```

### 4. Namecheap DNS Credentials

```bash
# IP must be whitelisted in Namecheap console!
cat <<EOF > namecheap-credentials.yaml
apiVersion: v1
kind: Secret
metadata:
  name: namecheap-credentials
  namespace: external-dns
type: Opaque
stringData:
  api-key: "e0d30246a2ed4d56ba3d1b3cab29caa2"
  api-user: "ethanke"
EOF

sops -e namecheap-credentials.yaml > namecheap-credentials.enc.yaml
rm namecheap-credentials.yaml
```

### 5. SOPS Age Key

```bash
# Generate Age key pair
age-keygen -o ~/.config/sops/age/keys.txt

# Note the public key (starts with "age1...")
# Update .sops.yaml with your public key

# Create FluxCD decryption secret
kubectl create secret generic sops-age \
  --from-file=age.agekey=~/.config/sops/age/keys.txt \
  -n flux-system

# Set environment variable for local SOPS usage
export SOPS_AGE_KEY_FILE=~/.config/sops/age/keys.txt
```

## GitHub Repository Secrets

Add these to your GitHub repository (Settings → Secrets → Actions):

| Secret Name | Description |
|-------------|-------------|
| `HCLOUD_TOKEN` | Hetzner Cloud API token |
| `KUBECONFIG` | Base64-encoded kubeconfig for cluster access |
| `GITHUB_TOKEN` | (Automatic) GitHub token for Actions |
| `REGISTRY_USERNAME` | Container registry username |
| `REGISTRY_PASSWORD` | Container registry password |

## Security Best Practices

1. **Never commit plaintext secrets** - Always use SOPS encryption
2. **Rotate tokens periodically** - Especially Hetzner and registry tokens
3. **Limit token scope** - Use read-only tokens where possible
4. **Use short-lived tokens** - For CI/CD, prefer OIDC when available
5. **Audit access** - Regularly review who has access to secrets

## Verification

```bash
# Verify Hetzner token
hcloud context create test-context
hcloud server list

# Verify registry access
docker login registry.lum.tools

# Verify kubectl access
kubectl get nodes

# Verify SOPS setup
echo "test: value" | sops -e /dev/stdin

# Verify DNS for lum.tools
dig +short test.lum.tools

# Verify DNS for lrok.space
dig +short lrok.space
```
