#!/bin/bash
set -euo pipefail

echo "🔍 Verifying Gitea SSO Integration Configuration"
echo "================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check 1: ForwardAuth middleware exists
echo -n "Checking ForwardAuth middleware... "
if kubectl get middleware gitea-auth -n gitea &>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Ingress has middleware annotation
echo -n "Checking ingress middleware annotation... "
if kubectl get ingress gitea-ingress -n gitea -o yaml | grep -q "gitea-gitea-auth@kubernetescrd"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: Gitea configmap has reverse proxy auth enabled
echo -n "Checking Gitea reverse proxy auth config... "
if kubectl get configmap gitea-config -n gitea -o yaml | grep -q "ENABLE_REVERSE_PROXY_AUTHENTICATION = true"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Not enabled${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: Platform service is running
echo -n "Checking platform service... "
if kubectl get deployment platform -n platform &>/dev/null; then
    READY=$(kubectl get deployment platform -n platform -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    if [ "$READY" -gt 0 ]; then
        echo -e "${GREEN}✓ ($READY replicas)${NC}"
    else
        echo -e "${RED}✗ Not ready${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ Not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Gitea deployment is running
echo -n "Checking Gitea deployment... "
if kubectl get deployment gitea -n gitea &>/dev/null; then
    READY=$(kubectl get deployment gitea -n gitea -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    if [ "$READY" -gt 0 ]; then
        echo -e "${GREEN}✓ ($READY replicas)${NC}"
    else
        echo -e "${RED}✗ Not ready${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ Not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: Test platform ForwardAuth endpoint (internal)
echo -n "Checking platform /internal/auth/verify endpoint... "
if kubectl run test-curl --rm -i --restart=Never --image=curlimages/curl:latest -- \
    curl -s -o /dev/null -w "%{http_code}" \
    http://platform-service.platform.svc.cluster.local:80/internal/auth/verify 2>/dev/null | grep -q "302\|401"; then
    echo -e "${GREEN}✓ (responds)${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "================================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "🎉 Gitea SSO integration is properly configured."
    echo ""
    echo "Next steps:"
    echo "  1. Visit https://git.lum.tools in your browser"
    echo "  2. You should be redirected to platform.lum.tools/auth/login"
    echo "  3. After login, you'll be auto-logged into Gitea"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS check(s) failed!${NC}"
    echo ""
    echo "Please run the deployment script:"
    echo "  cd /home/ethan/Work/lum.tools/infra/k8s/gitea"
    echo "  ./deploy-sso.sh"
    echo ""
    exit 1
fi
