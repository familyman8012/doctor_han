#!/bin/bash
# .claude/hooks/pre-migration-guard.sh
# PreToolUse: 기존 마이그레이션 파일 수정 차단

INPUT=$(cat)

# 파일 경로 추출
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path":"[^"]*' | sed 's/"file_path":"//' | head -1)
if [ -z "$FILE_PATH" ]; then
    FILE_PATH=$(echo "$INPUT" | grep -o '"path":"[^"]*' | sed 's/"path":"//' | head -1)
fi

# 툴 이름 추출
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name":"[^"]*' | sed 's/"tool_name":"//' | head -1)

# 마이그레이션 폴더 경로
MIGRATION_DIR="app/supabase/migrations"

# 마이그레이션 파일 수정 시도 감지
if [[ "$FILE_PATH" == *"$MIGRATION_DIR"* ]]; then
    # Edit, MultiEdit 도구로 기존 파일 수정 시도 시 차단
    if [[ "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "MultiEdit" || "$TOOL_NAME" == "Write" ]]; then
        # 파일이 이미 존재하는지 확인 (기존 파일 수정인 경우)
        if [ -f "$FILE_PATH" ]; then
            echo "❌ 마이그레이션 보호: 기존 마이그레이션 파일은 수정할 수 없습니다." >&2
            echo "💡 새 마이그레이션 파일을 생성하세요: \`cd app && pnpm db:new -- \"<name>\" \` (또는 \`/new-migration <name>\`)" >&2
            exit 2  # 차단
        fi
    fi
fi

# 통과
exit 0
