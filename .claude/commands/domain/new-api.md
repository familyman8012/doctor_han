---
description: API 엔드포인트 생성(BFF)
---

# New API - API 엔드포인트 생성

## 목적

새로운 BFF API 엔드포인트(`app/src/app/api/**/route.ts`)를 프로젝트 표준에 맞춰 스캐폴딩합니다.

## 사용법

```
/new-api <path> <methods>
```

예시:
- `/new-api vendors GET,POST`
- `/new-api vendors/[id] GET,PATCH,DELETE`
- `/new-api leads/[id]/status PATCH`

## 표준 패턴(요약)

- 입력: Zod(`app/src/lib/schema/*.ts`)로 `parse`
- 권한: guards(`app/src/server/auth/guards.ts`)로 fail-fast
- 예외: `withApi`가 표준화
- 응답: `ok/created/fail`

## 템플릿

- `.claude/reference/api-route-templates.md`
- `.claude/reference/api-patterns.md`

## 참고(실제 파일)

- `app/src/app/api/vendors/route.ts`
- `app/src/app/api/vendors/me/route.ts`

## 후속 작업

```bash
cd app
pnpm lint
pnpm type-check
pnpm test
```

