#!/bin/bash
# .claude/hooks/post-lint-fix.sh
# PostToolUse: 파일 수정 후 eslint --fix (가능한 경우에만, 실패해도 차단하지 않음)

set -euo pipefail

INPUT="$(cat)"

# 파일 경로 추출
FILE_PATH="$(echo "$INPUT" | grep -o '\"file_path\":\"[^\"]*' | sed 's/\"file_path\":\"//' | head -1)"
if [ -z "${FILE_PATH:-}" ]; then
  FILE_PATH="$(echo "$INPUT" | grep -o '\"path\":\"[^\"]*' | sed 's/\"path\":\"//' | head -1)"
fi

if [ -z "${FILE_PATH:-}" ]; then
  exit 0
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "${REPO_ROOT:-}" ]; then
  exit 0
fi

ABS_PATH="$FILE_PATH"
if [[ "$ABS_PATH" != /* ]]; then
  ABS_PATH="$REPO_ROOT/$ABS_PATH"
fi

if [ ! -f "$ABS_PATH" ]; then
  exit 0
fi

REL_PATH="${ABS_PATH#"$REPO_ROOT"/}"

# app 하위 소스만 eslint 대상으로 처리
if [[ "$REL_PATH" != app/* ]]; then
  exit 0
fi

if [[ ! "$REL_PATH" =~ \.(ts|tsx|js|jsx|json)$ ]]; then
  exit 0
fi

REL_TO_APP="${REL_PATH#app/}"

(
  cd "$REPO_ROOT/app" || exit 0
  if command -v pnpm >/dev/null 2>&1; then
    pnpm lint --fix "$REL_TO_APP" >/dev/null 2>&1 || true
  fi
)

exit 0

