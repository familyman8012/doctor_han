# Feature: <feature-name>

이 계획서는 “코드 작성 전” 단계 산출물이다.  
구현 단계에서는 이 파일만 보고도 한 번에 끝낼 수 있도록 컨텍스트를 충분히 포함한다.

> NOTE: 신규 기능 계획은 `.agents/plans/templates/feature-plan.md` 템플릿 사용을 권장한다.

## Feature Description

## User Story

As a <role>
I want to <goal>
So that <value>

## Problem Statement

## Solution Statement

## Feature Metadata

**Feature Type**: New Capability | Enhancement | Refactor | Bug Fix  
**Estimated Complexity**: Low | Medium | High  
**Primary Systems Affected**: (예: app/src/app/api, app/src/server, app/src/app/(main))  
**Dependencies**: (예: Supabase, Resend, etc.)

---

## CONTEXT REFERENCES (MUST READ)

### Product / Policy
- `app/doc/business.md`
- `app/doc/todo.md`
- `app/doc/test.csv`
- `app/doc/domains/<domain>/prd.md` (if relevant)

### Codebase Patterns
- `app/src/server/api/with-api.ts`
- `app/src/server/api/response.ts`
- `app/src/server/api/errors.ts`
- `app/src/api-client/error-handler.ts`

### Generated Indices (optional)
- `.claude/reference/api-routes-index.md`
- `.claude/reference/todo-open-items.md`

---

## IMPLEMENTATION PLAN

### Phase 1: Contract / DB (if needed)
- Zod schema changes (`app/src/lib/schema/**`)
- DB migration + RLS (`app/supabase/migrations/**`)
- regenerate types (`pnpm db:gen`)

### Phase 2: API (BFF)
- add/update `app/src/app/api/**/route.ts`
- role gating (doctor/vendor/admin)
- consistent error codes/messages

### Phase 3: UI
- pages/components updates under `app/src/app/**`
- React Query queryKey + invalidation
- forms via react-hook-form

### Phase 4: Validation
- `cd app && pnpm lint`
- `cd app && pnpm build`
- (DB changed) `cd app && pnpm db:gen -- --local`

---

## STEP-BY-STEP TASKS

1) ...
