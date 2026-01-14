# Medihub 아키텍처 개요

Medihub는 Next.js(App Router) 기반의 웹 앱이며, **BFF API Routes + Supabase(Postgres/RLS/Auth/Storage)** 조합을 기본 아키텍처로 채택합니다.

## 0) 시스템 정책(Policy) — 기술보다 먼저 보이는 규칙

1. **Server Action 금지**: 데이터 변경은 Server Action/Form Action으로 하지 않습니다.
2. **BFF 단일 진입점**: 클라이언트의 데이터 통신은 `app/src/app/api/**/route.ts`만 호출합니다.
3. **DB 쿼리는 서버에서만**: 브라우저에서 Supabase(DB) 직접 호출 금지(예외: Auth/Storage).
4. **권한은 이중 방어**: (1) API 가드(서버) + (2) RLS/Policy(DB).
5. **에러/응답 포맷 표준화**: `withApi` + `ok/created/fail`로 통일합니다.

## 1) 도메인(업무) 구성

코드는 “도메인 중심”으로 이름이 드러나야 합니다(Screaming Architecture).

- 인증/프로필: `auth`, `profile`
- 검수(승인/반려): `verification`
- 카테고리/탐색: `category`, `vendor`
- 리드/문의: `lead`
- 리뷰/평판: `review`
- 파일 업/다운로드: `file`
- 관리자: `admin`

도메인 PRD는 `app/doc/domains/**/prd.md`가 단일 출처입니다.

## 2) 레이어 구조(개념)

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Next.js / React)                 │
│  - TanStack Query (서버 상태)                                 │
│  - Zustand (전역 상태)                                        │
│  - React Hook Form + Zod (폼)                                 │
└─────────────────────────────────────────────────────────────┘
                              │  HTTP (/api/**)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                BFF API Routes (Next.js route.ts)             │
│  app/src/app/api/**/route.ts                                 │
│  - Zod 입력 검증 (app/src/lib/schema/*.ts)                    │
│  - withApi 공통 예외 처리                                     │
│  - guards(인증/인가)                                          │
└─────────────────────────────────────────────────────────────┘
                              │  (server-only)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Server Domain Modules                        │
│  app/src/server/<domain>/                                     │
│  - repository.ts: Supabase 쿼리(재사용/응집)                   │
│  - mapper.ts: Row → DTO 변환                                  │
│  - service.ts: 복합 로직(필요할 때만)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Supabase (Postgres + RLS + Auth)                │
│  - SQL migrations: app/supabase/migrations/*.sql              │
│  - types: app/src/lib/database.types.ts (pnpm db:gen)         │
│  - Storage: 목적(purpose) 기반 Signed URL                     │
└─────────────────────────────────────────────────────────────┘
```

## 3) 요청 처리 흐름(표준)

```
1) Client → /api/** 호출(Axios)
2) API Route에서 Query/Body를 Zod로 파싱/검증
3) guards로 인증/인가를 fail-fast
4) Supabase Server Client로 DB 접근 (필요 시 repository/service 호출)
5) mapper로 DTO 변환
6) ok/created/fail로 응답
7) withApi가 예외를 표준 에러 포맷으로 변환
```

## 4) 에러 처리(표준)

- 서버: `app/src/server/api/{with-api.ts,errors.ts,response.ts}`
  - `ApiError`를 던지면 `withApi`가 `fail(...)`로 변환합니다.
  - `ZodError`는 400 “입력 검증 실패”로 통일합니다.
- 클라이언트: 중앙 에러 핸들러가 사용자 메시지 노출을 담당합니다.
  - 파일: `app/src/app/providers.tsx`

## 5) 디렉토리 구조(실제)

```
doctor_han/
├── app/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (page)/              # UI 페이지
│   │   │   └── api/                 # BFF API Routes
│   │   ├── api-client/              # Axios 기반 클라이언트
│   │   ├── lib/
│   │   │   ├── schema/              # Zod 스키마
│   │   │   └── database.types.ts    # Supabase 타입(자동 생성)
│   │   └── server/
│   │       ├── api/                 # withApi/ok/fail/errors
│   │       ├── auth/                # 인증/인가 가드
│   │       ├── supabase/            # server/browser/admin client
│   │       └── <domain>/            # 도메인별 repository/mapper/...
│   ├── supabase/
│   │   └── migrations/              # SQL 마이그레이션
│   └── doc/
│       └── domains/                 # 도메인 PRD
├── .claude/                          # Claude Pack(이 폴더)
└── .agents/                          # 계획 저장소
```

## 6) 참고(실제 파일)

- API 표준: `app/src/server/api/with-api.ts`
- 응답 포맷: `app/src/server/api/response.ts`
- 인증/인가: `app/src/server/auth/guards.ts`
- Supabase server client: `app/src/server/supabase/server.ts`
- 마이그레이션: `app/supabase/migrations/*.sql`

