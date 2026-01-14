# Next.js 패턴 (App Router)

이 문서는 Medihub에서 사용하는 Next.js(App Router) 구현 패턴을 정리합니다.

## 0) 핵심 원칙

1. **Server Action 금지**: Server Action/Form Action으로 데이터 변경하지 않습니다.
2. **BFF API Routes**: 데이터 통신은 `app/src/app/api/**/route.ts`에서만 처리합니다.
3. **Fail-fast**: 입력 검증(Zod)과 권한 가드로 초기에 실패시키고, `withApi`로 표준 에러 응답을 보장합니다.

## 1) 폴더/라우팅 구조

### UI 페이지

- `app/src/app/(page)/**/page.tsx`: 화면 단위 페이지
- 페이지 내부 구성은 “페이지별 폴더 + component/utils/constants”를 기본으로 합니다.

### BFF API Routes

- `app/src/app/api/**/route.ts`: API 엔드포인트(서버에서만 실행)
- 동적 라우트는 폴더로 표현: `.../[id]/route.ts`

예시(실제 파일):

- `app/src/app/api/vendors/route.ts`
- `app/src/app/api/vendors/[id]/route.ts`
- `app/src/app/api/vendors/me/route.ts`

## 2) 표준 API Route 패턴

### (A) 표준 유틸

- `app/src/server/api/with-api.ts`: 예외 표준화(`ApiError`, `ZodError` 처리)
- `app/src/server/api/response.ts`: `ok/created/fail` 응답 포맷
- `app/src/server/api/errors.ts`: 도메인 에러 생성기(`badRequest`, `notFound`, ...)
- `app/src/server/auth/guards.ts`: 인증/인가 가드(`withUser`, `withAuth`, `withRole`, ...)

### (B) 입력 검증(필수)

- Query/Body 모두 `app/src/lib/schema/*.ts`의 Zod 스키마로 파싱합니다.
- “파싱하지 않은 값”을 비즈니스 로직에 흘려보내지 않습니다.

실제 패턴(요약):

```ts
import { VendorListQuerySchema } from "@/lib/schema/vendor";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

export const GET = withApi(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = VendorListQuerySchema.parse({
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  const supabase = await createSupabaseServerClient();
  // ...
  return ok({ /* ... */ });
});
```

### (C) 인증/인가(필수)

- 인증이 필요한 엔드포인트는 `withUser/withAuth/withRole/withApprovedDoctor/withApprovedVendor`를 사용합니다.
- “프론트에서 숨김”은 보안이 아닙니다. 서버에서 반드시 막습니다.

실제 패턴(요약):

```ts
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";

export const POST = withApi(
  withRole(["vendor"], async (ctx) => {
    // ctx.user, ctx.profile, ctx.supabase 사용 가능
    return /* ok/created */;
  }),
);
```

### (D) 에러 처리(필수)

- 라우트 핸들러에서 `try/catch`로 개별 처리하지 않습니다(중복/드리프트 유발).
- 대신 `withApi` 내부에서 공통 처리합니다.
  - `ApiError` → `fail({status, code, message, details})`
  - `ZodError` → 400 + 입력 검증 실패
  - 그 외 → 500 + 안전한 메시지

## 3) Server/Client 구분

- `app/src/server/**`는 서버 전용이어야 합니다(`server-only` 사용).
- 브라우저에서 DB 접근을 막기 위해, Supabase DB 쿼리는 서버에서만 수행합니다.
  - 예외: Auth/Storage(서명 URL 업/다운로드 등)는 제품 정책에 따라 제한적으로 허용

## 4) 파라미터 타입/검증

- App Router의 route context params는 `Promise`로 전달됩니다.
- `guards.ts`는 `ctx.params`를 이미 resolve한 형태로 제공합니다.
- 동적 파라미터는 Zod로 검증합니다.

예시(요약):

```ts
import { zUuid } from "@/lib/schema/common";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";

export const DELETE = withApi(
  withRole<{ id: string }>(["vendor"], async (ctx) => {
    const id = zUuid.parse(ctx.params.id);
    // ...
    return ok({ id });
  }),
);
```

