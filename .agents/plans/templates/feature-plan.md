# Feature Plan: [Feature Name]

## Overview

| 항목 | 내용 |
|-----|------|
| **Domain** | [domain] |
| **Feature** | [feature] |
| **PRD** | app/doc/domains/[domain]/[feature]/prd.md |
| **TSD** | app/doc/domains/[domain]/[feature]/tsd.md |
| **Date** | [YYYY-MM-DD] |
| **Author** | Claude |

> SSOT: PRD/TSD. 이 plan은 “실행 절차” 문서이며, PRD/TSD에 없는 요구사항/설계를 새로 추가하지 않는다.

## Requirements Summary

[PRD에서 추출한 요구사항 요약]

### User Stories
- [ ] As a [user], I want to [action] so that [benefit]

### Acceptance Criteria
- [ ] [조건 1]
- [ ] [조건 2]

---

## Task Chunking Rules (권장)

> 목표: 컨텍스트/실수 누적을 막기 위해 “작게 만들고, 바로 검증”합니다.

- 기본: **1 Task = 1개의 `VALIDATE` 명령으로 pass/fail 판정 가능**
- 기본: **1 Task는 1개의 변경 경계(레이어/모듈)만 다룸** (DB/RLS / Schema / API / UI)
- 분할 기준: `VALIDATE`가 2개 이상 필요하거나, 여러 경계를 동시에 건드리면 Task를 더 쪼개고 plan을 갱신합니다.

---

## Context References

### IMPORTANT: 구현 전 반드시 읽어야 할 파일

| 파일 | 라인 | 참조 이유 |
|-----|------|---------|
| `app/src/app/api/[example]/route.ts` | 전체 | API Route(BFF) 패턴 |
| `app/src/lib/schema/[example].ts` | 전체 | Zod 계약 패턴 |
| `app/src/api-client/[example].ts` | 전체 | API Client 패턴 |

### Reference Documents
- `.claude/reference/nextjs-patterns.md`
- `.claude/reference/supabase-patterns.md`
- `.claude/reference/frontend-patterns.md`
- `.claude/reference/coding-conventions.md`
- `.claude/reference/spec-templates.md`

---

## Implementation Plan

### Phase 1: Database/RLS (if needed)

- [ ] **Migration 작성**
  - 파일: `app/supabase/migrations/YYYYMMDDHHMMSS_[name].sql`
  - 테이블/컬럼/RLS:
    - ...
  - VALIDATE: `cd app && pnpm db:migrate`

- [ ] **타입 생성**
  - VALIDATE: `cd app && pnpm db:gen -- --local`

### Phase 2: Schema (Zod)

- [ ] **Zod 스키마 정의**
  - 파일: `app/src/lib/schema/[...].ts`
  - VALIDATE: `cd app && pnpm type-check`

### Phase 3: API (BFF)

- [ ] **API Route 구현**
  - 파일: `app/src/app/api/[path]/route.ts`
  - 필요 시: `app/src/app/api/[path]/[id]/route.ts`
  - VALIDATE: `cd app && pnpm type-check`

### Phase 4: UI

- [ ] **페이지/컴포넌트 구현**
  - 위치: `app/src/app/(page)/...`
  - VALIDATE: `cd app && pnpm lint`

### Phase 5: Validation

- [ ] `cd app && pnpm lint && pnpm type-check && pnpm test && pnpm build` 통과

---

## Step-by-Step Tasks

### Task 1: [Task name]
```
ACTION: CREATE/UPDATE/RUN
FILE/COMMAND: ...
PATTERN: ...
VALIDATE: cd app && pnpm ...
```

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

## Risks & Mitigations

| 위험 | 영향 | 완화 방안 |
|-----|------|---------|
| ... | ... | ... |

---

## Done When (Completion Criteria)

- [ ] 스펙(DoR) 충족 상태에서 구현됨
- [ ] 필요한 경우 마이그레이션/RLS 적용 + 타입 재생성 완료
- [ ] `cd app && pnpm lint && pnpm type-check && pnpm test && pnpm build` 통과
- [ ] `/code-review` 피드백 반영(필요 시)

---

## Progress Log (append-only)

