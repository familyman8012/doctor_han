# 코딩 컨벤션 (Medihub)

이 문서는 Medihub 코드베이스의 코딩 규칙을 정리합니다. (세부 기술 규칙은 `CLAUDE.md`가 우선)

## 0) 절대 규칙 (위반 시 즉시 수정)

1. **브라우저에서 Supabase(DB) 직접 호출 금지** (예외: Auth/Storage)
2. **Server Action 금지**
3. **React Query 커스텀 훅 래핑 금지** (컴포넌트에서 직접 사용)
4. **분산 `onError` 금지** (중앙 에러 핸들러만 사용)

## 1) 폴더/레이어 규칙

### (A) BFF API

- `app/src/app/api/**/route.ts`
- 표준 유틸: `app/src/server/api/{with-api.ts,response.ts,errors.ts}`
- 권한: `app/src/server/auth/guards.ts`

### (B) 도메인 server 모듈

- `app/src/server/<domain>/repository.ts`: DB 접근(쿼리 모음)
- `app/src/server/<domain>/mapper.ts`: Row → DTO 변환

### (C) 스키마(Zod)

- `app/src/lib/schema/<domain>.ts`: 도메인 스키마 단일 파일 패턴(과도한 분할 금지)

## 2) 타입/스키마 규칙

- 요청 Query/Body는 Zod로 파싱 후 타입을 확보합니다.
- “검증 없는 `any` 확산”을 금지합니다.

## 3) 에러 처리 규칙

- 서버: `withApi` + `ApiError`로 표준화
- 클라이언트: 중앙 error handler를 통해 사용자 메시지 노출

## 4) 실행 커맨드

pnpm 커맨드는 `app/`에서 실행합니다.

```bash
cd app
pnpm lint
pnpm type-check
pnpm test
```

