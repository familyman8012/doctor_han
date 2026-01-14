#!/bin/bash
# .claude/hooks/post-lint-fix.sh
# PostToolUse: 파일 수정 후 자동 lint:fix

INPUT=$(cat)

# 파일 경로 추출
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path":"[^"]*' | sed 's/"file_path":"//' | head -1)
if [ -z "$FILE_PATH" ]; then
    FILE_PATH=$(echo "$INPUT" | grep -o '"path":"[^"]*' | sed 's/"path":"//' | head -1)
fi

# 파일이 없거나 lint 대상이 아니면 스킵
if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
    exit 0
fi

# repo root(= .claude/..)
ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
APP_DIR="$ROOT_DIR/app"

# app/ 밖 파일은 lint-fix 대상이 아님
ABS_PATH="$FILE_PATH"
if [[ "$ABS_PATH" != /* ]]; then
    ABS_PATH="$ROOT_DIR/$FILE_PATH"
fi

case "$ABS_PATH" in
    "$APP_DIR"/*) ;;
    *) exit 0 ;;
esac

# lint 대상 확장자 체크
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx|json)$ ]]; then
    # ESLint fix 실행 (조용히, 실패해도 통과)
    if command -v pnpm &> /dev/null; then
        REL_PATH="${ABS_PATH#"$APP_DIR/"}"
        (cd "$APP_DIR" && pnpm lint -- --fix "$REL_PATH" >/dev/null 2>&1) || true
    fi
fi

# 항상 통과 (lint 실패해도 차단하지 않음)
exit 0
