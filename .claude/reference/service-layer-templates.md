# Server 도메인 모듈 템플릿 (Medihub)

이 문서는 `app/src/server/<domain>/` 아래에 새 모듈을 만들 때 쓰는 템플릿입니다.

## 1) `repository.ts` 템플릿

```ts
import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchById(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  const { data, error } = await supabase.from("<table_name>").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw internalServerError("<리소스>를 조회할 수 없습니다.", { message: error.message, code: error.code });
  }
  return data;
}
```

## 2) `mapper.ts` 템플릿

```ts
import type { Tables } from "@/lib/database.types";
import type { <Resource>Detail } from "@/lib/schema/<domain>";

type Row = Tables<"<table_name>">;

export function map<Resource>Detail(row: Row): <Resource>Detail {
  return {
    id: row.id,
    // TODO: snake_case → camelCase 매핑
  } as unknown as <Resource>Detail;
}
```

## 3) `service.ts` 템플릿(필요할 때만)

```ts
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function doUseCase(input: {
  supabase: SupabaseClient<Database>;
  actorUserId: string;
  // TODO: payload
}) {
  // TODO: 정책/조합 로직
}
```

## 4) 체크리스트

- [ ] API Route가 두꺼워지고 있지 않은가? (쿼리/매핑이 길면 server 모듈로 이동)
- [ ] 에러 메시지가 사용자/도메인 관점으로 통제되는가?
- [ ] DB 접근이 브라우저로 새지 않는가?

