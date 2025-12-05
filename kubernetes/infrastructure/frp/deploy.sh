#!/bin/bash
set -e

# Deploy FRP server with authentication plugin to Kubernetes

echo "🚀 Deploying FRP Server with Platform Integration"
echo "=================================================="
echo ""

# Change to FRP k8s directory
cd "$(dirname "$0")"

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ Error: kubectl not found"
    echo "   Please install kubectl first"
    exit 1
fi

# Check kubeconfig
if [ ! -f "../../kubeconfig.yaml" ]; then
    echo "❌ Error: kubeconfig.yaml not found"
    echo "   Please ensure kubeconfig is available at infra/kubeconfig.yaml"
    exit 1
fi

export KUBECONFIG="../../kubeconfig.yaml"

echo "✓ Kubectl configured"
echo ""

# Check if plugin image exists
echo "🔍 Checking plugin image..."
PLUGIN_IMAGE="registry.lum.tools/frp-auth-plugin:latest"

if ! docker images | grep -q "frp-auth-plugin"; then
    echo "⚠️  Warning: Plugin image not found locally"
    echo "   Building plugin..."
    cd ../../frp-plugin
    ./build.sh latest
    cd ../k8s/frp
fi

echo "✓ Plugin image ready"
echo ""

# Create namespace if it doesn't exist
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

echo "✓ Namespace created/verified"
echo ""

# Apply secrets
echo "🔐 Applying secrets..."
kubectl apply -f secrets.yaml
kubectl apply -f plugin-secrets.yaml

echo "✓ Secrets applied"
echo ""

# Apply configuration
echo "⚙️  Applying configuration..."
kubectl apply -f configmap.yaml

echo "✓ Configuration applied"
echo ""

# Apply service
echo "🌐 Applying service..."
kubectl apply -f service.yaml

echo "✓ Service applied"
echo ""

# Apply deployment
echo "🚢 Applying deployment..."
kubectl apply -f deployment.yaml

echo "✓ Deployment applied"
echo ""

# Wait for rollout
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/frps-deployment -n frp --timeout=5m

echo "✓ Rollout complete"
echo ""

# Apply ingress
echo "🌍 Applying ingress..."
kubectl apply -f middleware.yaml
kubectl apply -f ingress.yaml

echo "✓ Ingress configured"
echo ""

# Get deployment status
echo "=================================================="
echo "📊 Deployment Status"
echo "=================================================="
echo ""

kubectl get pods -n frp
echo ""

kubectl get svc -n frp
echo ""

kubectl get ingress -n frp
echo ""

echo "=================================================="
echo "✅ Deployment Complete!"
echo "=================================================="
echo ""
echo "🔗 FRP Server: frp.lum.tools:7000"
echo "📊 Dashboard: https://frp.lum.tools (admin/frp-dashboard-secure-2025)"
echo "🌐 Tunnels: *.t.lum.tools"
echo ""
echo "📝 Next Steps:"
echo "   1. Test authentication with platform API key"
echo "   2. Create a test tunnel: python3 tunnel_client.py --port 8000"
echo "   3. Monitor logs: kubectl logs -n frp -l app=frps -c frp-auth-plugin -f"
echo ""
echo "🐛 Troubleshooting:"
echo "   kubectl describe pods -n frp"
echo "   kubectl logs -n frp deployment/frps-deployment -c frps"
echo "   kubectl logs -n frp deployment/frps-deployment -c frp-auth-plugin"
echo ""
