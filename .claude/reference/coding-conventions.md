# Coding Conventions - Medihub

## 핵심 원칙

### 1. BFF (Backend for Frontend) 패턴
```typescript
// ❌ 금지: 브라우저에서 Supabase 직접 호출
const { data } = await supabase.from('vendors').select('*');

// ✅ 허용: API Route를 통한 호출
const { data } = await fetch('/api/vendors');

// ✅ 예외: Auth (supabase.auth.*)
await supabase.auth.signInWithPassword({ email, password });

// ✅ 예외: Storage (Signed URL 업/다운로드)
// 서버에서 signed-upload 발급 → 클라에서 uploadToSignedUrl로 업로드
await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file);
```

### 2. 간결한 코드 스타일
```typescript
// ✅ 선호: 체이닝, 인라인 표현
const activeVendors = data.items.filter(v => v.status === 'active').map(v => v.name);

// ❌ 피하기: 불필요한 변수 분리
const items = data.items;
const filtered = items.filter(v => v.status === 'active');
const names = filtered.map(v => v.name);
```

### 3. ES6+ 적극 활용
```typescript
// Destructuring
const { id, name, email } = user;
const [first, ...rest] = items;

// Spread operator
const updated = { ...vendor, status: 'active' };

// Optional chaining & Nullish coalescing
const name = user?.profile?.name ?? 'Unknown';

// Template literals
const url = `/api/vendors/${id}`;
```

## 네이밍 컨벤션

### 파일명
```
# 컴포넌트: PascalCase
VendorCard.tsx
VendorListSkeleton.tsx

# 유틸/훅/API: camelCase
utils.ts
constants.ts

# 라우트: kebab-case 또는 [param]
vendors/
[id]/
api/vendors/route.ts
```

### 변수/함수
```typescript
// 변수: camelCase
const vendorList = [];
const isLoading = true;
const hasPermission = false;

// 함수: camelCase, 동사로 시작
function getVendors() {}
function createVendor() {}
function updateVendor() {}
function deleteVendor() {}
function handleClick() {}
function formatDate() {}

// 상수: SCREAMING_SNAKE_CASE
const API_BASE_URL = '/api';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 20;

// Boolean: is/has/should/can 접두사
const isActive = true;
const hasError = false;
const shouldRefetch = true;
const canEdit = false;
```

### 컴포넌트
```typescript
// PascalCase
function VendorCard() {}
function VendorListSkeleton() {}

// Props 타입: [Component]Props
interface VendorCardProps {
  vendor: Vendor;
  onEdit: (id: string) => void;
}
```

### 타입/인터페이스
```typescript
// PascalCase
interface Vendor {}
type VendorStatus = 'draft' | 'active' | 'inactive' | 'banned';

// DTO 패턴: [Entity][Action]
interface VendorCreate {}
interface VendorUpdate {}
interface VendorResponse {}
```

## 파일 구조

### 페이지별 구조
```
src/app/(page)/vendors/
├── page.tsx              # 페이지 컴포넌트 (간결하게)
├── component/            # 페이지 전용 컴포넌트
│   ├── VendorCard.tsx
│   ├── VendorFilter.tsx
│   └── modal/            # 모달 컴포넌트
│       └── ContactModal.tsx
├── utils.ts              # 유틸 함수 (1개 파일)
└── constants.ts          # 상수 (1개 파일)
```

### 공통 구조
```
src/
├── api-client/           # API 클라이언트
│   ├── vendors.ts
│   └── auth.ts
├── components/
│   ├── ui/               # 기본 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   └── widgets/          # 기능성 컴포넌트
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/
│   ├── schema/           # Zod 스키마
│   │   ├── vendor.ts
│   │   └── lead.ts
│   ├── api/              # API 타입/유틸
│   ├── constants/        # 상수
│   └── database.types.ts # Supabase 자동생성 타입
├── server/
│   ├── api/              # withApi, ok/created/fail, errors
│   ├── auth/             # guards (withAuth/withRole/withApprovedDoctor...)
│   ├── supabase/         # server/browser/admin clients
│   └── ...               # 도메인별 server 모듈 (vendor/lead/review/...)
├── hooks/                # React hooks (필요 시)
├── stores/               # Zustand store
└── types/                # 공통 타입
```

## Tailwind CSS

### 클래스 순서
```
1. 레이아웃: overflow, display, position, flex, grid
2. 박스 모델: w-, h-, m-, p-
3. 텍스트: font-, text-, leading-, tracking-
4. UI: cursor-, opacity-
5. 기타: border-, shadow-, bg-
```

### 예시
```tsx
<div className="
  flex items-center justify-between    {/* 레이아웃 */}
  w-full h-16 px-4 py-2               {/* 박스 모델 */}
  text-lg font-medium text-gray-800   {/* 텍스트 */}
  cursor-pointer hover:opacity-80     {/* UI */}
  border-b bg-white shadow-sm         {/* 기타 */}
" />
```

### 반응형
```tsx
// 모바일 우선 접근
<div className="
  grid grid-cols-1          {/* 기본: 1열 */}
  md:grid-cols-2            {/* 768px 이상: 2열 */}
  lg:grid-cols-3            {/* 1024px 이상: 3열 */}
  gap-4
" />
```

## 코드 품질 규칙

### 피해야 할 것들
```typescript
// ❌ 불필요한 주석
// vendor를 가져온다
const vendor = await getVendor(id);

// ❌ 불필요한 docstring
/**
 * 벤더를 가져오는 함수
 * @param id - 벤더 ID
 * @returns 벤더 객체
 */
function getVendor(id: string) {}

// ❌ any 타입
const data: any = response;

// ❌ 매직 넘버
if (items.length > 10) {}

// ✅ 상수로 정의
const MAX_ITEMS = 10;
if (items.length > MAX_ITEMS) {}
```

### 선호하는 것들
```typescript
// ✅ 자명한 변수명으로 주석 대체
const activeVendors = vendors.filter(v => v.status === 'active');

// ✅ 명확한 타입
const data: VendorResponse = response;

// ✅ Early return
function getVendor(id: string) {
  if (!id) return null;
  // ...main logic
}

// ✅ Guard clause
function updateVendor(id: string, data: VendorUpdate) {
  const vendor = await getVendor(id);
  if (!vendor) throw new Error('Vendor not found');
  // ...update logic
}
```

## 에러 처리

### API Route
```typescript
// withApi 미들웨어로 자동 에러 처리
import { withApi } from '@/server/api/with-api';
import { badRequest, notFound, unauthorized } from '@/server/api/errors';
import { ok, created } from '@/server/api/response';

export const GET = withApi(async (request) => {
  // 에러 발생 시 throw
  throw badRequest("잘못된 요청입니다.");     // 400, code: "4000"
  throw notFound("리소스를 찾을 수 없습니다."); // 404, code: "4040"
  throw unauthorized("인증이 필요합니다.");   // 401, code: "8999"
});

// Zod 검증 - withApi가 ZodError 자동 캐치
const validated = SomeSchema.parse(body);
// 검증 실패 시 { code: "4000", message: "입력 검증 실패", details: [...] }

// 성공 응답
return ok({ items: vendors });         // 200, { code: "0000", data: ... }
return created({ vendor: newVendor }); // 201, { code: "0000", data: ... }
```

### 프론트엔드
```typescript
// ❌ 개별 onError 처리
useMutation({
  onError: (error) => {
    toast.error(error.message);
  }
});

// ✅ 중앙화된 에러 핸들러 (axios interceptor)
// 백엔드에서 도메인 메시지를 내려보내고
// 프론트 전역 핸들러가 토스트로 표시
```

## Import 순서

```typescript
// 1. 외부 라이브러리
import { NextRequest, NextResponse } from 'next/server';
import { useQuery } from '@tanstack/react-query';

// 2. 내부 모듈 (절대 경로)
import { createSupabaseServerClient } from '@/server/supabase/server';
import { VendorUpsertBodySchema } from '@/lib/schema/vendor';

// 3. 상대 경로 import
import { VendorCard } from './component/VendorCard';
import { formatDate } from './utils';

// 4. 타입 import (type 키워드 사용)
import type { Vendor, VendorCreate } from '@/types';
```

## 테스트 컨벤션

### 파일 위치
```
src/
├── app/
│   └── api/
│       └── vendors/
│           └── route.ts
└── __tests__/            # 또는 tests/
    └── api/
        └── vendors.test.ts
```

### 테스트 구조
```typescript
describe('Vendors API', () => {
  describe('GET /api/vendors', () => {
    it('should return public vendors', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should filter by category', async () => {
      // ...
    });
  });

  describe('POST /api/vendors', () => {
    it('should create vendor with valid data', async () => {
      // ...
    });

    it('should return 400 for invalid data', async () => {
      // ...
    });
  });
});
```
