#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh
npm --prefix "$UI_DIR" run "$NPM_TEST_SCRIPT"
