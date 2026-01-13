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
- `/workflow vendor/favorites`
- `/workflow lead/messages`

## 실행 순서

### Step 1: PRD/TSD 확인 (DoR, fail-fast)

```
app/doc/domains/$ARGUMENTS/prd.md
app/doc/domains/$ARGUMENTS/tsd.md
```

- 존재하면 → Step 2로 진행
- **없으면** → `@spec-writer` 호출하여 PRD/TSD 작성
  - 사용자에게 요구사항 확인 요청
  - PRD/TSD 완성 후 사용자 검토/승인 대기 ← **유일한 승인 포인트(권장)**

### Step 2: 컨텍스트 로드

→ `/prime $ARGUMENTS` 실행  
→ `@explorer` 호출하여 관련 코드 탐색

### Step 3: 계획 수립

→ `/plan-feature $ARGUMENTS` 실행  
→ `@planner` 호출하여 구현 계획 생성

### Step 3.5: 리스크 기반 승인 판단

계획 생성 후, 변경 범위에 따라 승인 여부 결정:

**자동 진행 (승인 생략)**:
- UI-only 변경
- 단일 파일 수정
- 기존 패턴 그대로 적용
- DB/RLS/API/권한 변경 없음

**승인 필수 (1분 스캔용 요약 제시)**:
- ⚠️ Supabase 마이그레이션/스키마 변경 (`app/supabase/migrations/**`)
- ⚠️ RLS/Policy 변경
- ⚠️ API 엔드포인트 추가/변경
- ⚠️ Auth/Role guard 변경
- ⚠️ Storage 권한/버킷 정책 변경
- ⚠️ 크로스도메인 영향
- ⚠️ 데이터 손실 가능성

### Step 4: 실행

→ `/execute [plan-file]` 실행 (메인 에이전트)

### Step 5: 검증

→ `/validate` 실행

### Step 6: 코드 리뷰

→ `/code-review` 실행  
→ `@reviewer` 호출

### Step 7: 커밋

→ `/commit` 실행

## 에이전트 매핑

| 단계 | 커맨드 | 에이전트 | 역할 |
|-----|--------|---------|------|
| 1 | - | @spec-writer | PRD/TSD 작성 (필요시) |
| 2 | /prime | @explorer | 코드베이스 탐색 |
| 3 | /plan-feature | @planner | 구현 계획 수립 |
| 4 | /execute | 메인 | 계획 실행 |
| 5 | /validate | 메인 | 검증 |
| 6 | /code-review | @reviewer | 코드 리뷰 |
| 7 | /commit | 메인 | 커밋 |

