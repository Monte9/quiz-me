#!/bin/bash
set -euo pipefail

# Cloud/web sessions start from a fresh clone with no node_modules. Install
# dependencies so the agent can build, run, and screenshot the app right away.
# Local sessions manage their own deps, so this is a no-op there.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-"$(dirname "$0")/../.."}"
pnpm install
