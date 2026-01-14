---
name: db-migration
description: Generates Supabase SQL migrations (schema + RLS/policies) following Medihub conventions.
---

# DB Migration Skill (Supabase)

Supabase SQL 마이그레이션을 프로젝트 표준에 맞게 작성합니다.

## Project-specific Rules

### 위치

- `app/supabase/migrations/*.sql`

### 생성

```bash
cd app
pnpm db:new -- \"<name>\"
```

### 불변 규칙

1. **기존 마이그레이션 수정 금지**: 정정이 필요하면 새 마이그레이션으로 처리합니다.
2. **RLS는 기본값**: 테이블 추가/변경 시 RLS/Policy 영향까지 함께 고려합니다.

## Templates

- `.claude/reference/db-migration-templates.md`
- `.claude/reference/supabase-patterns.md`

## 후속 작업

```bash
cd app
pnpm db:migrate
pnpm db:gen -- --local   # 로컬 기준 타입 재생성(필요 시)
pnpm type-check
```

