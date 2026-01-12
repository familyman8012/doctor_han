# Supabase Patterns - Medihub

## 클라이언트 설정

### 서버 클라이언트 (API Routes용)
```typescript
// src/server/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing SUPABASE env");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서는 set이 불가능할 수 있다
        }
      },
    },
  });
}
```

### 브라우저 클라이언트 (Auth/Storage용)
```typescript
// src/server/supabase/browser.ts
import { createBrowserClient } from '@supabase/ssr';

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing SUPABASE env");
  }

  cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}
```

### Admin 클라이언트 (Service Role용)
```typescript
// src/server/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE env for admin");
  }

  // service_role 키 사용 - RLS 우회
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
```

## 데이터베이스 쿼리

### 기본 CRUD
```typescript
// SELECT
const { data, error } = await supabase
  .from('vendors')
  .select('*')
  .eq('status', 'active');

// SELECT with relations (vendor_categories 조인 테이블 사용)
const { data, error } = await supabase
  .from('vendors')
  .select(`
    *,
    vendor_categories (
      categories (id, name)
    ),
    reviews (id, rating, content)
  `)
  .eq('id', vendorId)
  .single();

// INSERT
const { data, error } = await supabase
  .from('vendors')
  .insert({
    name: 'New Company',
    owner_user_id: userId
  })
  .select()
  .single();

// UPDATE
const { data, error } = await supabase
  .from('vendors')
  .update({ name: 'Updated Name' })
  .eq('id', vendorId)
  .select()
  .single();

// DELETE
const { error } = await supabase
  .from('vendors')
  .delete()
  .eq('id', vendorId);
```

### 필터링
```typescript
// 기본 필터
.eq('column', value)       // column = value
.neq('column', value)      // column != value
.gt('column', value)       // column > value
.gte('column', value)      // column >= value
.lt('column', value)       // column < value
.lte('column', value)      // column <= value
.like('column', '%value%') // LIKE (대소문자 구분)
.ilike('column', '%value%')// ILIKE (대소문자 무시)
.is('column', null)        // column IS NULL
.in('column', [1, 2, 3])   // column IN (1, 2, 3)

// 복합 필터
const { data } = await supabase
  .from('vendors')
  .select('*')
  // 공개 노출은 RLS (public.is_vendor_public)로 기본 제어됨
  // 필요 시 추가 필터를 붙인다:
  .eq('status', 'active')
  .gte('rating_avg', 4)
  .order('created_at', { ascending: false })
  .range(0, 19);  // 페이지네이션 (0-19 = 20개)
```

### 검색
```typescript
// Full-text search
const { data } = await supabase
  .from('vendors')
  .select('*')
  .textSearch('search_column', 'search query', {
    type: 'websearch',
    config: 'korean'
  });

// OR 조건 검색
const { data } = await supabase
  .from('vendors')
  .select('*')
  .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
```

### 페이지네이션
```typescript
const page = 1;
const limit = 20;

const { data, error, count } = await supabase
  .from('vendors')
  .select('*', { count: 'exact' })
  .range((page - 1) * limit, page * limit - 1);

const totalPages = Math.ceil((count || 0) / limit);
```

## 인증 (Auth)

### 회원가입
```typescript
// 브라우저에서 직접 호출 가능
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: '홍길동',
      role: 'doctor'
    }
  }
});
```

### 로그인
```typescript
// 이메일/비밀번호 로그인
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// OAuth 로그인
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'kakao',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
```

### 로그아웃
```typescript
const { error } = await supabase.auth.signOut();
```

### 현재 사용자
```typescript
// 서버 사이드
const { data: { user }, error } = await supabase.auth.getUser();

// 클라이언트 사이드 (세션 리스너)
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log(event, session);
  }
);
```

## Storage

### 파일 업로드
```typescript
// ✅ 원칙: 서버가 Signed Upload URL 발급 → 클라이언트는 Signed URL로만 업로드
// 1) 서버에 signed-upload 요청
import api from "@/api-client/client";
import type { FileSignedUploadResponse } from "@/lib/schema/file";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

const signedRes = await api.post<FileSignedUploadResponse>("/api/files/signed-upload", {
  purpose: "portfolio",
  fileName: file.name,
  mimeType: file.type,
  sizeBytes: file.size,
});

const { bucket, path, token } = signedRes.data.data.upload;
const fileId = signedRes.data.data.file.id;

// 2) Supabase Storage signed URL로 업로드 (uploadToSignedUrl)
const supabase = getSupabaseBrowserClient();
const { error: uploadError } = await supabase.storage
  .from(bucket)
  .uploadToSignedUrl(path, token, file, { cacheControl: "3600" });

if (uploadError) throw uploadError;

// 이후 도메인 API에 fileId를 전달해 연관시킨다.
```

### 파일 다운로드/URL
```typescript
// ✅ 원칙: 서버에서 권한 확인 후 Signed Download URL 발급
// 1) signed URL JSON 응답
const downloadRes = await api.get<{ data: { signedUrl: string; expiresIn: number } }>(
  `/api/files/signed-download?fileId=${fileId}`
);
window.location.href = downloadRes.data.data.signedUrl;

// 2) 또는 redirect 엔드포인트 사용 (브라우저에서 바로 열기)
window.open(`/api/files/open?fileId=${fileId}`, "_blank");
```

### 파일 삭제
스토리지 삭제/정리는 서버에서 정책적으로 처리한다. (클라이언트에서 `remove()` 직접 호출 금지)

## RLS (Row Level Security)

### 헬퍼 함수
```sql
-- 관리자 확인 함수
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 업체 소유자 확인 함수
CREATE OR REPLACE FUNCTION public.is_vendor_owner(vendor_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_id AND v.owner_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 업체 공개 여부 확인 함수
CREATE OR REPLACE FUNCTION public.is_vendor_public(vendor_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vendors v
    JOIN vendor_verifications vv ON vv.user_id = v.owner_user_id
    WHERE v.id = vendor_id
      AND v.status = 'active'
      AND vv.status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 기본 정책
```sql
-- 테이블에 RLS 활성화
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- 공개된 업체 조회 (is_vendor_public 함수 사용)
CREATE POLICY "vendors_select_public" ON vendors
  FOR SELECT USING (public.is_vendor_public(id));

-- 소유자 본인 조회
CREATE POLICY "vendors_select_owner" ON vendors
  FOR SELECT USING (owner_user_id = auth.uid());

-- 소유자 생성 (vendor role만)
CREATE POLICY "vendors_insert_owner" ON vendors
  FOR INSERT WITH CHECK (
    owner_user_id = auth.uid()
    AND public.current_profile_role() = 'vendor'
  );

-- 본인 데이터만 UPDATE
CREATE POLICY "vendors_update_own" ON vendors
  FOR UPDATE USING (owner_user_id = auth.uid());

-- 관리자 전체 작업 (is_admin 함수 사용)
CREATE POLICY "vendors_admin_all" ON vendors
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

### 조인 테이블 정책
```sql
-- vendor_categories 테이블 정책 예시
CREATE POLICY "vendor_categories_select_public" ON vendor_categories
  FOR SELECT USING (public.is_vendor_public(vendor_id));

CREATE POLICY "vendor_categories_owner_all" ON vendor_categories
  FOR ALL
  USING (public.is_vendor_owner(vendor_id) OR public.is_admin())
  WITH CHECK (public.is_vendor_owner(vendor_id) OR public.is_admin());
```

## 마이그레이션

### 생성
```bash
cd app
pnpm db:new -- "create_vendors_table"
```

### 마이그레이션 파일 예시
```sql
-- supabase/migrations/20240101000000_create_vendors_table.sql

-- vendor_status enum 생성
CREATE TYPE public.vendor_status AS ENUM ('draft', 'active', 'inactive', 'banned');

-- 테이블 생성
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  region_primary TEXT,
  region_secondary TEXT,
  price_min INTEGER,
  price_max INTEGER,
  status public.vendor_status NOT NULL DEFAULT 'draft',
  rating_avg NUMERIC(2,1),
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_user_id)
);

-- 카테고리 연결 테이블
CREATE TABLE vendor_categories (
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vendor_id, category_id)
);

-- 인덱스
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_owner ON vendors(owner_user_id);
CREATE INDEX idx_vendor_categories_category ON vendor_categories(category_id);

-- RLS 활성화
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;

-- 정책
CREATE POLICY "vendors_select_public" ON vendors
  FOR SELECT USING (public.is_vendor_public(id));

CREATE POLICY "vendors_select_owner" ON vendors
  FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "vendors_update_own" ON vendors
  FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "vendors_admin_all" ON vendors
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 트리거: updated_at 자동 갱신
CREATE TRIGGER vendors_set_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

### 적용
```bash
cd app
pnpm db:reset    # 로컬 DB 초기화 (개발용)
pnpm db:migrate  # 마이그레이션 적용
pnpm db:gen -- --local  # 타입 생성
```

## 타입 생성

```bash
cd app
pnpm db:gen -- --local
```

생성된 타입 사용:
```typescript
import { Database } from '@/lib/database.types';

type Vendor = Database['public']['Tables']['vendors']['Row'];
type VendorInsert = Database['public']['Tables']['vendors']['Insert'];
type VendorUpdate = Database['public']['Tables']['vendors']['Update'];
```
