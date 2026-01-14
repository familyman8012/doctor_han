---
description: 기능 구현 전체 워크플로우
---

# Workflow - PIV 루프 오케스트레이터

## 목적

기능 구현의 전체 흐름을 자동으로 진행합니다.  
**각 단계의 실제 로직은 해당 커맨드/에이전트 파일을 따릅니다(로직 중복 금지).**

## 사용법

```
/workflow <domain/feature>
```

## 실행 순서

### Step 1: PRD/TSD 확인

- PRD: `app/doc/domains/**/prd.md`
- TSD: `app/doc/domains/**/tsd.md` (선택)

없으면 `@spec-writer` 호출로 문서부터 준비합니다(DoR 통과가 우선).

### Step 2: 컨텍스트 로드

→ `/prime <domain/feature>`  
→ `@explorer`로 유사 구현/패턴 탐색

### Step 3: 계획 수립

→ `/plan-feature <domain/feature>`  
→ `@planner`로 `.agents/plans/<domain>__<feature>.md` 생성

### Step 3.5: 리스크 기반 승인 판단(권장)

**자동 진행(승인 생략)**:

- UI-only 변경
- 단일 파일/단순 리팩터(동일 패턴 유지)
- DB/API/권한 정책 변경 없음

**승인 권장(요약 후 확인)**:

- ⚠️ DB 마이그레이션/정책(RLS) 변경
- ⚠️ API 엔드포인트 추가/변경
- ⚠️ 인증/인가(guards) 변경
- ⚠️ 서비스 롤(service_role) 사용 범위 변경
- ⚠️ 데이터 손실/대규모 락 가능성

### Step 4: 실행

→ `/execute <plan-file>`

### Step 5: 검증

→ `/validate`

### Step 6: 코드 리뷰

→ `/code-review`  
→ `@reviewer`

## 참조

- `.claude/commands/core_piv_loop/prime.md`
- `.claude/commands/core_piv_loop/plan-feature.md`
- `.claude/commands/core_piv_loop/execute.md`
- `.claude/commands/validation/validate.md`
- `.claude/commands/validation/code-review.md`

