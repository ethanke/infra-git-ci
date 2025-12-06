#!/usr/bin/env bash
set -euo pipefail

SERVICE="blog-next"
ENVIRONMENT="prod"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../.. && pwd)"
KUBECONFIG_DEFAULT="$ROOT_DIR/infra/kubeconfig.yaml"
export KUBECONFIG="${KUBECONFIG:-$KUBECONFIG_DEFAULT}"
export SERVICE_PATH="services/$SERVICE"
export DOCKERFILE_PATH="$SERVICE_PATH/Dockerfile"

exec "$ROOT_DIR/scripts/build-system/fast-deploy.sh" "$SERVICE" "$ENVIRONMENT"
