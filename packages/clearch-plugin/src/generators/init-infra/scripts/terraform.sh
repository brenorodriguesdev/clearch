#!/usr/bin/env bash
set -euo pipefail

if ! command -v terraform &>/dev/null; then
  echo "Error: terraform not found. Install at https://developer.hashicorp.com/terraform/install" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/load-aws-env.sh"

cd "$SCRIPT_DIR/../terraform"
exec terraform "$@"
