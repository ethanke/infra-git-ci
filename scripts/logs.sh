#!/bin/bash
# Tail logs for a service across all pods

if [ -z "$1" ]; then
    echo "Usage: $0 <service-name> [namespace]"
    echo ""
    echo "Examples:"
    echo "  $0 postgres production-db"
    echo "  $0 frps frp"
    echo "  $0 gitea"
    exit 1
fi

SERVICE="$1"
NAMESPACE="${2:-default}"

echo "📋 Tailing logs for service: $SERVICE in namespace: $NAMESPACE"
echo ""

kubectl logs -f -l app=$SERVICE -n $NAMESPACE --all-containers --prefix=true
