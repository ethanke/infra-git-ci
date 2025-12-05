#!/bin/bash
# Helper script to populate porkbun credentials from old infra

set -e

OLD_SECRET="/home/ethan/Work/lum.tools/infra/k8s/porkbun-dns-credentials.yaml"
NEW_SECRET="/home/ethan/Work/lum.tools/infra-git-ci/kubernetes/infrastructure/external-dns/porkbun-credentials-secret.yaml"

if [ ! -f "$OLD_SECRET" ]; then
    echo "❌ Old secret not found at: $OLD_SECRET"
    exit 1
fi

echo "📋 Extracting Porkbun credentials from old infra..."

# Extract base64-encoded values
API_KEY=$(yq -r '.data.PORKBUN_API_KEY' "$OLD_SECRET")
SECRET_API_KEY=$(yq -r '.data.PORKBUN_SECRET_API_KEY' "$OLD_SECRET")

# Decode base64
API_KEY_DECODED=$(echo "$API_KEY" | base64 -d)
SECRET_API_KEY_DECODED=$(echo "$SECRET_API_KEY" | base64 -d)

# Update new secret file
cat > "$NEW_SECRET" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: porkbun-credentials
  namespace: external-dns
type: Opaque
stringData:
  api-key: "$API_KEY_DECODED"
  secret-api-key: "$SECRET_API_KEY_DECODED"
EOF

echo "✅ Credentials populated in: $NEW_SECRET"
echo ""
echo "⚠️  IMPORTANT: Encrypt this secret with SOPS before committing:"
echo "   sops -e $NEW_SECRET > ${NEW_SECRET%.yaml}.enc.yaml"
echo ""
echo "🔒 Then delete the unencrypted file and update kustomization.yaml"
