# Frontend Patterns - Medihub

## React Query 패턴

### 기본 사용법
```typescript
// ✅ 컴포넌트에서 직접 사용 (커스텀 훅 X)
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api-client/client';
import type { VendorListItem } from '@/lib/schema/vendor';

export function VendorList() {
  const queryClient = useQueryClient();

  // 데이터 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['vendors', { page: 1, pageSize: 20 }],
    queryFn: async () => {
      const response = await api.get<{
        data: { items: VendorListItem[]; page: number; pageSize: number; total: number };
      }>('/api/vendors', { params: { page: 1, pageSize: 20 } });
      return response.data.data;
    },
  });

  // 예시: 데이터 생성/수정은 BFF API Route를 통해서만 수행
  const createMutation = useMutation({
    mutationFn: async (payload: unknown) => api.post('/api/vendors/me', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    }
    // ❌ onError는 작성하지 않음 - 중앙 핸들러 사용
  });

  if (isLoading) return <VendorListSkeleton />;
  if (error) return <ErrorMessage />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data?.items.map((vendor) => (
        <VendorCard
          key={vendor.id}
          vendor={vendor}
        />
      ))}
    </div>
  );
}

// ❌ 금지: 커스텀 훅으로 감싸기
// export const useVendors = () => useQuery({...})
```

### Query Key 패턴
```typescript
// 계층적 키 구조
queryKey: ['vendors']                    // 전체 목록
queryKey: ['vendors', { category: 'A' }] // 필터링된 목록
queryKey: ['vendors', id]                // 단일 항목
queryKey: ['vendors', id, 'reviews']     // 관련 데이터

// 무효화 시 계층 활용
queryClient.invalidateQueries({ queryKey: ['vendors'] }); // 모든 vendors 관련 캐시 무효화
queryClient.invalidateQueries({ queryKey: ['vendors', id] }); // 특정 vendor만 무효화
```

### 필터링과 페이지네이션
```typescript
export function VendorList() {
  const [filter, setFilter] = useState({ categoryId: null, page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.categoryId) params.set('categoryId', filter.categoryId);
      params.set('page', String(filter.page));
      params.set('pageSize', '20');

      const response = await api.get<{
        data: { items: VendorListItem[]; page: number; pageSize: number; total: number };
      }>(`/api/vendors?${params.toString()}`);
      return response.data.data;
    },
    placeholderData: keepPreviousData, // 페이지 전환 시 이전 데이터 유지
  });

  return (
    <>
      <VendorFilter value={filter} onChange={setFilter} />
      {data?.items.map(vendor => <VendorCard key={vendor.id} vendor={vendor} />)}
      <Pagination
        current={filter.page}
        total={Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20))}
        onChange={(page) => setFilter(prev => ({ ...prev, page }))}
      />
    </>
  );
}
```

## API Client 패턴

### 클라이언트 구조
```typescript
// src/api-client/vendors.ts (선택: 반복 호출이 많을 때만 추가)
import api from '@/api-client/client';
import type { VendorDetail, VendorListItem, VendorPatchBody, VendorUpsertBody } from '@/lib/schema/vendor';

export const vendorsApi = {
  list: async (params: { q?: string; categoryId?: string; page: number; pageSize: number }) => {
    const response = await api.get<{
      data: { items: VendorListItem[]; page: number; pageSize: number; total: number };
    }>('/api/vendors', { params });
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await api.get<{ data: { vendor: VendorDetail } }>(`/api/vendors/${id}`);
    return response.data.data.vendor;
  },

  getMe: async () => {
    const response = await api.get<{ data: { vendor: VendorDetail | null } }>('/api/vendors/me');
    return response.data.data.vendor;
  },

  createMe: async (body: VendorUpsertBody) => {
    const response = await api.post<{ data: { vendor: VendorDetail } }>('/api/vendors/me', body);
    return response.data.data.vendor;
  },

  patchMe: async (body: VendorPatchBody) => {
    const response = await api.patch<{ data: { vendor: VendorDetail } }>('/api/vendors/me', body);
    return response.data.data.vendor;
  },
};
```

### Axios 인스턴스 설정
```typescript
// src/api-client/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  adapter: 'fetch',
});

// 모든 요청에 쿠키 포함 (Supabase 세션)
api.interceptors.request.use((config) => {
  config.withCredentials = true;
  return config;
});

// 응답 인터셉터 - code !== "0000"이면 reject
api.interceptors.response.use(
  (response) => {
    if (response.data?.code && response.data.code !== '0000') {
      return Promise.reject(response.data);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
```

### 중앙 에러 핸들러
```typescript
// src/api-client/error-handler.ts
import { toast } from 'sonner';

interface ServerError {
  code: string;
  message?: string;
}

export const errorHandler = (errorData: unknown): void => {
  const { code, message } = errorData as ServerError;

  // 8xxx: 인증 에러 특별 처리
  if (Number(code) >= 8000 && Number(code) < 9000) {
    toast.error(message || '인증 오류');
    if (code === '8999') {
      // 로그아웃 처리 후 홈으로 이동
    }
    return;
  }

  // 일반 에러
  toast.error(message || '요청 처리에 실패했습니다.');
};

// ✅ 이 레포는 QueryCache/MutationCache로 중앙 에러 처리
// 참고: src/app/providers.tsx
```

## React Hook Form 패턴

### 기본 사용법
```typescript
// ✅ JSX 내에서 자연스럽게 register 사용
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VendorUpsertBodySchema, type VendorUpsertBody } from '@/lib/schema/vendor';

export function VendorForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<VendorUpsertBody>({
    resolver: zodResolver(VendorUpsertBodySchema),
  });

  const onSubmit = async (data: VendorUpsertBody) => {
    // mutation 호출
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">업체명</label>
        <input
          {...register('name')}
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">설명</label>
        <textarea
          {...register('description')}
          className="w-full px-3 py-2 border rounded-md"
          rows={4}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
      >
        {isSubmitting ? '저장 중...' : '저장'}
      </button>
    </form>
  );
}

// ❌ 금지: 메타 객체 배열 형식
// const fields = [{ name: 'name', label: '업체명', ... }]
```

### Controller 사용 (커스텀 컴포넌트)
```typescript
import { Controller, useForm } from 'react-hook-form';
import { Select } from '@/components/ui/Select';

export function VendorForm() {
  const { control, handleSubmit } = useForm<VendorCreate>();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="categoryIds"
        control={control}
        rules={{ required: '카테고리 필수' }}
        render={({ field, fieldState }) => (
          <Select
            {...field}
            options={categories}
            error={fieldState.error?.message}
          />
        )}
      />
    </form>
  );
}
```

## URL 상태 관리 (nuqs)

### 필터 상태 URL 동기화
```typescript
// src/app/(page)/vendors/page.tsx
'use client';

import { useQueryState, parseAsString, parseAsInteger } from 'nuqs';

export function VendorFilter() {
  const [category, setCategory] = useQueryState('category', parseAsString);
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('created_at'));

  // URL: /vendors?category=medical&page=2&sort=rating

  return (
    <div className="flex gap-4">
      <Select
        value={category}
        onChange={(value) => setCategory(value)}
        options={categoryOptions}
      />
      <Select
        value={sort}
        onChange={(value) => setSort(value)}
        options={sortOptions}
      />
    </div>
  );
}
```

## Zustand 상태 관리

### 전역 상태 스토어
```typescript
// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
```

### 사용 예시
```typescript
export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  return (
    <div className="flex items-center gap-4">
      <span>{user?.name}</span>
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}
```

## 컴포넌트 구조

### 페이지별 파일 구조
```
src/app/(page)/vendors/
├── page.tsx              # 페이지 컴포넌트
├── component/
│   ├── VendorCard.tsx    # 목록 카드
│   ├── VendorFilter.tsx  # 필터 UI
│   ├── VendorDetail.tsx  # 상세 정보
│   └── modal/
│       ├── ContactModal.tsx
│       └── ReviewModal.tsx
├── utils.ts              # 유틸 함수 (1개 파일에 모음)
└── constants.ts          # 상수 (1개 파일에 모음)
```

### 공통 컴포넌트
```
src/components/
├── ui/                   # 기본 UI (Button, Input, Modal...)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── Select.tsx
└── widgets/              # 기능성 컴포넌트
    ├── Header.tsx
    ├── Footer.tsx
    └── Sidebar.tsx
```

## Tailwind CSS 순서

```typescript
// 순서: 레이아웃 → 박스 모델 → 텍스트 → UI → 기타
<div className="
  flex items-center justify-between    {/* 1. 레이아웃 */}
  w-full h-16 px-4 py-2               {/* 2. 박스 모델 */}
  text-lg font-medium text-gray-800   {/* 3. 텍스트 */}
  cursor-pointer hover:opacity-80     {/* 4. UI */}
  border-b bg-white shadow-sm         {/* 5. 기타 */}
">
```

## 로딩/에러 상태

### 스켈레톤 UI
```typescript
export function VendorCardSkeleton() {
  return (
    <div className="animate-pulse p-4 border rounded-lg">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

export function VendorListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <VendorCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### 에러 표시
```typescript
export function ErrorMessage({ message = '오류가 발생했습니다' }) {
  return (
    <div className="p-4 bg-red-50 text-red-700 rounded-lg">
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({ message = '데이터가 없습니다' }) {
  return (
    <div className="py-12 text-center text-gray-500">
      <p>{message}</p>
    </div>
  );
}
```
