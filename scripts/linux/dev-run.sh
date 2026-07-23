#!/usr/bin/env bash
# Start the Astro dev server at http://localhost:4321
set -euo pipefail
cd "$(dirname "$0")/../.."

if [ ! -d node_modules ]; then
  echo "node_modules not found - running setup first..."
  bash "$(dirname "$0")/dev-setup.sh"
fi

echo "Starting dev server at http://localhost:4321"
echo "Press Ctrl+C to stop."
npm run dev
