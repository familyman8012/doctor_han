# Medihub (메디허브)

한의사와 의료 관련 업체를 연결하는 B2B 매칭 플랫폼 - "의료계의 크몽"

## Tech Stack

### Core
- **Framework**: Next.js 16+ (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS

### 상태 관리 & 데이터 페칭
- **서버 상태**: TanStack Query (React Query)
- **전역 상태**: Zustand
- **HTTP Client**: Axios
- **폼 관리**: React Hook Form + Zod
- **URL 상태**: nuqs (목록 페이지 필터)

### UI/UX
- **Toast**: Sonner
- **날짜**: dayjs
- **유틸**: lodash

## Project Structure

```
medihub/
├── app/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (page)/          # UI 페이지
│   │   │   └── api/             # BFF API Routes
│   │   ├── api-client/          # API 클라이언트
│   │   ├── components/
│   │   │   ├── ui/              # 기본 UI 컴포넌트
│   │   │   └── widgets/         # 기능성 컴포넌트
│   │   ├── lib/
│   │   │   ├── schema/          # Zod DTO/검증
│   │   │   └── database.types.ts # Supabase 자동생성 타입
│   │   └── server/
│   │       ├── api/             # API 응답/에러 유틸 (withApi, ok, fail)
│   │       ├── auth/            # 인증/인가 가드
│   │       ├── supabase/        # Supabase 클라이언트 (server/browser/admin)
│   │       └── ...              # 도메인별 server 모듈 (vendor/lead/review/...)
│   ├── supabase/
│   │   └── migrations/          # SQL 마이그레이션
│   └── doc/
│       ├── domains/             # 도메인별 PRD
│       ├── todo.md              # 개발 TODO
│       └── business.md          # 비즈니스 문서
├── .claude/
│   ├── PRD.md                   # 제품 요구사항
│   ├── commands/                # 사용자 정의 명령어
│   ├── agents/                  # 하위 에이전트 설정
│   └── reference/               # 참조 문서
└── .agents/
    └── plans/                   # 구현 계획 문서
```

## Commands

```bash
# 모든 pnpm 커맨드는 app/에서 실행
cd app

# Development
pnpm dev                          # Next.js 개발 서버

# Database (Supabase)
pnpm db:start                     # 로컬 Supabase 시작
pnpm db:stop                      # 로컬 Supabase 중지
pnpm db:status                    # 상태 확인
pnpm db:new -- "<name>"           # 새 마이그레이션 생성
pnpm db:reset                     # 로컬 DB 초기화
pnpm db:migrate                   # 마이그레이션 적용
pnpm db:gen -- --local            # 타입 생성 (로컬)

# Build & Test
pnpm build                        # 프로덕션 빌드
pnpm lint                         # ESLint
pnpm type-check                   # TypeScript 검사
pnpm test                         # 테스트 (현재는 placeholder)
```

## Reference Documentation

작업 영역에 따라 참조할 문서:

| Document | When to Read |
|----------|--------------|
| `.claude/PRD.md` | 전체 요구사항, 기능 범위, MVP 우선순위 |
| `.claude/reference/nextjs-patterns.md` | API Route, App Router |
| `.claude/reference/supabase-patterns.md` | DB 스키마, RLS, Auth, Storage |
| `.claude/reference/frontend-patterns.md` | React Query, 폼, 컴포넌트 패턴 |
| `.claude/reference/coding-conventions.md` | 코딩 스타일, 네이밍, 파일 구조 |
| `app/doc/todo.md` | 현재 개발 진행 상황 및 우선순위 |
| `app/doc/domains/*/prd.md` | 도메인별 상세 요구사항 |

## Code Conventions

### Data Access Principles (핵심)
```
❌ 금지: 브라우저에서 Supabase(DB) 직접 호출
✅ 허용: src/app/api/**/route.ts (BFF) + React Query
✅ 예외: Auth(supabase.auth.*), Storage(Signed URL 업/다운로드)
```

### Server Action 금지
- Next.js App Router의 Server Action / Form Action 사용 금지
- 모든 데이터 통신은 `src/app/api/**/route.ts`(BFF) + React Query로 통일

### API Route (BFF Pattern)
- 모든 데이터 통신은 `src/app/api/**/route.ts`에서 처리
- Zod 기반 입력 검증 (`src/lib/schema`)
- 공통 응답/에러 포맷 사용
- `service_role` 키는 서버 전용

### React Query 사용 패턴
```typescript
// ✅ 컴포넌트에서 직접 사용
import api from '@/api-client/client';

export function VendorList() {
  const { data, isLoading } = useQuery({
    queryKey: ['vendors', filter],
    queryFn: async () => {
      const res = await api.get('/api/vendors', { params: { categoryId: filter } });
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/api/vendors/me', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    }
  });
  // ...
}

// ❌ Custom Hook으로 감싸지 않음
// export const useVendors = () => useQuery({...})
```

### 에러 처리
- `onError`는 작성하지 않음 (중앙화된 에러 핸들러 사용)
- 백엔드에서 도메인 메시지를 내려보내고, 프론트 전역 핸들러가 토스트로 표시

### 폼 (React Hook Form)
```typescript
// ✅ JSX 내에서 자연스럽게 register/Controller 사용
<input {...register("email", { required: "이메일 필수" })} />
{errors.email && <p>{errors.email.message}</p>}

// ❌ 메타 객체 배열 형식 사용 금지
```

### 파일 구조 (페이지별)
```
src/app/(page)/vendors/
├── page.tsx              # 페이지 컴포넌트
├── component/
│   ├── VendorCard.tsx
│   ├── VendorFilter.tsx
│   └── modal/
│       └── ContactModal.tsx
├── utils.ts              # 유틸 함수 (1개 파일에 모음)
└── constants.ts          # 상수 (1개 파일에 모음)
```

### CSS 작성 순서 (Tailwind)
1. 레이아웃: `overflow`, `display`, `position`, `flex`, `grid`
2. 박스 모델: `w-`, `h-`, `m-`, `p-`
3. 텍스트: `font-`, `text-`, `leading-`, `tracking-`
4. UI: `cursor-`, `opacity-`
5. 기타: `border-`, `shadow-`, `bg-`

### 코드 스타일
- 간결한 표현 선호: `data.items.map()` (불필요한 변수 분리 X)
- ES6+ 적극 활용
- 파일명은 짧게: `ClaimModal.tsx` (O) / `SalesOrderClaimCreateModal.tsx` (X)
- 하나의 파일이 길면 파일 분리 선호
- 불필요한 주석, docstring, 타입 어노테이션 추가 X

## Testing Strategy

> **참고**: 테스트 프레임워크는 아직 설정되지 않았습니다. 추후 Vitest + Playwright 도입 예정입니다.

### 테스트 명령 (placeholder)
```bash
cd app
pnpm test                # 단위 테스트 (미설정)
pnpm test:integration    # 통합 테스트 (미설정)
pnpm test:e2e           # E2E 테스트 (미설정)
```

## User Roles & Auth

```
admin   - 관리자: 승인/제재/카테고리 관리
doctor  - 한의사: 업체 검색/문의/리뷰 작성
vendor  - 업체: 프로필 관리/리드 응답
guest   - 비회원: 업체 목록 조회만 가능
```

### 테스트 계정 (로컬)
```
admin: admin@medihub.local / Password123!
doctor: doctor1@medihub.local / Password123!
vendor: vendor01@medihub.local / Password123!
```

## Key Business Domain

### 핵심 기능 (MVP)
1. **회원**: 가입/로그인/인증(한의사 면허, 사업자등록)
2. **업체**: 리스트/상세/검색/필터/찜
3. **리드**: 문의 생성/상태 관리/견적/응답
4. **리뷰**: 작성/조회/평점
5. **관리자**: 승인/반려/카테고리 관리

### 도메인 문서
- `app/doc/domains/auth/prd.md` - 인증/권한
- `app/doc/domains/vendor/prd.md` - 업체 관리
- `app/doc/domains/lead/prd.md` - 리드/문의
- `app/doc/domains/review/prd.md` - 리뷰 시스템
- `app/doc/domains/admin-mvp/prd.md` - 관리자 기능

## Important Rules

1. **PRD 참조**: 새 기능 개발 전 `app/doc/domains/*/prd.md` 확인
2. **TODO 확인**: `app/doc/todo.md`에서 현재 진행 상황 파악
3. **BFF 원칙**: 프론트에서 DB 직접 호출 금지
4. **마이그레이션**: DB 변경 시 `pnpm db:new` → SQL 작성 → `pnpm db:reset`
5. **타입 동기화**: 스키마 변경 후 `pnpm db:gen -- --local` 실행
6. **컴포넌트 재사용**: `src/components/ui`, `src/components/widgets` 적극 활용
