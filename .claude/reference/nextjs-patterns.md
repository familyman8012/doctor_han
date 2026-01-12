# Next.js Patterns - Medihub

## App Router 구조

### 디렉토리 구조
```
src/app/
├── (page)/                 # 라우트 그룹 (URL에 미포함)
│   ├── layout.tsx          # 공통 레이아웃
│   ├── vendors/
│   │   ├── page.tsx        # /vendors
│   │   └── [id]/
│   │       └── page.tsx    # /vendors/:id
│   └── dashboard/
│       └── page.tsx        # /dashboard
├── api/                    # API Routes (BFF)
│   ├── vendors/
│   │   ├── route.ts        # GET, POST /api/vendors
│   │   └── [id]/
│   │       └── route.ts    # GET, PATCH, DELETE /api/vendors/:id
│   └── auth/
│       └── route.ts
└── layout.tsx              # 루트 레이아웃
```

### 라우트 그룹
```typescript
// (page) - URL에 영향 없이 레이아웃 공유
// (auth) - 인증 관련 페이지 그룹
// (admin) - 관리자 페이지 그룹
```

## API Routes (BFF Pattern)

### 표준 응답/에러 유틸
```typescript
// src/server/api/response.ts
import { ok, created } from '@/server/api/response';

// 성공 응답: { code: "0000", data: T, message?: string }
return ok({ items: vendors });         // 200
return created({ vendor: newVendor }); // 201

// src/server/api/errors.ts
import { badRequest, notFound, unauthorized, forbidden } from '@/server/api/errors';

throw badRequest("잘못된 요청입니다.");     // 400, code: "4000"
throw notFound("리소스를 찾을 수 없습니다."); // 404, code: "4040"
throw unauthorized("인증이 필요합니다.");   // 401, code: "8999"
throw forbidden("권한이 없습니다.");        // 403, code: "8991"

// src/server/api/with-api.ts
// ApiError, ZodError를 자동으로 캐치하여 표준 에러 응답으로 변환
export const GET = withApi(async (request) => {
  // 비즈니스 로직
  // throw로 에러 발생 시 자동 처리됨
  return ok(data);
});
```

### 기본 패턴
```typescript
// src/app/api/vendors/route.ts
import { createSupabaseServerClient } from '@/server/supabase/server';
import { ok, created } from '@/server/api/response';
import { withApi } from '@/server/api/with-api';
import { badRequest, unauthorized } from '@/server/api/errors';
import { NextRequest } from 'next/server';
import { VendorUpsertBodySchema } from '@/lib/schema/vendor';

export const GET = withApi(async (request: NextRequest) => {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);

  const categoryId = searchParams.get('categoryId');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  let query = supabase
    .from('vendors')
    .select('*, vendor_categories(categories(*))', { count: 'exact' })
    .eq('status', 'active')
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (categoryId) {
    query = query.eq('vendor_categories.category_id', categoryId);
  }

  const { data, error, count } = await query;

  if (error) throw badRequest(error.message);

  return ok({
    items: data,
    page,
    pageSize,
    total: count ?? 0,
  });
});

export const POST = withApi(async (request: NextRequest) => {
  const supabase = await createSupabaseServerClient();

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw unauthorized();

  // 입력 검증 (withApi가 ZodError 자동 처리)
  const body = await request.json();
  const validated = VendorUpsertBodySchema.parse(body);

  // 데이터 저장
  const { data, error } = await supabase
    .from('vendors')
    .insert({ ...validated, owner_user_id: user.id })
    .select()
    .single();

  if (error) throw badRequest(error.message);

  return created({ vendor: data });
});
```

### 동적 라우트 패턴
```typescript
// src/app/api/vendors/[id]/route.ts
import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/server/supabase/server';
import { ok } from '@/server/api/response';
import { withApi } from '@/server/api/with-api';
import { notFound, badRequest } from '@/server/api/errors';

type Params = { params: Promise<{ id: string }> };

export const GET = withApi(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('vendors')
    .select('*, vendor_categories(categories(*)), reviews(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw notFound();
    throw badRequest(error.message);
  }

  return ok({ vendor: data });
});

export const PATCH = withApi(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('vendors')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) throw badRequest(error.message);

  return ok({ vendor: data });
});

export const DELETE = withApi(async (request: NextRequest, { params }: Params) => {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', id);

  if (error) throw badRequest(error.message);

  return ok({ deleted: true });
});
```

## 페이지 컴포넌트

### 서버 컴포넌트 (기본)
```typescript
// src/app/(page)/vendors/page.tsx
import { VendorList } from './component/VendorList';
import { VendorFilter } from './component/VendorFilter';

export default function VendorsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">업체 목록</h1>
      <VendorFilter />
      <VendorList />
    </main>
  );
}
```

### 클라이언트 컴포넌트
```typescript
// src/app/(page)/vendors/component/VendorList.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/api-client/client';
import type { VendorListItem } from '@/lib/schema/vendor';
import { VendorCard } from './VendorCard';

export function VendorList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vendors', { page: 1, pageSize: 20 }],
    queryFn: async () => {
      const response = await api.get<{ data: { items: VendorListItem[] } }>('/api/vendors', {
        params: { page: 1, pageSize: 20 },
      });
      return response.data.data.items;
    },
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  );
}
```

## 미들웨어

### 인증 미들웨어
```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 보호된 라우트 체크
  const protectedRoutes = ['/dashboard', '/profile', '/admin'];
  const isProtected = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## 에러 처리

### 에러 바운더리
```typescript
// src/app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold mb-4">문제가 발생했습니다</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        다시 시도
      </button>
    </div>
  );
}
```

### Not Found
```typescript
// src/app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">페이지를 찾을 수 없습니다</h2>
      <a href="/" className="text-blue-500 hover:underline">
        홈으로 돌아가기
      </a>
    </div>
  );
}
```

## 메타데이터

```typescript
// src/app/(page)/vendors/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '업체 목록 - Medihub',
  description: '의료 관련 업체를 검색하고 비교하세요',
};
```

## 환경 변수

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 서버 전용
```
