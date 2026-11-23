#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh
if [[ ${TEST_INCLUDES_BUILD:-false} == true && ${GATE_TESTS_PASSED:-false} == true ]]; then
  test -d "$BUILD_OUTPUT_DIR" || { echo "Test claimed a build but output is missing: $BUILD_OUTPUT_DIR" >&2; exit 1; }
  echo 'Build covered by the successful test stage.'
else
  npm --prefix "$UI_DIR" run "$NPM_DEV_BUILD_SCRIPT"
fi
