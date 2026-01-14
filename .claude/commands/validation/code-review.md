---
description: 코드 리뷰
---

# Code Review - 코드 리뷰

## 목적

코드 변경사항을 검토하고 품질을 평가합니다. 특히 **정책 위반(Server Action/DB direct/RQ hook/onError)**, 보안, 데이터 정합성을 우선 확인합니다.

## 사용법

```
/code-review
```

## 리뷰 체크리스트

### 1) 정책(Policy) 위반 — 즉시 수정

- [ ] Server Action/Form Action 사용
- [ ] 브라우저에서 Supabase(DB) 직접 호출(예외: Auth/Storage) 여부
- [ ] React Query 커스텀 훅 래핑 여부
- [ ] 개별 `onError` 추가 여부(중앙 에러 핸들러 정책 위반)

### 2) API 품질

- [ ] Query/Body가 Zod로 파싱/검증되는가?
- [ ] `withApi`로 예외가 표준화되는가?
- [ ] guards(`withUser/withAuth/withRole/...`)로 권한을 서버에서 강제하는가?
- [ ] `ok/created/fail` 응답 포맷을 따르는가?

### 3) DB/보안

- [ ] RLS/Policy 관점에서 접근이 안전한가?
- [ ] service_role 사용 범위가 최소화되어 있는가?
- [ ] 민감 데이터가 응답에 노출되지 않는가?

### 4) 로직/정합성

- [ ] 누락된 에러 처리/예외 케이스
- [ ] 경쟁 조건/중복 생성(예: unique 위반) 대응
- [ ] 목록 페이징/정렬이 올바른가?

### 5) 프론트엔드

- [ ] 불필요한 리렌더링/상태 폭발
- [ ] queryKey 설계가 안정적인가?
- [ ] invalidate 전략이 과하지/부족하지 않은가?

## 프로세스(권장)

```bash
git diff --name-only HEAD~1
git diff HEAD~1
```

## 참조 문서

- `.claude/reference/coding-conventions.md`
- `.claude/reference/nextjs-patterns.md`
- `.claude/reference/supabase-patterns.md`
- `.claude/reference/frontend-patterns.md`
- `.claude/reference/api-patterns.md`
- `.claude/reference/service-patterns.md`
- `.claude/reference/zod-patterns.md`

