#!/usr/bin/env bash
# check-openapi-sync.sh — verifies that openapi.json and generated frontend types are up to date.
#
# Usage:
#   bash backend/scripts/check-openapi-sync.sh
#   (or via: cd backend && bun openapi:check)
#
# CI / pre-commit: exit 1 if drift is detected; exit 0 if everything is in sync.
#
# NOTE: If frontend/app/common/types/api.gen.ts does not exist (it was deleted as
# part of fix 3.3 option-b), the gen:types step is skipped and only openapi.json
# drift is checked. Adjust once the frontend type strategy is finalised.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "Regenerating openapi.json..."
bun run openapi:dump

GEN_TYPES_FILE="../frontend/app/common/types/api.gen.ts"

if [ -f "$GEN_TYPES_FILE" ]; then
  echo "Regenerating frontend types (api.gen.ts)..."
  cd ../frontend
  bun run gen:types
  cd ../backend
else
  echo "Skipping gen:types — $GEN_TYPES_FILE does not exist (fix 3.3 option-b applied)."
fi

DRIFT_PATHS="backend/openapi.json"
if [ -f "$GEN_TYPES_FILE" ]; then
  DRIFT_PATHS="$DRIFT_PATHS frontend/app/common/types/api.gen.ts"
fi

cd ..
if ! git diff --quiet -- $DRIFT_PATHS; then
  echo "❌ OpenAPI drift detected. Run 'bun openapi:dump' in backend and (if applicable) 'bun gen:types' in frontend, then commit." >&2
  git diff --stat -- $DRIFT_PATHS >&2
  exit 1
fi

echo "✅ OpenAPI in sync."
