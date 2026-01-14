# Server 도메인 모듈 패턴 (repository / mapper / service)

Medihub의 서버 코드는 “도메인 모듈” 단위로 응집합니다.

## 0) 목적

- API Route(`app/src/app/api/**/route.ts`)를 **얇게 유지**
- Supabase 쿼리/변환 로직을 **재사용 가능한 위치로 이동**
- 도메인 규칙(정책/불변 조건)을 한 곳에서 관리

## 1) 디렉토리 구조(권장)

```
app/src/server/<domain>/
├── repository.ts   # Supabase 쿼리(조회/변경)
├── mapper.ts       # Row → DTO 변환
└── service.ts      # 복합 로직(필요할 때만)
```

### 불변 규칙

- `app/src/server/**`는 서버 전용이어야 합니다(`import "server-only";`).
- 브라우저에서 DB 호출이 섞이지 않도록, 도메인 모듈은 UI에서 직접 import 하지 않습니다.

## 2) Repository 패턴

### 기본 형태

```ts
import "server-only";

import type { Database, Tables } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchSomething(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  type Row = Tables<"some_table">;
  const { data, error } = await supabase.from("some_table").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw internalServerError("조회에 실패했습니다.", { message: error.message, code: error.code });
  }
  return data as Row | null;
}
```

### 목록 + 페이징

Supabase는 `range(from, to)`를 사용합니다.

```ts
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;

const { data, error, count } = await supabase
  .from("vendors")
  .select("*", { count: "exact" })
  .order("created_at", { ascending: false })
  .range(from, to);

if (error) throw internalServerError("목록 조회 실패", { message: error.message, code: error.code });
return { items: data ?? [], total: count ?? 0 };
```

## 3) Mapper 패턴

### Row → DTO

```ts
import type { Tables } from "@/lib/database.types";
import type { VendorListItem } from "@/lib/schema/vendor";

type VendorRow = Tables<"vendors">;

export function mapVendorListItem(row: VendorRow): VendorListItem {
  return {
    id: row.id,
    name: row.name,
    regionPrimary: row.region_primary,
    // snake_case → camelCase
  };
}
```

## 4) Service 패턴(선택)

복합 규칙(여러 테이블 연동, 정책 검증, 작업 단위 분리)이 있을 때만 `service.ts`를 둡니다.

권장 규칙:

- service는 가능한 “I/O(쿼리)”를 repository에 위임하고, 자신은 “정책/조합”에 집중합니다.
- 한 함수가 너무 많은 책임을 갖기 시작하면 “유스케이스 단위 함수”로 분리합니다.

## 5) 테스트 전략(요약)

- 도메인 규칙이 복잡해질 때만 테스트를 추가합니다(YAGNI).
- 가능한 한 “I/O 없는 순수 함수(매퍼/검증 로직)”부터 테스트합니다.

