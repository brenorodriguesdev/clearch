#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILE="${AWS_PROFILE:-default}"
ENV_FILE="$SCRIPT_DIR/../.aws-runtime.env"

if ! command -v aws &>/dev/null; then
  echo "Error: AWS CLI not found. Install at https://aws.amazon.com/cli/" >&2
  exit 1
fi

echo "[aws:login] Using profile: $PROFILE"
aws login --profile "$PROFILE"

echo "[aws:login] Exporting credentials..."
aws configure export-credentials --profile "$PROFILE" --format env > "$ENV_FILE"
printf '\nexport AWS_PROFILE=%s\n' "$PROFILE" >> "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo "[aws:login] Validating..."
if aws sts get-caller-identity --profile "$PROFILE" > /dev/null 2>&1; then
  echo "[aws:login] Success. Credentials saved to infra/.aws-runtime.env"
else
  echo "[aws:login] Error: credential validation failed" >&2
  rm -f "$ENV_FILE"
  exit 1
fi
