#!/bin/bash
set -e

export KUBECONFIG="$(cd "$(dirname "$0")/../../.." && pwd)/kubeconfig.yaml"

echo "🔍 Verifying Gitea Deployment"
echo "=================================================="
echo ""

echo "1. Checking namespace..."
kubectl get namespace gitea || echo "❌ Namespace not found"
echo ""

echo "2. Checking pods..."
kubectl get pods -n gitea
echo ""

echo "3. Checking deployment..."
kubectl get deployment -n gitea
echo ""

echo "4. Checking service..."
kubectl get svc -n gitea
echo ""

echo "5. Checking ingress..."
kubectl get ingress -n gitea
echo ""

echo "6. Checking pod logs (last 20 lines)..."
POD=$(kubectl get pods -n gitea -l app=gitea -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$POD" ]; then
    kubectl logs -n gitea "$POD" --tail=20
else
    echo "❌ No pod found"
fi
echo ""

echo "7. Checking certificate..."
kubectl get certificate -n gitea
echo ""

echo "8. Testing service endpoint..."
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- curl -I http://gitea-service.gitea.svc.cluster.local:3000 2>/dev/null || echo "❌ Service not reachable"
echo ""

echo "=================================================="
echo "Verification complete!"

