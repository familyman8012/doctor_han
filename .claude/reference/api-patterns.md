# API 패턴 (BFF: `app/src/app/api/**/route.ts`)

이 문서는 Medihub의 BFF API 구현 패턴을 정리합니다. (Next.js 일반 규칙은 `.claude/reference/nextjs-patterns.md` 참고)

## 0) 핵심 원칙

1. **입력은 Zod로 파싱/검증**: Query/Body 모두 스키마를 거칩니다.
2. **에러는 throw, 응답은 표준화**: `withApi`가 예외를 `fail(...)`로 변환합니다.
3. **권한은 가드로 fail-fast**: `withUser/withAuth/withRole/...`로 서버에서 먼저 차단합니다.
4. **응답 포맷 통일**: `ok/created/fail`만 사용합니다.

## 1) 표준 유틸(필수)

- `app/src/server/api/with-api.ts`
- `app/src/server/api/response.ts`
- `app/src/server/api/errors.ts`
- `app/src/server/auth/guards.ts`

## 2) 기본 구조(권장)

### (A) List/Read-only Route (GET)

```ts
import { VendorListQuerySchema } from "@/lib/schema/vendor";
import { internalServerError } from "@/server/api/errors";
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
  const { data, error } = await supabase.from("vendors").select("*");
  if (error) {
    throw internalServerError("업체 목록을 조회할 수 없습니다.", { message: error.message, code: error.code });
  }

  return ok({ items: data ?? [], page: query.page, pageSize: query.pageSize, total: 0 });
});
```

### (B) Auth-required Route

```ts
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";

export const GET = withApi(
  withAuth(async (ctx) => {
    // ctx.user, ctx.profile, ctx.supabase
    return ok({ me: ctx.profile });
  }),
);
```

## 3) 입력 검증 규칙

### Query

- Query는 문자열 기반이므로 `z.coerce` 대신 “명시적 파싱” 또는 “프로젝트에서 합의된 스키마”로 처리합니다.
- 현재 구현은 Zod 스키마에서 `z.coerce.number()` 등을 사용하는 케이스가 있으므로, 변경 시 영향을 검토합니다.

### Body

- `await ctx.req.json()` 결과를 바로 사용하지 말고, Zod로 파싱합니다.

```ts
const body = VendorUpsertBodySchema.parse(await ctx.req.json());
```

## 4) 에러 처리 규칙

- `try/catch`로 개별 라우트에서 처리하지 않습니다(드리프트/중복 유발).
- `ApiError`를 던지고, 필요한 `details`만 포함합니다.

```ts
throw badRequest("존재하지 않는 카테고리가 포함되어 있습니다.", { code: error.code, message: error.message });
```

## 5) DB 접근 규칙

- API Route에서 DB를 직접 조회해도 되지만(단순한 경우), 재사용/복잡도가 올라가면 `app/src/server/<domain>/repository.ts`로 이동합니다.
- Row → DTO 변환은 `mapper.ts`로 이동합니다(특히 snake_case → camelCase).

## 6) 검증(필수)

```bash
cd app
pnpm lint
pnpm type-check
pnpm test
```

