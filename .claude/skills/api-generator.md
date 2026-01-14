---
name: api-generator
description: Generates Next.js BFF API routes following Medihub patterns (withApi/guards/Zod/ok-fail).
---

# API Generator Skill

Medihub 표준에 맞게 BFF API Route(`app/src/app/api/**/route.ts`)를 생성합니다.

## Project-specific Rules (Fail-fast)

1. **Server Action 금지**: API는 route.ts로만 만듭니다.
2. **입력은 Zod로 파싱**: Query/Body 모두 `app/src/lib/schema/*.ts` 스키마로 `parse`.
3. **에러 처리 표준화**: `withApi` + `ApiError`(throw) + `ok/created/fail` 응답.
4. **권한 강제**: 필요하면 `withUser/withAuth/withRole/withApproved...`를 적용합니다.

## 파일 위치(권장)

```
app/src/app/api/<resource>/
├── route.ts                 # GET(목록), POST(생성)
└── [id]/
    └── route.ts             # GET(상세), PATCH(수정), DELETE(삭제)
```

## 템플릿

- 상세 템플릿: `.claude/reference/api-route-templates.md`
- API 패턴: `.claude/reference/api-patterns.md`

## 선행 조건(보통 함께 생성/수정)

- Zod 스키마: `app/src/lib/schema/<domain>.ts`
- (필요 시) server 모듈:
  - `app/src/server/<domain>/repository.ts`
  - `app/src/server/<domain>/mapper.ts`

## 후속 작업(필수)

```bash
cd app
pnpm lint
pnpm type-check
pnpm test
```

