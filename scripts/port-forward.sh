#!/bin/bash
# Port-forward to a service for local development

if [ -z "$1" ]; then
    echo "Usage: $0 <service> [namespace] [local-port:remote-port]"
    echo ""
    echo "Examples:"
    echo "  $0 postgres production-db 5432:5432"
    echo "  $0 redis production-db 6379:6379"
    echo "  $0 gitea gitea 3000:3000"
    echo "  $0 frps frp 7000:7000"
    exit 1
fi

SERVICE="$1"
NAMESPACE="${2:-default}"
PORTS="${3:-8080:80}"

echo "🔌 Port forwarding: localhost:${PORTS%:*} -> $SERVICE:${PORTS#*:} (namespace: $NAMESPACE)"
echo ""

kubectl port-forward -n $NAMESPACE svc/$SERVICE $PORTS
