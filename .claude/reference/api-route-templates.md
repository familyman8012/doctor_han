# API Route 템플릿 (Medihub)

이 문서는 `app/src/app/api/**/route.ts` 구현을 위한 “복사-붙여넣기 템플릿”입니다.

## 0) 공통 import (권장)

```ts
import { ok, created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { internalServerError } from "@/server/api/errors";
import { createSupabaseServerClient } from "@/server/supabase/server";
```

인증/인가가 필요하면:

```ts
import { withAuth, withRole } from "@/server/auth/guards";
```

## 1) 목록/생성: `app/src/app/api/<resource>/route.ts`

### GET (목록)

```ts
import type { NextRequest } from "next/server";
import { <Resource>ListQuerySchema } from "@/lib/schema/<domain>";

export const GET = withApi(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = <Resource>ListQuerySchema.parse({
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  const supabase = await createSupabaseServerClient();

  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  const { data, error, count } = await supabase
    .from("<table_name>")
    .select("*", { count: "exact" })
    .range(from, to);

  if (error) {
    throw internalServerError("<리소스> 목록을 조회할 수 없습니다.", { message: error.message, code: error.code });
  }

  return ok({
    items: data ?? [],
    page: query.page,
    pageSize: query.pageSize,
    total: count ?? 0,
  });
});
```

### POST (생성, 인증 필요 예시)

```ts
import { <Resource>CreateBodySchema } from "@/lib/schema/<domain>";

export const POST = withApi(
  withRole(["vendor"], async (ctx) => {
    const body = <Resource>CreateBodySchema.parse(await ctx.req.json());

    const { data, error } = await ctx.supabase.from("<table_name>").insert({
      // ... body 매핑
    }).select("*").single();

    if (error) {
      throw internalServerError("<리소스> 생성에 실패했습니다.", { message: error.message, code: error.code });
    }

    return created({ item: data });
  }),
);
```

## 2) 상세/수정/삭제: `app/src/app/api/<resource>/[id]/route.ts`

```ts
import { zUuid } from "@/lib/schema/common";

export const GET = withApi(
  withRole<{ id: string }>(["doctor", "vendor", "admin"], async (ctx) => {
    const id = zUuid.parse(ctx.params.id);

    const { data, error } = await ctx.supabase.from("<table_name>").select("*").eq("id", id).maybeSingle();
    if (error) throw internalServerError("<리소스>를 조회할 수 없습니다.", { message: error.message, code: error.code });

    return ok({ item: data });
  }),
);
```

PATCH/DELETE도 동일한 형태로 확장합니다.

## 3) 체크리스트

- [ ] Query/Body가 Zod로 파싱되는가?
- [ ] 인증/인가가 필요한가? 필요하면 guards를 적용했는가?
- [ ] Supabase 에러를 `ApiError`로 변환해 메시지를 통제하는가?
- [ ] 응답이 `ok/created/fail` 포맷을 따르는가?

