#!/bin/bash
# FluxCD Bootstrap Script for lum.tools GitOps Infrastructure
# This script initializes FluxCD with SOPS encryption for secrets

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $*"; }
log_success() { echo -e "${GREEN}✓${NC} $*"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $*"; }
log_error() { echo -e "${RED}✗${NC} $*"; }

# Configuration
GITHUB_ORG="${GITHUB_ORG:-lum-tools}"
GITHUB_REPO="${GITHUB_REPO:-infra-git-ci}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"
CLUSTER_PATH="${CLUSTER_PATH:-./kubernetes}"
FLUX_VERSION="${FLUX_VERSION:-2.4.0}"

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing=()
    
    command -v kubectl &>/dev/null || missing+=("kubectl")
    command -v flux &>/dev/null || missing+=("flux")
    command -v age &>/dev/null || missing+=("age")
    command -v sops &>/dev/null || missing+=("sops")
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        echo ""
        echo "Install with:"
        echo "  brew install kubectl fluxcd/tap/flux age sops"
        echo "  # or"
        echo "  curl -s https://fluxcd.io/install.sh | sudo bash"
        exit 1
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &>/dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Check your KUBECONFIG."
        exit 1
    fi
    
    # Check GitHub token
    if [ -z "${GITHUB_TOKEN:-}" ]; then
        log_error "GITHUB_TOKEN environment variable is required"
        echo "Create a token at: https://github.com/settings/tokens"
        echo "Required scopes: repo"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Generate Age key for SOPS encryption
setup_sops_age() {
    log_info "Setting up SOPS with Age encryption..."
    
    AGE_KEY_FILE="${HOME}/.config/sops/age/keys.txt"
    
    if [ -f "$AGE_KEY_FILE" ]; then
        log_warning "Age key already exists at $AGE_KEY_FILE"
        read -p "Use existing key? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Generating new Age key..."
            mkdir -p "$(dirname "$AGE_KEY_FILE")"
            age-keygen -o "$AGE_KEY_FILE"
        fi
    else
        log_info "Generating new Age key..."
        mkdir -p "$(dirname "$AGE_KEY_FILE")"
        age-keygen -o "$AGE_KEY_FILE"
    fi
    
    # Extract public key
    AGE_PUBLIC_KEY=$(grep "public key:" "$AGE_KEY_FILE" | cut -d: -f2 | tr -d ' ')
    log_success "Age public key: $AGE_PUBLIC_KEY"
    
    # Create Kubernetes secret for SOPS
    log_info "Creating SOPS Age secret in cluster..."
    kubectl create namespace flux-system --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic sops-age \
        --namespace=flux-system \
        --from-file=age.agekey="$AGE_KEY_FILE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "SOPS Age secret created"
    
    # Create .sops.yaml configuration
    cat > "$(git rev-parse --show-toplevel)/.sops.yaml" << EOF
creation_rules:
  - path_regex: kubernetes/.*\.sops\.yaml$
    encrypted_regex: ^(data|stringData)$
    age: ${AGE_PUBLIC_KEY}
  - path_regex: kubernetes/.*secrets.*\.yaml$
    encrypted_regex: ^(data|stringData)$
    age: ${AGE_PUBLIC_KEY}
EOF
    
    log_success "Created .sops.yaml configuration"
    echo ""
    log_warning "IMPORTANT: Save your Age key securely!"
    echo "  Key location: $AGE_KEY_FILE"
    echo "  Public key: $AGE_PUBLIC_KEY"
}

# Bootstrap FluxCD
bootstrap_flux() {
    log_info "Bootstrapping FluxCD..."
    
    # Pre-flight check
    flux check --pre
    
    # Bootstrap
    flux bootstrap github \
        --owner="$GITHUB_ORG" \
        --repository="$GITHUB_REPO" \
        --branch="$GITHUB_BRANCH" \
        --path="$CLUSTER_PATH/flux-system" \
        --personal=false \
        --private=true \
        --components-extra="image-reflector-controller,image-automation-controller"
    
    log_success "FluxCD bootstrapped successfully"
}

# Configure image automation
setup_image_automation() {
    log_info "Setting up image automation..."
    
    # Create image repository for registry.lum.tools
    cat << EOF | kubectl apply -f -
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageRepository
metadata:
  name: lum-registry
  namespace: flux-system
spec:
  image: registry.lum.tools
  interval: 1m0s
  secretRef:
    name: regcred
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: lum-semver
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: lum-registry
  policy:
    semver:
      range: ">=1.0.0"
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: lum-latest
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: lum-registry
  filterTags:
    pattern: '^[a-f0-9]{7,40}$'
  policy:
    alphabetical:
      order: desc
EOF
    
    log_success "Image automation configured"
}

# Verify installation
verify_installation() {
    log_info "Verifying FluxCD installation..."
    
    # Wait for all pods to be ready
    kubectl wait --for=condition=available deployment --all -n flux-system --timeout=300s
    
    # Check reconciliation
    flux get all -A
    
    log_success "FluxCD is running"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}✅ FluxCD Bootstrap Complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Commit and push the .sops.yaml file"
    echo "  2. Create encrypted secrets with: sops -e secret.yaml > secret.sops.yaml"
    echo "  3. Add applications to kubernetes/apps/"
    echo "  4. FluxCD will automatically sync changes from Git"
    echo ""
    echo "Useful commands:"
    echo "  flux get all -A              # See all Flux resources"
    echo "  flux logs                    # View Flux logs"
    echo "  flux reconcile source git flux-system  # Force sync"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main
main() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║         FluxCD Bootstrap for lum.tools GitOps                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    setup_sops_age
    bootstrap_flux
    setup_image_automation
    verify_installation
}

main "$@"
