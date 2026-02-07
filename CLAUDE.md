# Medihub (doctor_han) - Claude Code Configuration

## Project Overview

Medihub는 의사/업체를 연결하는 B2B 마켓플레이스입니다. (리드, 리뷰, 관리자 승인)

## Tech Stack

- **Framework**: Next.js App Router, React 19
- **Language**: TypeScript
- **Database/Auth/Storage**: Supabase
- **Validation**: Zod
- **State**: TanStack React Query, Zustand
- **Routing State**: nuqs
- **UI**: Tailwind CSS

## Non-negotiable Rules

- **Server Actions 금지**
- **클라이언트 직접 DB 접근 금지**
- 모든 데이터 접근은 BFF API Route (`app/src/app/api/**/route.ts`)
- 입력 검증은 Zod `.parse()` 사용
- 응답 표준: `withApi` + `ApiError` + `ok/created/fail`
- `service_role`은 서버에서만 사용

## Architecture Layers

```
┌─────────────────────────────────────┐
│          API Routes (BFF)            │
│   app/src/app/api/**/route.ts        │
├─────────────────────────────────────┤
│        Server Modules                │
│   app/src/server/<domain>/*          │
├─────────────────────────────────────┤
│        Supabase (Postgres/Auth)      │
└─────────────────────────────────────┘
```

## Development Workflow

1. **PRD 작성**: `app/doc/domains/[domain]/[feature]/prd.md`
2. **TSD 작성**: `app/doc/domains/[domain]/[feature]/tsd.md`
3. **Migration 작성**: `app/supabase/migrations/*.sql`
4. **Schema 정의**: `app/src/lib/schema/[domain].ts`
5. **Server 구현**: `app/src/server/<domain>/{repository,service,mapper}.ts`
6. **API Route 구성**: `app/src/app/api/**/route.ts`

## File Naming Conventions

| 유형       | 파일명 패턴                           | 예시 |
| ---------- | ------------------------------------- | ---- |
| Migration  | `YYYYMMDDHHMMSS_description.sql`      | `20260117152258_review_reports.sql` |
| Schema     | `[domain].ts`                         | `app/src/lib/schema/review.ts` |
| Server     | `repository.ts` / `service.ts` / `mapper.ts` | `app/src/server/review/service.ts` |
| API Route  | `route.ts`                            | `app/src/app/api/reviews/route.ts` |
| 페이지     | `page.tsx`                            | `app/src/app/(main)/vendors/page.tsx` |

## Important Commands

```bash
cd app

# 개발
pnpm dev
pnpm build

# 검증
pnpm lint
pnpm type-check
pnpm test

# DB
pnpm db:migrate
pnpm db:gen
```

## Frontend Patterns

- React Query 직접 사용 (커스텀 Hook 래핑 금지)
- URL 상태는 nuqs 사용
- Server Actions 금지, API Route + React Query만 사용

## UI Components

- 기본 UI: `app/src/components/ui/`
- 복합 위젯: `app/src/components/widgets/`

## Shared Gate (공통 변경 통로)

- `app/src/components/ui/**`
- `app/src/lib/constants/**`
- `app/src/server/api/errors.ts`

## Key Reference Docs

수익화/과금 관련 개발 시 반드시 참조:

- **전체 로드맵**: `app/doc/todo.md` (MVP~P8 + Future/Backlog)
- **수익화 PRD**: `app/doc/domains/monetization/prd.md`
- **수익화 사전체크**: `app/doc/domains/monetization/pre-implementation-checklist.md`
  - 비즈니스 결정사항 (가격/정책/우선순위) 확정 내역
- **사업계획서**: `app/doc/메디허브 사업계획서  마스터버전.md`
  - 수익모델 10가지, 솔루션 전체 스펙 원본
