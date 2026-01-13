# Code Generator Skill

## 목적

프로젝트 패턴에 맞는 코드 생성을 위한 스킬

## 트리거

- "API 만들어줘"
- "컴포넌트 생성해줘"
- "스키마 작성해줘"
- "마이그레이션 만들어줘"

## 코드 템플릿

### API Route (GET/POST)
```typescript
// app/src/app/api/[resource]/route.ts
import type { NextRequest } from "next/server";
import { withApi } from "@/server/api/with-api";
import { created, ok } from "@/server/api/response";
import { internalServerError } from "@/server/api/errors";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { withAuth } from "@/server/auth/guards";
import { ${resource}CreateSchema } from "@/lib/schema/${resource}";

// Public list (또는 RLS로 공개 범위 제어)
export const GET = withApi(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");

  const supabase = await createSupabaseServerClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("${table}")
    .select("*", { count: "exact" })
    .range(from, to);

  if (error) {
    throw internalServerError("목록을 조회할 수 없습니다.", { message: error.message, code: error.code });
  }

  return ok({ items: data ?? [], page, pageSize, total: count ?? 0 });
});

// Auth required example (역할 제한은 withRole/withApprovedDoctor/withApprovedVendor 등으로 확장)
export const POST = withApi(
  withAuth(async (ctx) => {
    const body = ${resource}CreateSchema.parse(await ctx.req.json());

    const { data, error } = await ctx.supabase
      .from("${table}")
      .insert(body)
      .select("*")
      .single();

    if (error) {
      throw internalServerError("생성에 실패했습니다.", { message: error.message, code: error.code });
    }

    return created({ item: data });
  }),
);
```

### API Route (GET/PATCH/DELETE by ID)
```typescript
// app/src/app/api/[resource]/[id]/route.ts
import type { NextRequest } from "next/server";
import { zUuid } from "@/lib/schema/common";
import { withApi } from "@/server/api/with-api";
import { ok } from "@/server/api/response";
import { internalServerError, notFound } from "@/server/api/errors";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { withRole } from "@/server/auth/guards";
import { ${resource}UpdateSchema } from "@/lib/schema/${resource}";

type Params = { id: string };
type RouteContext = { params: Promise<Params> };

export const GET = withApi(async (_req: NextRequest, routeCtx: RouteContext) => {
  const id = zUuid.parse((await routeCtx.params).id);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("${table}").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw internalServerError("리소스를 조회할 수 없습니다.", { message: error.message, code: error.code });
  }

  if (!data) {
    throw notFound("리소스를 찾을 수 없습니다.");
  }

  return ok({ item: data });
});

// 필요할 때만 사용 (예: 관리자 전용)
export const PATCH = withApi(
  withRole<Params>(["admin"], async (ctx) => {
    const id = zUuid.parse(ctx.params.id);
    const body = ${resource}UpdateSchema.parse(await ctx.req.json());

    const { data, error } = await ctx.supabase.from("${table}").update(body).eq("id", id).select("*").single();

    if (error) {
      throw internalServerError("리소스를 수정할 수 없습니다.", { message: error.message, code: error.code });
    }

    return ok({ item: data });
  }),
);

export const DELETE = withApi(
  withRole<Params>(["admin"], async (ctx) => {
    const id = zUuid.parse(ctx.params.id);
    const { error } = await ctx.supabase.from("${table}").delete().eq("id", id);

    if (error) {
      throw internalServerError("리소스를 삭제할 수 없습니다.", { message: error.message, code: error.code });
    }

    return ok({ deleted: true });
  }),
);
```

### Zod Schema
```typescript
// app/src/lib/schema/${resource}.ts
import { z } from 'zod';

export const ${resource}CreateSchema = z.object({
  name: z.string().min(1, '필수 입력'),
  description: z.string().optional(),
  // 추가 필드...
});

export const ${resource}UpdateSchema = ${resource}CreateSchema.partial();

export type ${Resource}Create = z.infer<typeof ${resource}CreateSchema>;
export type ${Resource}Update = z.infer<typeof ${resource}UpdateSchema>;
```

### API Client
```typescript
// app/src/api-client/${resource}.ts
import type { ${Resource}Create, ${Resource}Update } from '@/lib/schema/${resource}';
import api from '@/api-client/client';

export const ${resource}Api = {
  getAll: async (params?: Record<string, unknown>) => {
    const response = await api.get(`/api/${resource}`, { params });
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/${resource}/${id}`);
    return response.data.data;
  },

  create: async (data: ${Resource}Create) => {
    const response = await api.post(`/api/${resource}`, data);
    return response.data.data;
  },

  update: async (id: string, data: ${Resource}Update) => {
    const response = await api.patch(`/api/${resource}/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string) => {
    await api.delete(`/api/${resource}/${id}`);
  }
};
```

### Page Component
```typescript
// app/src/app/(page)/${resource}/page.tsx
import { ${Resource}List } from './component/${Resource}List';
import { ${Resource}Filter } from './component/${Resource}Filter';

export default function ${Resource}Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">${한글명} 목록</h1>
      <${Resource}Filter />
      <${Resource}List />
    </main>
  );
}
```

### List Component
```typescript
// app/src/app/(page)/${resource}/component/${Resource}List.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { ${resource}Api } from '@/api-client/${resource}';
import { ${Resource}Card } from './${Resource}Card';

export function ${Resource}List() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['${resource}'],
    queryFn: () => ${resource}Api.getAll(),
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.data.map((item) => (
        <${Resource}Card key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### Migration
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_${table}.sql

CREATE TABLE ${table} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_${table}_status ON ${table}(status);

-- RLS
ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "${table}_select_all" ON ${table}
  FOR SELECT USING (true);

-- 트리거
CREATE TRIGGER ${table}_set_updated_at
  BEFORE UPDATE ON ${table}
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

## 사용법

### API 생성
```
"vendors API 만들어줘"
→ route.ts, [id]/route.ts, schema, api-client 생성

"leads POST API만 추가해줘"
→ 기존 route.ts에 POST 핸들러만 추가
```

### 컴포넌트 생성
```
"VendorCard 컴포넌트 만들어줘"
→ 기존 패턴 참조하여 컴포넌트 생성

"vendors 페이지 구조 만들어줘"
→ page.tsx, component/ 폴더 구조 생성
```

### 마이그레이션 생성
```
"vendors 테이블 마이그레이션 만들어줘"
→ 스키마 기반 SQL 생성
```

## 규칙

1. **패턴 준수**: 기존 코드베이스의 패턴 정확히 따르기
2. **최소 생성**: 필요한 파일만 생성
3. **BFF 원칙**: 브라우저에서 DB 직접 호출 금지
4. **타입 안전**: Zod + TypeScript 타입 연동
