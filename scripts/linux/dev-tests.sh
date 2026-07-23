#!/usr/bin/env bash
# Run the full pre-publish verification suite.
set -euo pipefail
cd "$(dirname "$0")/../.."

if [ ! -d node_modules ]; then
  echo "node_modules not found - running setup first..."
  bash "$(dirname "$0")/dev-setup.sh"
fi

run() {
  echo ""
  echo "=== $1 ==="
  shift
  "$@"
}

run "Type check"          npm run check
run "Unit tests"          npm run test:unit
run "Integration tests"   npm run test:integration
run "Production build"    npm run build

echo ""
echo "All checks passed. Safe to commit and push to main."
