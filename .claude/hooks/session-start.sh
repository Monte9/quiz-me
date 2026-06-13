#!/bin/bash
set -euo pipefail

# Async mode: install runs in the background so the session is promptable
# right away. This line must be the first stdout; asyncTimeout is in ms (5 min).
echo '{"async": true, "asyncTimeout": 300000}'

# Cloud/web sessions start from a fresh clone with no node_modules. Install
# dependencies so the agent can build, run, and screenshot the app. Local
# sessions manage their own deps, so this is a no-op there.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-"$(dirname "$0")/../.."}"
pnpm install
