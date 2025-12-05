#!/bin/bash
set -e

echo "🚀 Deploying Gitea Git Service..."
echo "=================================================="
echo ""

# Change to Gitea k8s directory
cd "$(dirname "$0")"

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ Error: kubectl not found"
    echo "   Please install kubectl first"
    exit 1
fi

# Check kubeconfig
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
KUBECONFIG_PATH="$INFRA_DIR/kubeconfig.yaml"

if [ ! -f "$KUBECONFIG_PATH" ]; then
    echo "❌ Error: kubeconfig.yaml not found"
    echo "   Please ensure kubeconfig is available at $KUBECONFIG_PATH"
    exit 1
fi

export KUBECONFIG="$KUBECONFIG_PATH"

echo "✓ Kubectl configured"
echo ""

# Load environment variables
ENV_FILE="$INFRA_DIR/../.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
    echo "✓ Environment variables loaded"
else
    echo "⚠️  Warning: .env file not found at $ENV_FILE"
fi
echo ""

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml
echo "✓ Namespace created/verified"
echo ""

# Initialize database
echo "🗄️  Initializing Gitea database..."
kubectl apply -f ../postgres-init-gitea.yaml
echo "⏳ Waiting for database initialization..."
kubectl wait --for=condition=complete --timeout=120s job/gitea-init-db -n production-db || true
echo "✓ Database initialized"
echo ""

# Apply secrets
echo "🔐 Applying secrets..."
kubectl apply -f secrets.yaml
echo "✓ Secrets applied"
echo ""

# Apply ConfigMap
echo "⚙️  Applying configuration..."
kubectl apply -f configmap.yaml
echo "✓ Configuration applied"
echo ""

# Apply PVC
echo "💾 Applying persistent volume claim..."
kubectl apply -f pvc.yaml
echo "✓ PVC applied"
echo ""

# Apply deployment
echo "🚢 Applying deployment..."
kubectl apply -f deployment.yaml
echo "✓ Deployment applied"
echo ""

# Apply service
echo "🌐 Applying service..."
kubectl apply -f service.yaml
echo "✓ Service applied"
echo ""

# Apply ingress
echo "🌍 Applying ingress..."
kubectl apply -f ingress.yaml
echo "✓ Ingress applied"
echo ""

# Wait for rollout
echo "⏳ Waiting for Gitea to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/gitea -n gitea || {
    echo "⚠️  Warning: Deployment may still be starting"
    echo "   Check status with: kubectl get pods -n gitea"
}

echo ""
echo "=================================================="
echo "✅ Gitea deployment complete!"
echo "=================================================="
echo ""
echo "📍 Gitea URL: https://git.lum.tools"
echo ""
echo "🔑 Admin Credentials:"
echo "   Username: admin"
echo "   Password: ${GITEA_ADMIN_PASSWORD:-check .env file}"
echo "   Email: ${GITEA_ADMIN_EMAIL:-admin@lum.tools}"
echo ""
echo "📋 Next steps:"
echo "   1. Wait for certificate issuance (check with: kubectl get certificate -n gitea)"
echo "   2. Access https://git.lum.tools"
echo "   3. Complete initial setup wizard (if needed)"
echo "   4. Configure OAuth2 authentication:"
echo "      - Go to Site Administration > Authentication Sources"
echo "      - Add OAuth2 provider (Google)"
echo "      - Use OAuth credentials from Google Cloud Console"
echo "      - Redirect URI: https://git.lum.tools/user/oauth2/google/callback"
echo ""
echo "🔍 Check deployment status:"
echo "   kubectl get pods -n gitea"
echo "   kubectl logs -f deployment/gitea -n gitea"
echo ""

