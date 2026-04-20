#!/usr/bin/env bash
set -euo pipefail

if ! command -v npx &>/dev/null; then
  echo "Error: npx not found. Install Node.js." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/load-aws-env.sh"

cd "$SCRIPT_DIR/../cdk"
exec npx cdk "$@"
