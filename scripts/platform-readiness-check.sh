#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "[check] lint"
npm run lint

echo "[check] typecheck"
npm run typecheck

echo "[check] no native <select> in modules"
if rg -nP "(?-i)<select(\s|>)" src/modules >/tmp/platform_select_check.out; then
  echo "Fail: found native <select> in src/modules"
  cat /tmp/platform_select_check.out
  exit 1
fi

echo "Platform readiness checks OK"
