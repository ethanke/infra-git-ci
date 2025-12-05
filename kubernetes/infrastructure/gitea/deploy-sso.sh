#!/bin/bash
set -euo pipefail

echo "🔐 Deploying Gitea SSO Integration"
echo "===================================="
echo ""

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Deploying Platform Service with ForwardAuth endpoint${NC}"
echo "This adds the /internal/auth/verify endpoint for SSO"
cd /home/ethan/Work/lum.tools/services/platform
./deploy.sh
echo -e "${GREEN}✓ Platform service deployed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Applying Gitea Traefik ForwardAuth Middleware${NC}"
kubectl apply -f /home/ethan/Work/lum.tools/infra/k8s/gitea/middleware.yaml
echo -e "${GREEN}✓ ForwardAuth middleware created${NC}"
echo ""

echo -e "${YELLOW}Step 3: Applying Gitea Configuration (Reverse Proxy Auth)${NC}"
kubectl apply -f /home/ethan/Work/lum.tools/infra/k8s/gitea/configmap.yaml
echo -e "${GREEN}✓ Gitea config updated${NC}"
echo ""

echo -e "${YELLOW}Step 4: Applying Gitea Ingress (with middleware)${NC}"
kubectl apply -f /home/ethan/Work/lum.tools/infra/k8s/gitea/ingress.yaml
echo -e "${GREEN}✓ Gitea ingress updated${NC}"
echo ""

echo -e "${YELLOW}Step 5: Restarting Gitea to pick up new configuration${NC}"
kubectl rollout restart deployment/gitea -n gitea
echo "Waiting for Gitea to be ready..."
kubectl rollout status deployment/gitea -n gitea --timeout=120s
echo -e "${GREEN}✓ Gitea restarted${NC}"
echo ""

echo -e "${GREEN}✅ Gitea SSO Integration Deployed Successfully!${NC}"
echo ""
echo "🧪 Testing the integration:"
echo "  1. Visit https://git.lum.tools"
echo "  2. You should be redirected to platform.lum.tools/auth/login"
echo "  3. After login, you'll be redirected back to Gitea"
echo "  4. Your account will be auto-created in Gitea"
echo ""
echo "📝 Note: If you have an old session cookie scoped to platform.lum.tools,"
echo "   it will be automatically upgraded to .lum.tools on your next request."
echo ""
echo "🔍 Verify ForwardAuth is working:"
echo "  kubectl logs -n gitea deployment/gitea --tail=50 | grep -i auth"
echo ""
echo "📚 See GITEA_SSO_INTEGRATION_GUIDE.md for troubleshooting and details"
