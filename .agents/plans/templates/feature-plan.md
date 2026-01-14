# Feature Plan: [Feature Name]

## Overview

| 항목 | 내용 |
|-----|------|
| **Domain** | [domain] |
| **Feature** | [feature] |
| **PRD** | `app/doc/domains/[domain]/prd.md` (또는 `app/doc/domains/[domain]/[feature]/prd.md`) |
| **TSD** | `app/doc/domains/[domain]/tsd.md` (선택) |
| **Date** | [YYYY-MM-DD] |
| **Author** | Claude |

> SSOT: PRD/TSD. 이 plan은 “실행 절차” 문서이며, PRD/TSD에 없는 요구사항/설계를 새로 추가하지 않는다.

## Requirements Summary

[PRD에서 추출한 요구사항 요약]

### User Stories
- [ ] As a [user], I want to [action] so that [benefit]
- [ ] ...

### Acceptance Criteria
- [ ] [조건 1]
- [ ] [조건 2]
- [ ] ...

---

## Task Chunking Rules (권장)

> 목표: 컨텍스트/실수 누적을 막기 위해 “작게 만들고, 바로 검증”합니다.

- 기본: **1 Task = 1개의 `VALIDATE` 명령으로 통과/실패(pass/fail) 판정 가능**
- 기본: **1 Task는 1개의 변경 경계(레이어/모듈)만 다룸** (DB / Types / Schema / API / UI)
- 분할 기준: `VALIDATE`가 2개 이상 필요하거나, 여러 레이어/디렉토리를 동시에 건드리면 Task를 더 쪼개고 plan을 갱신합니다.
- 예외: 강결합 작업은 1 Task로 묶어도 됩니다. (예: `pnpm db:migrate && pnpm db:gen`)

---

## Context References

### IMPORTANT: 구현 전 반드시 읽어야 할 파일

| 파일 | 참조 이유 |
|-----|---------|
| `app/src/server/api/with-api.ts` | 에러 표준화(withApi) |
| `app/src/server/auth/guards.ts` | 인증/인가 가드 |
| `app/src/app/api/vendors/route.ts` | API Route 패턴(목록) |
| `app/src/app/api/vendors/me/route.ts` | API Route 패턴(권한/바디) |
| `app/src/lib/schema/vendor.ts` | Zod 스키마 패턴 |
| `app/src/server/vendor/repository.ts` | Repository 패턴 |
| `app/src/server/vendor/mapper.ts` | Mapper 패턴 |
| `app/supabase/migrations/*.sql` | 마이그레이션 패턴(+RLS) |

### Reference Documents
- `.claude/reference/coding-conventions.md`
- `.claude/reference/nextjs-patterns.md`
- `.claude/reference/supabase-patterns.md`
- `.claude/reference/frontend-patterns.md`
- `.claude/reference/api-patterns.md`
- `.claude/reference/service-patterns.md`
- `.claude/reference/zod-patterns.md`

---

## Implementation Plan

### Phase 1: Database (필요 시)

- [ ] **마이그레이션 생성**
  - COMMAND: `cd app && pnpm db:new -- "<name>"`
  - FILE: `app/supabase/migrations/<timestamp>_<name>.sql`
  - 포함: 테이블/컬럼 변경 + RLS/Policy 영향
  - VALIDATE: `cd app && pnpm db:migrate`

### Phase 2: Types (필요 시)

- [ ] **Supabase 타입 생성**
  - OUTPUT: `app/src/lib/database.types.ts`
  - VALIDATE: `cd app && pnpm db:gen -- --local` (또는 `pnpm db:gen`)

### Phase 3: Schema (Zod 계약)

- [ ] **Zod 스키마 정의/수정**
  - FILE: `app/src/lib/schema/[domain].ts`
  - 포함: Query/Body/Response 스키마
  - VALIDATE: `cd app && pnpm type-check`

### Phase 4: Server Module (repository/mapper/service)

- [ ] **Repository/Mapper 구현(필요 시)**
  - FILES:
    - `app/src/server/[domain]/repository.ts`
    - `app/src/server/[domain]/mapper.ts`
    - `app/src/server/[domain]/service.ts` (필요 시)
  - VALIDATE: `cd app && pnpm type-check`

### Phase 5: API Layer (BFF)

- [ ] **API Route 구현**
  - FILES:
    - `app/src/app/api/[path]/route.ts`
    - `app/src/app/api/[path]/[id]/route.ts` (필요 시)
  - 포함:
    - Zod parse
    - withApi
    - guards(필요 시)
    - ok/created/fail
  - VALIDATE: `cd app && pnpm type-check`

### Phase 6: UI (필요 시)

- [ ] **페이지/컴포넌트 구현**
  - FILE: `app/src/app/(page)/...`
  - 규칙:
    - React Query는 컴포넌트에서 직접 사용(커스텀 훅 래핑 금지)
    - 개별 onError 금지(중앙 에러 핸들러)
  - VALIDATE: `cd app && pnpm lint && pnpm type-check`

---

## Validation Commands

```bash
cd app
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

---

## Done When (Completion Criteria)

- [ ] (필요 시) 마이그레이션 적용 완료
- [ ] (필요 시) `database.types.ts` 생성 완료
- [ ] (필요 시) Zod 스키마 정의 완료
- [ ] (필요 시) server 모듈 구현 완료
- [ ] (필요 시) API Route 구현 완료
- [ ] (필요 시) UI 구현 완료
- [ ] `cd app && pnpm lint && pnpm type-check && pnpm test && pnpm build` 통과
- [ ] 코드 리뷰 완료

---

## Progress Log (append-only)

> 규칙: 이 섹션은 **기존 로그를 수정하지 말고**, 항상 맨 아래에 **추가(append)** 합니다. (3~6줄 유지)

### Iteration 1 (YYYY-MM-DD HH:mm)
- ✅/❌ Task: [무엇을 했는지]
- Validate: `[실행한 검증 명령]` → [결과]
- Notes: [배운 점/주의점]
- Next: [다음에 할 한 가지]

