#!/usr/bin/env bash
# Install dependencies and verify the local toolchain.
set -euo pipefail
cd "$(dirname "$0")/../.."

command -v node >/dev/null || { echo "Node.js is required."; exit 1; }
command -v npm  >/dev/null || { echo "npm is required."; exit 1; }

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node.js 20+ is required. CI uses Node 22."
  exit 1
fi

echo "Node $(node -p "process.versions.node") detected."
echo "Installing dependencies..."
npm install

echo "Verifying toolchain (astro check)..."
npm run check

echo ""
echo "Setup complete."
echo "Next: ./scripts/linux/dev-tests.sh"
