#!/bin/bash

# Script to ensure database connection is available
# This script will kill any existing port-forward and create a new one

set -e

KUBECONFIG="/home/ethan/Work/lum.tools/infra/kubeconfig.yaml"
NAMESPACE="production-db"
POD_NAME="postgres-0"
LOCAL_PORT="5434"
REMOTE_PORT="5432"

echo "🔍 Checking for existing port-forward processes..."
pkill -f "kubectl port-forward.*${LOCAL_PORT}" || echo "No existing port-forward on port ${LOCAL_PORT}"

echo "⏳ Waiting for processes to terminate..."
sleep 2

echo "🚀 Starting new port-forward..."
kubectl port-forward ${POD_NAME} -n ${NAMESPACE} --kubeconfig=${KUBECONFIG} ${LOCAL_PORT}:${REMOTE_PORT} &
PORT_FORWARD_PID=$!

echo "⏳ Waiting for port-forward to establish..."
sleep 3

echo "🧪 Testing database connection..."
if psql "postgresql://postgres:91d34dc4f4ca1a89e3e3a098553aca88e10f3eb6e90cb49ff71da2cce609dfc@localhost:${LOCAL_PORT}/blog_next?sslmode=disable" -c "SELECT 'Database connection successful!' as status;" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
    echo "📊 Port-forward PID: ${PORT_FORWARD_PID}"
    echo "🔗 Connection string: postgresql://postgres:***@localhost:${LOCAL_PORT}/blog_next?sslmode=disable"
    echo ""
    echo "To stop the port-forward, run: kill ${PORT_FORWARD_PID}"
else
    echo "❌ Database connection failed!"
    kill ${PORT_FORWARD_PID} 2>/dev/null || true
    exit 1
fi
