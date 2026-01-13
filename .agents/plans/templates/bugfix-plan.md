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

### 예상 동작
[정상 동작]

### 실제 동작
[오동작]

---

## Root Cause Analysis

### 근본 원인
[무엇이/왜/어디서 잘못됐는지]

### 코드 위치
| 파일 | 라인 | 문제 |
|-----|------|------|
| ... | ... | ... |

---

## Proposed Fix

### 수정 방안
[수정 방안]

### 대안 검토
| 방안 | 장점 | 단점 | 선택 |
|-----|------|------|------|
| A | ... | ... | ✓ |
| B | ... | ... | - |

---

## Implementation Steps

1) ...

각 단계는 **1 Step = 1 VALIDATE**를 목표로 쪼갭니다.

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

## Rollback Plan

- [ ] 롤백 조건
- [ ] 롤백 절차

---

## Progress Log (append-only)

