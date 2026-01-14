---
description: 기능 구현 계획 생성
---

# Plan Feature - 기능 계획

## 목적

새 기능의 구현 계획을 수립합니다. (PIV: Prime → Plan → Execute → Validate)

## 사용법

```
/plan-feature <domain/feature>
```

## 선행 조건

- (권장) `/refresh` → `/prime` 순서로 “현재 레포 사실 + 관련 컨텍스트”를 먼저 고정합니다.
- PRD/TSD는 입력(SSOT)입니다. DoR을 통과하지 못하면 plan을 만들지 않습니다:
  - `.claude/reference/spec-templates.md`

## 실행 프로세스(요약)

### Phase 0: Spec Ready 체크 (fail-fast)

1. PRD가 없으면 `/new-prd <domain/feature>`로 스켈레톤 생성 → 최소 초안 작성 → **중단**
2. TSD가 없으면(필요한 경우) `/new-tsd <domain/feature>`로 스켈레톤 생성 → 최소 초안 작성 → **중단**
3. DoR 실패면 `@spec-writer`로 문서부터 보강하고 **중단**

### Phase 1: 요구사항 요약(PRD)

- 사용자 역할/시나리오/AC
- 금지 정책(Server Action/DB direct/RQ hook/onError)

### Phase 2: 변경 경계 확정

- DB: `app/supabase/migrations/*.sql` 영향 여부
- Types: `app/src/lib/database.types.ts` 재생성 필요 여부
- Schema: `app/src/lib/schema/*.ts`
- API: `app/src/app/api/**/route.ts`
- UI: `app/src/app/(page)/**`

### Phase 3: 태스크 분해

권장 규칙:

- 기본: **1 Task = 1 VALIDATE**
- 기본: **1 Task는 1개의 변경 경계만**
- 예외: 강결합은 1 Task로 묶기 가능(예: `pnpm db:migrate && pnpm db:gen`)

## 출력

- `.agents/plans/<domain>__<feature>.md`
- 템플릿: `.agents/plans/templates/feature-plan.md`

