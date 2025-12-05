#!/bin/bash
# Infrastructure Deployment Script
# Orchestrates the complete deployment of lum.tools GitOps infrastructure

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TERRAFORM_DIR="$INFRA_DIR/terraform"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $*"; }
log_success() { echo -e "${GREEN}✓${NC} $*"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $*"; }
log_error() { echo -e "${RED}✗${NC} $*"; }
log_step() { echo -e "\n${CYAN}═══ $* ═══${NC}\n"; }

# Check required environment variables
check_env() {
    log_step "Checking Environment"
    
    if [ -z "${HCLOUD_TOKEN:-}" ]; then
        log_error "HCLOUD_TOKEN environment variable is required"
        echo "Set it with: export HCLOUD_TOKEN='your-token'"
        exit 1
    fi
    
    log_success "Environment variables set"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking Prerequisites"
    
    local missing=()
    
    command -v terraform &>/dev/null || missing+=("terraform")
    command -v packer &>/dev/null || missing+=("packer")
    command -v kubectl &>/dev/null || missing+=("kubectl")
    command -v hcloud &>/dev/null || missing+=("hcloud")
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        echo ""
        echo "Install with:"
        echo "  brew install terraform packer kubectl hcloud"
        exit 1
    fi
    
    log_success "All prerequisites installed"
}

# Build MicroOS snapshots
build_snapshots() {
    log_step "Building MicroOS Snapshots"
    
    cd "$TERRAFORM_DIR/packer"
    
    # Check if snapshot already exists
    if hcloud image list -o noheader | grep -q "microos-x86-snapshot"; then
        log_warning "MicroOS snapshot already exists"
        read -p "Rebuild snapshot? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping snapshot build"
            return 0
        fi
    fi
    
    log_info "Initializing Packer..."
    packer init hcloud-microos-snapshots.pkr.hcl
    
    log_info "Building MicroOS x86 snapshot (this takes ~5 minutes)..."
    packer build hcloud-microos-snapshots.pkr.hcl
    
    log_success "MicroOS snapshot created"
    
    cd "$INFRA_DIR"
}

# Initialize Terraform
init_terraform() {
    log_step "Initializing Terraform"
    
    cd "$TERRAFORM_DIR"
    
    terraform init -upgrade
    
    log_success "Terraform initialized"
    
    cd "$INFRA_DIR"
}

# Plan infrastructure
plan_infrastructure() {
    log_step "Planning Infrastructure"
    
    cd "$TERRAFORM_DIR"
    
    terraform plan \
        -var="hcloud_token=$HCLOUD_TOKEN" \
        -out=tfplan
    
    log_success "Terraform plan created"
    
    cd "$INFRA_DIR"
}

# Apply infrastructure
apply_infrastructure() {
    log_step "Applying Infrastructure"
    
    cd "$TERRAFORM_DIR"
    
    echo ""
    log_warning "This will create real resources in Hetzner Cloud!"
    echo ""
    read -p "Continue with apply? (y/n) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Apply cancelled"
        exit 0
    fi
    
    terraform apply tfplan
    
    log_success "Infrastructure deployed"
    
    # Export kubeconfig
    log_info "Exporting kubeconfig..."
    terraform output -raw kubeconfig > "$INFRA_DIR/kubeconfig.yaml"
    chmod 600 "$INFRA_DIR/kubeconfig.yaml"
    
    export KUBECONFIG="$INFRA_DIR/kubeconfig.yaml"
    
    log_success "Kubeconfig saved to $INFRA_DIR/kubeconfig.yaml"
    
    cd "$INFRA_DIR"
}

# Wait for cluster to be ready
wait_for_cluster() {
    log_step "Waiting for Cluster"
    
    export KUBECONFIG="$INFRA_DIR/kubeconfig.yaml"
    
    log_info "Waiting for nodes to be ready..."
    local retries=30
    while [ $retries -gt 0 ]; do
        if kubectl get nodes &>/dev/null; then
            break
        fi
        echo -n "."
        sleep 10
        retries=$((retries - 1))
    done
    echo ""
    
    if [ $retries -eq 0 ]; then
        log_error "Timeout waiting for cluster"
        exit 1
    fi
    
    # Wait for all nodes
    kubectl wait --for=condition=Ready nodes --all --timeout=600s
    
    log_success "All nodes ready"
    kubectl get nodes
}

# Bootstrap FluxCD
bootstrap_flux() {
    log_step "Bootstrapping FluxCD"
    
    if [ -z "${GITHUB_TOKEN:-}" ]; then
        log_warning "GITHUB_TOKEN not set, skipping FluxCD bootstrap"
        log_info "Run manually later with: ./scripts/bootstrap-flux.sh"
        return 0
    fi
    
    export KUBECONFIG="$INFRA_DIR/kubeconfig.yaml"
    
    chmod +x "$SCRIPT_DIR/bootstrap-flux.sh"
    "$SCRIPT_DIR/bootstrap-flux.sh"
    
    log_success "FluxCD bootstrapped"
}

# Print summary
print_summary() {
    log_step "Deployment Summary"
    
    export KUBECONFIG="$INFRA_DIR/kubeconfig.yaml"
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║          🎉 INFRASTRUCTURE DEPLOYMENT COMPLETE! 🎉              ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    
    echo "📊 Cluster Status:"
    kubectl get nodes -o wide
    echo ""
    
    echo "📦 System Pods:"
    kubectl get pods -n kube-system | head -20
    echo ""
    
    cd "$TERRAFORM_DIR"
    local ingress_ip=$(terraform output -raw load_balancer_ipv4 2>/dev/null || echo "pending")
    cd "$INFRA_DIR"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 Ingress IP: $ingress_ip"
    echo "📁 Kubeconfig: $INFRA_DIR/kubeconfig.yaml"
    echo ""
    echo "To use kubectl:"
    echo "  export KUBECONFIG=$INFRA_DIR/kubeconfig.yaml"
    echo ""
    echo "Next steps:"
    echo "  1. Update DNS to point *.lum.tools to $ingress_ip"
    echo "  2. Bootstrap FluxCD (if not done): ./scripts/bootstrap-flux.sh"
    echo "  3. Deploy applications via GitOps"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main
main() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║         lum.tools GitOps Infrastructure Deployment               ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_env
    check_prerequisites
    build_snapshots
    init_terraform
    plan_infrastructure
    apply_infrastructure
    wait_for_cluster
    bootstrap_flux
    print_summary
}

# Parse arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    plan)
        check_env
        check_prerequisites
        init_terraform
        plan_infrastructure
        ;;
    apply)
        check_env
        apply_infrastructure
        wait_for_cluster
        ;;
    destroy)
        log_step "Destroying Infrastructure"
        cd "$TERRAFORM_DIR"
        terraform destroy -var="hcloud_token=$HCLOUD_TOKEN"
        ;;
    *)
        echo "Usage: $0 {deploy|plan|apply|destroy}"
        exit 1
        ;;
esac
