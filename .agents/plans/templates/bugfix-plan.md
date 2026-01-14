# Bugfix Plan: [Issue Title]

## Issue Information

| 항목 | 내용 |
|-----|------|
| **Issue ID** | #[number] 또는 [JIRA-XXX] |
| **Severity** | Critical / High / Medium / Low |
| **Reported** | [YYYY-MM-DD] |
| **Reporter** | [name] |
| **Affected Area** | [domain/feature] |

## Problem Description

### 현상
[버그 현상 설명]

### 재현 단계
1. [단계 1]
2. [단계 2]
3. [단계 3]

### 예상 동작
[정상적으로 동작해야 하는 방식]

### 실제 동작
[현재 잘못된 동작]

### 스크린샷/로그
```
[관련 에러 로그나 스크린샷]
```

---

## Root Cause Analysis

### 조사 과정

1. **코드 탐색**
   - 파일: [file path]
   - 라인: [line numbers]
   - 발견: [발견 사항]

2. **관련 커밋 확인**
   ```bash
   git log --oneline -10 [file]
   ```

3. **데이터 확인**
   - API/DB 상태 확인 결과

### 근본 원인

[상세한 근본 원인 분석]

---

## Proposed Fix

### 수정 방안

[수정 방안 상세 설명]

### 대안 검토

| 방안 | 장점 | 단점 | 선택 |
|-----|------|------|------|
| 방안 A | [장점] | [단점] | ✓ / - |
| 방안 B | [장점] | [단점] | - |

---

## Implementation Steps

> 주의: 이 프로젝트의 `pnpm` 커맨드는 `app/`에서 실행합니다.

### Phase 1: Fix

- [ ] **파일 수정**
  - 파일: `[file path]`
  - 변경: [변경 내용]
  - VALIDATE: `cd app && pnpm type-check`

- [ ] **테스트 추가(필요 시)**
  - 파일: `[test file path]`
  - 케이스: [테스트 케이스]
  - VALIDATE: `cd app && pnpm test`

### Phase 2: Verification

- [ ] **버그 재현 테스트**
  - 수정 전: 버그 재현 확인
  - 수정 후: 버그 해결 확인

- [ ] **회귀 테스트**
  - 관련 기능 정상 동작 확인

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

- [ ] 근본 원인 분석 완료
- [ ] 수정 코드 작성 완료
- [ ] (필요 시) 테스트 추가 완료
- [ ] 버그 재현 → 해결 확인
- [ ] 회귀 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] `cd app && pnpm lint && pnpm type-check && pnpm test && pnpm build` 통과

---

## Progress Log (append-only)

> 규칙: 이 섹션은 **기존 로그를 수정하지 말고**, 항상 맨 아래에 **추가(append)** 합니다. (3~6줄 유지)

### Iteration 1 (YYYY-MM-DD HH:mm)
- ✅/❌ Step: [무엇을 했는지]
- Validate: `[실행한 검증 명령]` → [결과]
- Notes: [배운 점/주의점]
- Next: [다음에 할 한 가지]

