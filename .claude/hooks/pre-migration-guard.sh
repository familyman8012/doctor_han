#!/bin/bash
# .claude/hooks/pre-migration-guard.sh
# PreToolUse: 불가역/생성 파일 보호 (마이그레이션/생성문서/생성 타입)

set -euo pipefail

INPUT="$(cat)"

# 파일 경로 추출
FILE_PATH="$(echo "$INPUT" | grep -o '\"file_path\":\"[^\"]*' | sed 's/\"file_path\":\"//' | head -1)"
if [ -z "${FILE_PATH:-}" ]; then
  FILE_PATH="$(echo "$INPUT" | grep -o '\"path\":\"[^\"]*' | sed 's/\"path\":\"//' | head -1)"
fi

# 툴 이름 추출 (Edit|MultiEdit|Write 등)
TOOL_NAME="$(echo "$INPUT" | grep -o '\"tool_name\":\"[^\"]*' | sed 's/\"tool_name\":\"//' | head -1)"

if [ -z "${FILE_PATH:-}" ]; then
  exit 0
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "${REPO_ROOT:-}" ]; then
  exit 0
fi

# 절대경로 → 레포 상대경로 정규화
ABS_PATH="$FILE_PATH"
if [[ "$ABS_PATH" != /* ]]; then
  ABS_PATH="$REPO_ROOT/$ABS_PATH"
fi

REL_PATH="${ABS_PATH#"$REPO_ROOT"/}"

# 보호 대상 경로들
MIGRATIONS_DIR="app/supabase/migrations"
GENERATED_DIR=".claude/reference/_generated"
GENERATED_TYPES_FILE="app/src/lib/database.types.ts"

is_tracked_in_head() {
  local rel="$1"
  git cat-file -e "HEAD:$rel" 2>/dev/null
}

block() {
  local msg="$1"
  echo "❌ $msg" >&2
  exit 2
}

# 1) 커밋된(HEAD) 마이그레이션 수정 차단
if [[ "$REL_PATH" == "$MIGRATIONS_DIR/"* ]]; then
  if [[ "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "MultiEdit" || "$TOOL_NAME" == "Write" ]]; then
    if is_tracked_in_head "$REL_PATH"; then
      block "마이그레이션 보호: 커밋된 마이그레이션 파일은 수정할 수 없습니다. 새 마이그레이션을 생성하세요: /new-migration <description>"
    fi
  fi
fi

# 2) 생성 문서(_generated) 직접 편집 차단 (항상)
if [[ "$REL_PATH" == "$GENERATED_DIR/"* ]]; then
  if [[ "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "MultiEdit" || "$TOOL_NAME" == "Write" ]]; then
    block "생성 문서 보호: `_generated`는 직접 편집하지 않습니다. 필요하면 `.claude/scripts/refresh.py` 또는 템플릿을 수정하세요."
  fi
fi

# 3) Supabase 타입 파일 직접 편집 차단 (항상)
if [[ "$REL_PATH" == "$GENERATED_TYPES_FILE" ]]; then
  if [[ "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "MultiEdit" || "$TOOL_NAME" == "Write" ]]; then
    block "생성 타입 보호: `database.types.ts`는 `cd app && pnpm db:gen -- --local`로만 갱신합니다."
  fi
fi

exit 0

