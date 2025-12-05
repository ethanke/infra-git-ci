#!/bin/bash
# Quick script to set kubectl context for lum.tools cluster

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KUBECONFIG_PATH="$SCRIPT_DIR/../terraform/lum-gitops_kubeconfig.yaml"

if [ ! -f "$KUBECONFIG_PATH" ]; then
    echo "❌ Kubeconfig not found at: $KUBECONFIG_PATH"
    echo "Run 'terraform apply' first to generate it."
    exit 1
fi

export KUBECONFIG="$KUBECONFIG_PATH"

echo "✅ Kubectl context set to lum-gitops cluster"
echo "   KUBECONFIG=$KUBECONFIG"
echo ""
kubectl cluster-info
