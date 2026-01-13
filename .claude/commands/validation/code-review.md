---
description: 코드 리뷰
---

# Code Review - 코드 리뷰

## 목적

코드 변경사항을 검토하고 품질을 평가합니다. 패턴 준수, 보안, 성능 등을 확인합니다.

## 사용법

```
/code-review
```

또는 특정 파일만:

```
/code-review [file-path]
```

## 리뷰 체크리스트

### 1. 로직/정합성

- [ ] Zod 입력 검증이 있는가?
- [ ] 실패 케이스(400/401/403/409/500)가 스펙(TSD)과 일치하는가?
- [ ] React Query queryKey/invalidation이 일관적인가?

### 2. 보안

- [ ] 브라우저에서 DB 직접 호출 금지(BFF 패턴) 위반이 없는가?
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 클라이언트로 노출되지 않는가?
- [ ] Storage는 Signed URL 발급 후 업/다운로드만 하는가?
- [ ] RLS 정책 전제가 코드/스펙과 일치하는가?

### 3. 성능/운영

- [ ] 불필요한 N+1 쿼리가 없는가?
- [ ] 대량 리스트 조회에 pagination이 있는가?
- [ ] 관리자 기능은 최소 권한/감사 로그 요구가 반영되는가?

## 실행

```bash
git diff --name-only
git diff
```

## 산출물(권장)

- 리뷰 결과는 `.agents/code-reviews/`에 저장합니다(긴 작업에서 컨텍스트 드리프트 방지).

