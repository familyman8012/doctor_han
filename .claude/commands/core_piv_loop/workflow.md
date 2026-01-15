---
description: 기능 구현 전체 워크플로우
---

# Workflow - PIV 루프 오케스트레이터

## 목적

기능 구현의 전체 흐름을 자동으로 진행합니다.
**각 단계의 실제 로직은 해당 커맨드/에이전트 파일을 따릅니다.** (로직 중복 금지)

## 사용법

```
/workflow [domain/feature]
```

예시:
- `/workflow vendor/search`
- `/workflow lead/status`

## 실행 순서

### Step 1: PRD 확인

```
app/doc/domains/$ARGUMENTS/prd.md
```

- 존재하면 → Step 2로 진행
- **없으면** → `@spec-writer` 호출하여 PRD 작성
  - 사용자에게 요구사항 확인 요청
  - PRD 완성 후 사용자 검토/승인 대기 ← **유일한 승인 포인트**

### Step 2: 컨텍스트 로드

**(권장) 먼저 `/refresh` 실행하여 생성 문서 갱신** (드리프트 방지)

다음 문서들을 확인합니다:
```
app/doc/domains/$ARGUMENTS/prd.md
app/doc/domains/$ARGUMENTS/ui.md
```

**스코프 규칙 (중요)**:
- **집중 폴더**: `app/doc/domains/$ARGUMENTS/` (이 폴더 안의 PRD/UI/README만)
- **금지**: 상위 폴더(`app/doc/domains/<domain>/...`) 전체 문서 스캔
- **금지**: 코드베이스 탐색/분석 (이는 Step 3 `@planner`에서 1회 수행)

### Step 3: TSD(계획) 수립

→ `@planner` 호출하여 TSD(구현 계획) 생성

- PRD 기반 태스크 시퀀스 생성
- 산출물: `app/doc/domains/$ARGUMENTS/tsd.md`

### Step 3.5: 리스크 기반 승인 판단

TSD 생성 후, 변경 범위에 따라 승인 여부 결정:

**자동 진행 (승인 생략)**:
- UI-only 변경
- 단일 파일 수정
- 기존 패턴 그대로 적용
- DB/API/권한 변경 없음

**승인 필수 (1분 스캔용 요약 제시)**:
- ⚠️ DB 마이그레이션/RLS/Policy 변경
- ⚠️ API 엔드포인트 추가/변경
- ⚠️ 권한(guards) 변경
- ⚠️ 크로스도메인 영향
- ⚠️ 데이터 손실 가능성

**승인 요청 형식**:
```
[Plan 요약]
- 파일: N개 생성, M개 수정
- DB: (변경 내용 또는 "없음")
- API: (변경 내용 또는 "없음")
- 권한: (변경 내용 또는 "없음")
- AC 커버: UC-1, UC-2, ...

진행할까요? (Y/n)
```

### Step 4: 실행

`app/doc/domains/$ARGUMENTS/tsd.md`의 태스크 시퀀스를 실행합니다 (메인 에이전트).

**핵심 규칙**:
- **순서 엄수**: 태스크를 건너뛰거나 순서를 변경하지 않음
- **즉시 검증**: 각 태스크 완료 후 즉시 VALIDATE 명령 실행
- **계획 외 변경 금지**: 계획에 없는 "개선"을 추가하지 않음
- **PRD 충돌 시**: 구현을 진행하지 말고 PRD(SSOT)부터 보강한 뒤 TSD 재생성

**Progress Log 기록 (권장)**:
- TSD의 `Progress Log (append-only)` 섹션에 3~6줄로 누적 기록
- 무엇을 했는지 / 어떤 검증을 했는지 / 다음 힌트

### Step 5: 검증

→ `/validate` 실행

- lint → type-check (기본)
- 오류 발생 시 수정

### Step 6: 코드 리뷰

Step 5 완료 후 사용자에게 물어봅니다:

```
코드 리뷰를 진행할까요? (Y/n)
```

- Y: `@reviewer` 호출 → `app/doc/domains/$ARGUMENTS/code-review.md` 저장
- n: 리뷰 없이 종료

### Step 7: PR 출하 (옵션)

Step 6 완료 후(또는 리뷰를 건너뛰었다면 Step 5 완료 후) 사용자에게 물어봅니다:

```
PR을 생성할까요? (Y/n)
```

- Y: `@shipper` 호출 → 브랜치 push + PR 생성 + `app/doc/domains/$ARGUMENTS/pull-request.md` 작성
- n: PR 생성 없이 종료

## 에이전트 매핑

| 단계 | 에이전트 | 역할 |
|-----|---------|------|
| 1 | @spec-writer | PRD 작성 (필요시) |
| 2 | 메인 | PRD/UI 컨텍스트 로드(문서 중심) |
| 3 | @planner | TSD(구현 계획) 수립 및 저장 |
| 4 | 메인 | 계획 실행 |
| 5 | 메인 | /validate로 검증 |
| 6 | @reviewer (옵션) | 코드 리뷰 (문서 저장) |
| 7 | @shipper (옵션) | PR 출하 (push + PR 생성) |

## 사용자 개입 포인트

1. **PRD 검토** (Step 1): 요구사항 확정
2. **TSD(계획) 승인** (Step 3.5, 조건부): 고위험 변경 시 3줄 요약 확인
3. **리뷰 진행 여부** (Step 6): 필요 시만 수행
   - `app/doc/domains/$ARGUMENTS/code-review.md`
4. **PR 생성 여부** (Step 7): 필요 시만 수행
   - `app/doc/domains/$ARGUMENTS/pull-request.md`

저위험 변경은 Step 2~5 자동 진행, 고위험 변경은 Step 3.5에서 승인 대기.

## 주의사항

- 이 파일은 **순서와 연결만 정의**합니다
- 각 단계의 상세 동작은 해당 커맨드/에이전트 파일 참조
- 로직 중복 금지 (드리프트 방지)

## 문제 발생 시

- `/validate` 실패 → 오류 수정 후 재실행
- 결과물이 요구사항과 다름 → PRD 수정 → `/workflow` 재실행

## 참조

### 커맨드
- `.claude/commands/core_piv_loop/refresh.md`
- `.claude/commands/validation/validate.md`

### 에이전트
- `.claude/agents/spec-writer.md`
- `.claude/agents/planner.md`
- `.claude/agents/reviewer.md`
- `.claude/agents/shipper.md`
