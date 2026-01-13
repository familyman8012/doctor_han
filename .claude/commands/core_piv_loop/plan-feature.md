---
description: 기능 구현 계획 생성
---

# Plan Feature - 기능 계획

## 목적

새로운 기능의 구현 계획을 수립합니다. 이 명령은 PIV (Prime-Implement-Validate) 루프의 두 번째 단계입니다.

## 사용법

```
/plan-feature [domain/feature]
```

예시:
- `/plan-feature vendor/favorites`
- `/plan-feature lead/messages`

## 선행 조건

- (권장) `/refresh` → `/prime` 순서로 “현재 레포 사실 + 관련 컨텍스트”를 먼저 고정합니다.
- PRD/TSD는 **입력(SSOT)** 입니다. DoR(Definition of Ready)을 통과하지 못하면 plan을 만들지 않습니다:
  - `.claude/reference/spec-templates.md`의 “Definition of Ready (DoR) - PRD/TSD”

## 실행 프로세스

### Phase 0: Spec Ready 체크 (PRD/TSD, fail-fast)

1. PRD가 없으면: `/new-prd $ARGUMENTS`로 스켈레톤 생성 → PRD 최소 초안 작성 → **여기서 중단**(다시 `/plan-feature`)
2. TSD가 없으면: (PRD 존재 확인 후) `/new-tsd $ARGUMENTS`로 스켈레톤 생성 → TSD 최소 초안 작성 → **여기서 중단**(다시 `/plan-feature`)
3. PRD/TSD가 존재해도 DoR을 통과하지 못하면: `@spec-writer`로 문서 정합성부터 맞추고 **중단**
4. PRD/TSD가 DoR을 통과하면 Phase 1로 진행

### Phase 1: 요구사항 요약 (PRD)

- PRD에서 요구사항/시나리오/AC 추출
- 범위(Goals/Non-Goals) 확인
- 복잡도 판단 (Low/Medium/High)

### Phase 2: 계약/설계 추출 (TSD)

TSD의 내용을 “새로 설계”하지 말고, **이미 결정된 계약을 plan 입력으로 변환**합니다:

- 변경 경계(UI/API/Schema/DB) 확정
- DB/RLS 변경 여부/마이그레이션 계획 확정
- API 계약(엔드포인트/스키마/에러/권한) 확정
- 검증/롤백 전략 확정

### Phase 3: 코드베이스 분석

- 유사 구현/패턴 식별
- 의존성 분석
- 통합 포인트 파악
- (테스트가 있는 경우) 유사 테스트 예제 파악

### Phase 4: 실행 계획(Tasks) 생성

TSD의 계약을 기준으로 “한 번에 구현 가능한” 태스크 시퀀스를 만듭니다:

- 기본: **1 Task = 1개의 `VALIDATE` 명령으로 pass/fail 판정 가능**
- 기본: **1 Task는 1개의 변경 경계(레이어/모듈)만 다룸** (DB / Schema / API / UI)
- 분할 기준: `VALIDATE`가 2개 이상 필요하거나, 여러 경계를 동시에 건드리면 Task를 더 쪼개고 plan을 갱신
- Blocker가 있으면 plan에 “추정”으로 채우지 말고, PRD/TSD 보강으로 되돌림

### Phase 5: 계획 문서 생성

`.agents/plans/[domain]__[feature].md` 파일 생성  
(`$ARGUMENTS`의 `/`를 `__`로 치환해 충돌을 줄입니다.)

## 템플릿

- `.agents/plans/templates/feature-plan.md`

## 다음 단계

계획 수립이 완료되면 `/execute` 명령으로 계획을 실행합니다.

