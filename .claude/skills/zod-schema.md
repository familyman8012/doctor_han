---
name: zod-schema
description: Generates Zod schemas (DTO/Query/Response) following Medihub conventions.
---

# Zod Schema Skill

Medihub 도메인에 맞는 Zod 스키마를 프로젝트 표준에 맞게 생성합니다.

## Project-specific Rules

### 파일 위치(기본)

```
app/src/lib/schema/<domain>.ts
app/src/lib/schema/common.ts
```

### 필수 규칙

1. **입력 스키마는 `.strict()`** (예상치 못한 필드 차단)
2. **공통 스키마 재사용** (`zUuid`, `zPaginationQuery`, `zNonEmptyString`)
3. **Response 포맷 통일** (`code/data/message`)

## Templates

- `.claude/reference/zod-patterns.md`
- `.claude/reference/zod-schema-templates.md`

## 후속 작업

```bash
cd app
pnpm type-check
```

