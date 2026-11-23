#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh
npm --prefix "$UI_DIR" ci --include=dev --cache "$HOME/.npm"
if [[ -n $NPM_SETUP_SCRIPT ]]; then
  npm --prefix "$UI_DIR" run "$NPM_SETUP_SCRIPT"
fi
