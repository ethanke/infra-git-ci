#!/bin/bash
# =============================================================================
# Service Scaffolding Script
# Creates a new service from a template with all configurations in place
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$INFRA_DIR/.." && pwd)"
TEMPLATES_DIR="$INFRA_DIR/templates"

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

usage() {
    cat << EOF
Usage: $(basename "$0") <service-name> [options]

Create a new service from a template.

Arguments:
  service-name    Name of the service (lowercase, alphanumeric with dashes)

Options:
  -t, --type      Template type: python-fastapi, nextjs, generic (default: python-fastapi)
  -d, --domain    Domain for the service (default: <service-name>.lum.tools)
  -o, --output    Output directory (default: ../services/<service-name>)
  --apps-only     Only create kubernetes/apps entry, skip services directory
  -h, --help      Show this help message

Examples:
  $(basename "$0") my-api --type python-fastapi --domain api.lum.tools
  $(basename "$0") my-frontend --type nextjs
  $(basename "$0") my-worker --type generic --apps-only

EOF
}

# Parse arguments
SERVICE_NAME=""
TEMPLATE_TYPE="python-fastapi"
DOMAIN=""
OUTPUT_DIR=""
APPS_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TEMPLATE_TYPE="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --apps-only)
            APPS_ONLY=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
        *)
            if [ -z "$SERVICE_NAME" ]; then
                SERVICE_NAME="$1"
            else
                log_error "Unexpected argument: $1"
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate service name
if [ -z "$SERVICE_NAME" ]; then
    log_error "Service name is required"
    usage
    exit 1
fi

if ! [[ "$SERVICE_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
    log_error "Service name must start with a letter and contain only lowercase letters, numbers, and dashes"
    exit 1
fi

# Set defaults
if [ -z "$DOMAIN" ]; then
    DOMAIN="${SERVICE_NAME}.lum.tools"
fi

if [ -z "$OUTPUT_DIR" ]; then
    OUTPUT_DIR="$REPO_ROOT/services/$SERVICE_NAME"
fi

# Validate template exists
TEMPLATE_DIR="$TEMPLATES_DIR/$TEMPLATE_TYPE"
if [ ! -d "$TEMPLATE_DIR" ]; then
    log_error "Template '$TEMPLATE_TYPE' not found in $TEMPLATES_DIR"
    echo "Available templates:"
    ls -1 "$TEMPLATES_DIR" | grep -v README
    exit 1
fi

log_step "Creating Service: $SERVICE_NAME"

log_info "Template:    $TEMPLATE_TYPE"
log_info "Domain:      $DOMAIN"
log_info "Output:      $OUTPUT_DIR"
log_info "Apps Only:   $APPS_ONLY"

# Check if service already exists
if [ -d "$OUTPUT_DIR" ] && [ "$APPS_ONLY" = false ]; then
    log_error "Service directory already exists: $OUTPUT_DIR"
    exit 1
fi

# Function to replace placeholders
replace_placeholders() {
    local file="$1"
    sed -i "s/{{SERVICE_NAME}}/$SERVICE_NAME/g" "$file"
    sed -i "s/{{DOMAIN}}/$DOMAIN/g" "$file"
}

# Copy template to output directory
if [ "$APPS_ONLY" = false ]; then
    log_step "Copying Template"
    
    mkdir -p "$OUTPUT_DIR"
    cp -r "$TEMPLATE_DIR"/* "$OUTPUT_DIR/"
    
    # Replace placeholders in all files
    find "$OUTPUT_DIR" -type f \( -name "*.yaml" -o -name "*.yml" -o -name "*.json" -o -name "*.md" -o -name "*.example" -o -name "Dockerfile" \) | while read -r file; do
        replace_placeholders "$file"
        log_info "Processed: $(basename "$file")"
    done
    
    log_success "Template copied to $OUTPUT_DIR"
fi

# Create kubernetes/apps entry
log_step "Creating Kubernetes Apps Entry"

APPS_DIR="$INFRA_DIR/kubernetes/apps/$SERVICE_NAME"
mkdir -p "$APPS_DIR"

# Create kustomization for FluxCD
cat > "$APPS_DIR/kustomization.yaml" << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: $SERVICE_NAME

resources:
  - namespace.yaml
  # Uncomment below to use the service's k8s manifests
  # - ../../../services/$SERVICE_NAME/k8s/overlays/prod

commonLabels:
  app.kubernetes.io/name: $SERVICE_NAME
  app.kubernetes.io/managed-by: flux
EOF

# Create namespace
cat > "$APPS_DIR/namespace.yaml" << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: $SERVICE_NAME
  labels:
    lum.tools/service: "$SERVICE_NAME"
EOF

log_success "Created kubernetes/apps/$SERVICE_NAME/"

# Update main apps kustomization
log_step "Updating Apps Kustomization"

APPS_KUSTOMIZATION="$INFRA_DIR/kubernetes/apps/kustomization.yaml"

if [ -f "$APPS_KUSTOMIZATION" ]; then
    # Check if service is already in kustomization
    if ! grep -q "  - $SERVICE_NAME" "$APPS_KUSTOMIZATION"; then
        # Add the service to resources
        sed -i "/^resources:/a\\  - $SERVICE_NAME/" "$APPS_KUSTOMIZATION"
        log_success "Added $SERVICE_NAME to kubernetes/apps/kustomization.yaml"
    else
        log_warning "$SERVICE_NAME already in kubernetes/apps/kustomization.yaml"
    fi
else
    log_warning "kubernetes/apps/kustomization.yaml not found, skipping"
fi

# Create optional secrets placeholder
log_step "Creating Secrets Placeholder"

SECRETS_FILE="$APPS_DIR/$SERVICE_NAME-secrets.yaml"
cat > "$SECRETS_FILE" << EOF
# SOPS-encrypted secrets for $SERVICE_NAME
# Encrypt with: sops -e $SERVICE_NAME-secrets.yaml > $SERVICE_NAME-secrets.enc.yaml
# Then delete this unencrypted file!
apiVersion: v1
kind: Secret
metadata:
  name: $SERVICE_NAME-secrets
  namespace: $SERVICE_NAME
type: Opaque
stringData:
  # Add your secrets here
  # API_KEY: "your-api-key"
  # DATABASE_URL: "postgresql://..."
EOF

log_warning "Created $SECRETS_FILE - Remember to encrypt with SOPS!"

# Summary
log_step "Summary"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║              🎉 SERVICE CREATED SUCCESSFULLY! 🎉                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📁 Files created:"
if [ "$APPS_ONLY" = false ]; then
    echo "   - $OUTPUT_DIR/ (service code)"
fi
echo "   - $APPS_DIR/ (kubernetes manifests)"
echo ""
echo "🚀 Next steps:"
echo ""
echo "   1. Review and customize the generated files"
echo ""
if [ "$APPS_ONLY" = false ]; then
    echo "   2. Add your application code to $OUTPUT_DIR"
    echo ""
fi
echo "   3. Encrypt secrets with SOPS:"
echo "      cd $APPS_DIR"
echo "      sops -e $SERVICE_NAME-secrets.yaml > $SERVICE_NAME-secrets.enc.yaml"
echo "      rm $SERVICE_NAME-secrets.yaml"
echo ""
echo "   4. Build and deploy:"
echo "      ./scripts/build-system/fast-deploy.sh $SERVICE_NAME"
echo ""
echo "   5. Or let FluxCD handle deployment via GitOps"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
