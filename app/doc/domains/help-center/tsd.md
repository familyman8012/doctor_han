# 헬프센터(FAQ/공지사항) TSD

> 기반 문서: `app/doc/domains/help-center/prd.md:1`
> 참고 코드: `app/src/lib/schema/admin.ts:1`, `app/src/server/category/mapper.ts:1`, `app/supabase/migrations/20251218190000_p0_schema.sql:1`

## 0. 변경 요약 (파일 단위)

| 파일 | 변경 | 변경 내용 요약 |
| --- | --- | --- |
| `app/supabase/migrations/YYYYMMDDHHMMSS_help_center.sql` | CREATE | help_article_type enum, help_categories, help_articles 테이블, RLS 정책, 인덱스 |
| `app/src/lib/schema/help-center.ts` | CREATE | Zod 스키마 (View, Body, Query, Response) |
| `app/src/server/help-center/mapper.ts` | CREATE | DB Row to View 변환 |
| `app/src/app/api/help/articles/route.ts` | CREATE | 공개 문서 목록 조회 API |
| `app/src/app/api/help/articles/[id]/route.ts` | CREATE | 공개 문서 상세 조회 API |
| `app/src/app/api/help/categories/route.ts` | CREATE | 공개 카테고리 목록 조회 API |
| `app/src/app/api/admin/help-center/articles/route.ts` | CREATE | 관리자 문서 목록/생성 API |
| `app/src/app/api/admin/help-center/articles/[id]/route.ts` | CREATE | 관리자 문서 상세/수정/삭제 API |
| `app/src/app/api/admin/help-center/categories/route.ts` | CREATE | 관리자 카테고리 목록/생성 API |
| `app/src/app/api/admin/help-center/categories/[id]/route.ts` | CREATE | 관리자 카테고리 수정/삭제 API |
| `app/src/api-client/help-center.ts` | CREATE | 헬프센터 API 클라이언트 |
| `app/src/app/(main)/help/page.tsx` | CREATE | 공개 헬프센터 메인 페이지 |
| `app/src/app/(main)/help/faq/page.tsx` | CREATE | FAQ 목록 페이지 |
| `app/src/app/(main)/help/faq/[id]/page.tsx` | CREATE | FAQ 상세 페이지 |
| `app/src/app/(main)/help/notice/page.tsx` | CREATE | 공지사항 목록 페이지 |
| `app/src/app/(main)/help/notice/[id]/page.tsx` | CREATE | 공지사항 상세 페이지 |
| `app/src/app/(main)/admin/help-center/page.tsx` | CREATE | 관리자 헬프센터 페이지 (FAQ/공지 탭) |
| `app/src/app/(main)/admin/help-center/components/` | CREATE | 관리자 UI 컴포넌트 (FormModal, ArticleTable 등) |

## 0.1 영향 범위 매트릭스 (Impact Matrix)

| 레이어 | 변경 여부 | 관련 파일(대표) | 근거 |
| --- | --- | --- | --- |
| UI (Pages/Components/Stores/Hooks) | CREATE | `app/src/app/(main)/help/**`, `app/src/app/(main)/admin/help-center/**` | 신규 기능, 기존 파일 없음 |
| API Route | CREATE | `app/src/app/api/help/**`, `app/src/app/api/admin/help-center/**` | 신규 기능, 기존 파일 없음 |
| API Client | CREATE | `app/src/api-client/help-center.ts` | 신규 기능, 기존 파일 없음 |
| Schema (Zod) | CREATE | `app/src/lib/schema/help-center.ts` | 신규 기능, 기존 파일 없음 |
| Service | NO CHANGE | - | 단순 CRUD, Service 계층 불필요 (API Route에서 직접 Supabase 호출) |
| Repo/DB (+ Migration) | CREATE | `app/supabase/migrations/YYYYMMDDHHMMSS_help_center.sql` | 신규 테이블/enum/RLS 필요 |
| Auth/Security/RLS | CREATE | `app/supabase/migrations/YYYYMMDDHHMMSS_help_center.sql` | 공개 읽기 + 관리자 CRUD RLS 정책 필요 |
| Integrations/Cache | NO CHANGE | - | 외부 연동 없음 |
| Config/Middleware/Env | NO CHANGE | `app/middleware.ts:1` | `/help` 공개 경로, `/admin/help-center`는 기존 admin 미들웨어 적용 |
| Tests | CREATE | `app/src/tests/help-center/**` | 신규 기능 테스트 |

## 0.2 추가로 읽은 파일 (Read Set)

| 파일 | 라인 | 참조 이유 |
| --- | --- | --- |
| `app/src/app/api/admin/categories/route.ts` | 1 | 관리자 CRUD + audit_logs 패턴 참조 |
| `app/src/app/api/categories/route.ts` | 1 | 공개 조회 (비인증) 패턴 참조 |
| `app/src/server/category/mapper.ts` | 1 | Mapper 패턴 참조 |
| `app/src/lib/schema/admin.ts` | 188 | AdminCategoryCreateBodySchema 패턴 참조 |
| `app/src/lib/schema/category.ts` | 1 | CategoryViewSchema 패턴 참조 |
| `app/src/api-client/admin.ts` | 1 | API Client 패턴 참조 |
| `app/supabase/migrations/20251218190000_p0_schema.sql` | 660 | categories RLS 정책 패턴 참조 |

## 0.3 Step-by-Step Implementation Tasks

| ID | Layer | File | Action | Description | Depends On |
|----|-------|------|--------|-------------|------------|
| SCHEMA-1 | Schema | `app/src/lib/schema/help-center.ts` | CREATE | Zod 스키마 (enum, View, Body, Query, Response) | - |
| SCHEMA-2 | Migration | `app/supabase/migrations/YYYYMMDDHHMMSS_help_center.sql` | CREATE | help_article_type enum, help_categories, help_articles 테이블, RLS, 인덱스 | - |
| BACKEND-1 | Mapper | `app/src/server/help-center/mapper.ts` | CREATE | DB Row to View 변환 함수 | SCHEMA-1 |
| BACKEND-2 | API | `app/src/app/api/help/categories/route.ts` | CREATE | 공개 카테고리 목록 GET | BACKEND-1 |
| BACKEND-3 | API | `app/src/app/api/help/articles/route.ts` | CREATE | 공개 문서 목록 GET (필터, 검색, 페이지네이션) | BACKEND-1 |
| BACKEND-4 | API | `app/src/app/api/help/articles/[id]/route.ts` | CREATE | 공개 문서 상세 GET | BACKEND-1 |
| BACKEND-5 | API | `app/src/app/api/admin/help-center/categories/route.ts` | CREATE | 관리자 카테고리 GET/POST | BACKEND-1 |
| BACKEND-6 | API | `app/src/app/api/admin/help-center/categories/[id]/route.ts` | CREATE | 관리자 카테고리 PATCH/DELETE | BACKEND-1 |
| BACKEND-7 | API | `app/src/app/api/admin/help-center/articles/route.ts` | CREATE | 관리자 문서 GET/POST | BACKEND-1 |
| BACKEND-8 | API | `app/src/app/api/admin/help-center/articles/[id]/route.ts` | CREATE | 관리자 문서 GET/PATCH/DELETE | BACKEND-1 |
| FRONTEND-1 | API-Client | `app/src/api-client/help-center.ts` | CREATE | 헬프센터 API 클라이언트 | SCHEMA-1 |
| FRONTEND-2 | UI | `app/src/app/(main)/help/page.tsx` | CREATE | 공개 헬프센터 메인 페이지 | FRONTEND-1 |
| FRONTEND-3 | UI | `app/src/app/(main)/help/faq/page.tsx` | CREATE | FAQ 목록 페이지 | FRONTEND-1 |
| FRONTEND-4 | UI | `app/src/app/(main)/help/faq/[id]/page.tsx` | CREATE | FAQ 상세 페이지 | FRONTEND-1 |
| FRONTEND-5 | UI | `app/src/app/(main)/help/notice/page.tsx` | CREATE | 공지사항 목록 페이지 | FRONTEND-1 |
| FRONTEND-6 | UI | `app/src/app/(main)/help/notice/[id]/page.tsx` | CREATE | 공지사항 상세 페이지 | FRONTEND-1 |
| FRONTEND-7 | UI | `app/src/app/(main)/admin/help-center/page.tsx` | CREATE | 관리자 헬프센터 페이지 | FRONTEND-1 |
| FRONTEND-8 | UI | `app/src/app/(main)/admin/help-center/components/**` | CREATE | 관리자 UI 컴포넌트 | FRONTEND-7 |
| TEST-1 | Test | `app/src/tests/help-center/api.test.ts` | CREATE | API 통합 테스트 | BACKEND-* |

## 0.4 Parallelization Strategy

### 실행 모드

| 모드 | 특징 | 권장 상황 |
|------|------|----------|
| **Conservative (기본)** | Backend 완료 후 Frontend 시작 | 대부분의 경우, API 스펙 변경 가능성 있을 때 |

### 실행 단계 (Conservative)

| Phase | Tasks | Executor | Mode |
|-------|-------|----------|------|
| 1 | SCHEMA-1, SCHEMA-2 | schema-implementer | Both |
| 2 | BACKEND-1 ~ BACKEND-8 | backend-implementer | Both |
| 3 | FRONTEND-1 ~ FRONTEND-8 | frontend-implementer | Conservative: Phase 2 완료 후 |
| 4 | TEST-1 | test-implementer | Phase 2 완료 후 |
| 5 | Integration | main | Both |

### 파일 소유권 (충돌 방지)

| Pattern | Owner | Others |
|---------|-------|--------|
| `app/src/lib/schema/help-center.ts` | schema-implementer | READ-ONLY |
| `app/supabase/migrations/**_help_center.sql` | schema-implementer | READ-ONLY |
| `app/src/server/help-center/**` | backend-implementer | READ-ONLY |
| `app/src/app/api/help/**` | backend-implementer | READ-ONLY |
| `app/src/app/api/admin/help-center/**` | backend-implementer | READ-ONLY |
| `app/src/app/(main)/help/**` | frontend-implementer | READ-ONLY |
| `app/src/app/(main)/admin/help-center/**` | frontend-implementer | READ-ONLY |
| `app/src/api-client/help-center.ts` | frontend-implementer | READ-ONLY |
| `app/src/tests/help-center/**` | test-implementer | READ-ONLY |

## 1. 범위

- **포함**
  - DB 스키마: `help_article_type` enum, `help_categories`, `help_articles` 테이블
  - RLS 정책: 공개 읽기 (`is_published = true`), 관리자 전체 권한
  - 공개 API: 문서/카테고리 조회, 검색, 페이지네이션
  - 관리자 API: 문서/카테고리 CRUD, audit_logs 기록
  - 공개 UI: `/help`, `/help/faq`, `/help/notice` 페이지
  - 관리자 UI: `/admin/help-center` 페이지 (FAQ/공지 탭)
  - API Client: 헬프센터 전용 클라이언트
- **제외**
  - 예약 발행 (published_at)
  - Full-text Search (tsvector)
  - 첨부파일
  - 조회수 카운트
  - 다국어 지원

## 2. 시스템 개요

### 2.1 아키텍처 / 경계

```
┌───────────────┐     ┌─────────────────┐     ┌────────────────┐
│ API Routes    │ --> │ Mapper          │ --> │ Supabase       │
│ (/api/...)    │     │ (DTO 변환)      │     │ (RLS 적용)     │
└───────────────┘     └─────────────────┘     └────────────────┘
```

- UI: `app/src/app/(main)/help/**`, `app/src/app/(main)/admin/help-center/**`
- API: `app/src/app/api/help/**`, `app/src/app/api/admin/help-center/**`
- API Client: `app/src/api-client/help-center.ts`
- Schema (Zod 계약): `app/src/lib/schema/help-center.ts`
- Mapper: `app/src/server/help-center/mapper.ts`
- DB: `app/supabase/migrations/YYYYMMDDHHMMSS_help_center.sql`
- Auth/RLS: 마이그레이션 내 RLS 정책

### 2.2 데이터 흐름

**공개 조회:**
1. UI (공개 페이지) -> API Client -> `/api/help/articles`
2. API Route -> Supabase (RLS: `is_published = true`)
3. Mapper -> Response

**관리자 CRUD:**
1. UI (관리자 페이지) -> API Client -> `/api/admin/help-center/articles`
2. API Route (`withRole(["admin"])`) -> Supabase (RLS: admin)
3. audit_logs 기록 -> Mapper -> Response

## 3. UI/UX 설계

### 3.1 해결할 문제 (PRD 기반)

- **핵심 문제**: 사용자(환자/의료인)가 자주 묻는 질문과 공지사항을 확인할 공식 채널 부재
- **핵심 니즈**: 빠른 검색 -> 원하는 정보 확인 (FAQ/공지)
- **성공 기준**: 사용자 문의 감소, 공지 도달률 향상

### 3.2 정보 구조 (Information Architecture)

**핵심 정보 (반드시 표시):**
- 문서 제목 (title)
- 문서 유형 (type: faq/notice)
- 고정 여부 (is_pinned - 공지만)
- 카테고리명 (FAQ만)
- 생성일 (created_at)

**부가 정보 (상세 페이지):**
- 문서 본문 (content)
- 수정일 (updated_at)

**정보 그룹핑:**
- 공개 페이지: type별 탭 분리 (FAQ/공지)
- 관리자 페이지: type별 탭 분리 (FAQ/공지/가이드)

### 3.3 흐름(Flow) 설계

**공개 페이지 메인 플로우:**
```
[/help 진입] -> [탭 선택 (FAQ/공지)] -> [검색/카테고리 필터] -> [목록 확인] -> [상세 보기]
```

**관리자 페이지 메인 플로우:**
```
[/admin/help-center 진입] -> [탭 선택] -> [문서 목록 확인] -> [생성/수정/삭제]
```

**예외/이탈 루트:**
- 검색 결과 없음 -> "검색 결과가 없습니다" + 검색어 재입력 안내
- 비공개 문서 직접 URL 접근 -> 404 페이지
- 삭제 시 확인 모달 -> 취소 가능

**단계 최소화:**
- 목록에서 상세까지: 2클릭 (탭 선택 -> 문서 클릭)
- 문서 생성: 3클릭 (탭 선택 -> 생성 버튼 -> 저장)

### 3.4 레이아웃 및 시각적 위계

**공개 페이지 레이아웃:**
- 목록 형태: **리스트** (아코디언 스타일 - FAQ), **카드 리스트** (공지)
- 근거: FAQ는 질문-답변 형태로 아코디언이 적합, 공지는 제목 중심 카드 리스트

**관리자 페이지 레이아웃:**
- 목록 형태: **테이블**
- 근거: 다수 문서의 상태(공개/비공개, 고정)를 빠르게 파악/변경해야 함

**시각적 위계 (중요도순):**
1. **Primary**: 검색 버튼, 생성 버튼, 저장 버튼
2. **Secondary**: 수정/삭제 버튼, 필터 드롭다운
3. **Information**: 문서 목록, 카테고리 필터

**공개 페이지 영역 구분:**
```
┌─────────────────────────────────────────────────────────────┐
│  [헤더] 헬프센터                                              │
├─────────────────────────────────────────────────────────────┤
│  [탭] FAQ | 공지사항                                          │
├─────────────────────────────────────────────────────────────┤
│  [검색 영역] 검색어 입력 + 검색 버튼                            │
│  [카테고리 필터] FAQ만 - 드롭다운/버튼 그룹                     │
├─────────────────────────────────────────────────────────────┤
│  [목록 영역] - 메인, 스크롤                                    │
│  - FAQ: 아코디언 리스트                                       │
│  - 공지: 카드 리스트 (고정 공지 상단)                          │
├─────────────────────────────────────────────────────────────┤
│  [페이지네이션] 페이지 번호                                    │
└─────────────────────────────────────────────────────────────┘
```

**관리자 페이지 영역 구분:**
```
┌─────────────────────────────────────────────────────────────┐
│  [헤더] 헬프센터 관리                                         │
├─────────────────────────────────────────────────────────────┤
│  [탭] FAQ | 공지사항 | 가이드 | 카테고리 관리                   │
├─────────────────────────────────────────────────────────────┤
│  [검색/필터 영역] 검색어 + 공개상태 필터 + 생성 버튼             │
├─────────────────────────────────────────────────────────────┤
│  [테이블 영역] - 메인                                         │
│  컬럼: 제목 | 카테고리 | 공개 | 고정 | 순서 | 생성일 | 액션      │
├─────────────────────────────────────────────────────────────┤
│  [페이지네이션]                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 컴포넌트 구조

**공개 페이지 (`/help`):**
```
help/
├── page.tsx (헬프센터 홈 - FAQ/공지 탭 + 검색)
├── layout.tsx (공통 레이아웃)
├── components/
│   ├── SearchForm.tsx (검색 폼)
│   ├── CategoryFilter.tsx (카테고리 필터 - FAQ용)
│   └── ArticleList.tsx (문서 목록)
├── faq/
│   ├── page.tsx (FAQ 목록)
│   ├── [id]/page.tsx (FAQ 상세)
│   └── components/
│       └── FaqAccordion.tsx (아코디언 아이템)
└── notice/
    ├── page.tsx (공지 목록)
    ├── [id]/page.tsx (공지 상세)
    └── components/
        └── NoticeItem.tsx (공지 카드)
```

**관리자 페이지 (`/admin/help-center`):**
```
admin/help-center/
├── page.tsx (메인 - 탭 + 목록)
├── components/
│   ├── ArticleTable.tsx (문서 테이블)
│   ├── CategoryTable.tsx (카테고리 테이블)
│   ├── ArticleFormModal.tsx (문서 생성/수정 모달)
│   ├── CategoryFormModal.tsx (카테고리 생성/수정 모달)
│   ├── DeleteConfirmModal.tsx (삭제 확인 모달)
│   └── StatusBadge.tsx (공개/비공개/고정 배지)
└── hooks/
    └── useHelpCenterQueries.ts (React Query 훅)
```

**컴포넌트 명명 규칙:**
- 형태를 암시하지 않는 중립적 명칭 (Item, Row 사용)
- 예외: FaqAccordion (의도적으로 아코디언 형태 명시)

**분리 기준:**
- page.tsx: 200줄 이하 (레이아웃 + 상태 조합만)
- 복잡한 UI 로직: components/ 폴더로 분리
- React Query 훅: hooks/ 폴더로 분리

### 3.6 상태 및 피드백

| 상태 | UI 표현 |
|------|---------|
| 초기 (데이터 없음) | "검색어를 입력하고 검색 버튼을 클릭하세요" (검색 시에만) |
| 로딩 | 스켈레톤 (목록) / 스피너 (버튼) |
| 빈 결과 | "검색 결과가 없습니다" + 검색 조건 재확인 안내 |
| 에러 | 토스트 메시지 (전역 에러 핸들러) |
| 성공 (생성/수정/삭제) | 토스트 + 목록 새로고침 |

**UX 편의 기능:**
- 엔터키 검색: 예
- 검색 트리거: 버튼/Enter submit (디바운스 불필요)
- 키보드 단축키: 없음

### 3.7 상태 관리

- **서버 상태**: React Query 사용
  - 쿼리 키: `["help-articles", { type, categoryId, q, page }]`, `["help-categories"]`
  - mutation: `createArticle`, `updateArticle`, `deleteArticle`, `createCategory`, `updateCategory`, `deleteCategory`
- **클라이언트 상태**: 불필요 (모달 open 상태는 로컬 useState)
- **URL 상태**: nuqs 사용
  - 공개 페이지: `tab` (faq/notice), `category` (FAQ 카테고리), `q` (검색어), `page`
  - 관리자 페이지: `tab` (faq/notice/guide/categories), `q`, `page`, `isPublished`

### 3.8 API Client

**파일**: `app/src/api-client/help-center.ts`

**공개 API:**
- `getPublicArticles(params: HelpArticleListQuery)`: 공개 문서 목록
- `getPublicArticle(id: string)`: 공개 문서 상세
- `getPublicCategories()`: 공개 카테고리 목록

**관리자 API:**
- `getAdminArticles(params: AdminHelpArticleListQuery)`: 관리자 문서 목록
- `getAdminArticle(id: string)`: 관리자 문서 상세
- `createArticle(body: HelpArticleCreateBody)`: 문서 생성
- `updateArticle(id: string, body: HelpArticlePatchBody)`: 문서 수정
- `deleteArticle(id: string)`: 문서 삭제
- `getAdminCategories()`: 관리자 카테고리 목록
- `createCategory(body: HelpCategoryCreateBody)`: 카테고리 생성
- `updateCategory(id: string, body: HelpCategoryPatchBody)`: 카테고리 수정
- `deleteCategory(id: string)`: 카테고리 삭제

## 4. 데이터 모델

### 4.1 help_article_type (enum)

```sql
create type public.help_article_type as enum ('faq', 'notice', 'guide');
```

### 4.2 help_categories

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 카테고리 ID |
| name | text | NOT NULL | 카테고리명 |
| slug | text | NOT NULL, UNIQUE | URL 슬러그 |
| display_order | integer | NOT NULL, default 0 | 표시 순서 |
| is_active | boolean | NOT NULL, default true | 활성 상태 |
| created_at | timestamptz | NOT NULL, default now() | 생성일 |
| updated_at | timestamptz | NOT NULL, default now() | 수정일 |

- 인덱스: `idx_help_categories_slug` (slug)
- 트리거: `help_categories_set_updated_at` (set_updated_at)

### 4.3 help_articles

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 문서 ID |
| type | help_article_type | NOT NULL | 문서 유형 (faq/notice/guide) |
| category_id | uuid | FK -> help_categories, nullable | FAQ 카테고리 (FAQ만 사용) |
| title | text | NOT NULL | 제목 |
| content | text | NOT NULL | 본문 |
| is_published | boolean | NOT NULL, default false | 공개 여부 |
| is_pinned | boolean | NOT NULL, default false | 상단 고정 (공지만 사용) |
| display_order | integer | NOT NULL, default 0 | 표시 순서 |
| created_by | uuid | FK -> profiles, NOT NULL | 작성자 |
| created_at | timestamptz | NOT NULL, default now() | 생성일 |
| updated_at | timestamptz | NOT NULL, default now() | 수정일 |

- 인덱스:
  - `idx_help_articles_type` (type)
  - `idx_help_articles_category_id` (category_id)
  - `idx_help_articles_is_published` (is_published)
  - `idx_help_articles_type_published` (type, is_published) - 복합
- 트리거: `help_articles_set_updated_at` (set_updated_at)

### 4.4 RLS 정책

**help_categories:**
- `help_categories_select_public`: anon, authenticated - SELECT where `is_active = true`
- `help_categories_admin_all`: authenticated - ALL where `is_admin()`

**help_articles:**
- `help_articles_select_public`: anon, authenticated - SELECT where `is_published = true`
- `help_articles_admin_all`: authenticated - ALL where `is_admin()`

### 4.5 마이그레이션

- 파일: `app/supabase/migrations/YYYYMMDDHHMMSS_help_center.sql`
- 롤백(down) 전략: 테이블/enum 순서대로 DROP (help_articles -> help_categories -> enum)

## 5. API 설계

### 5.1 공개 API

#### GET /api/help/categories

| 항목 | 내용 |
| --- | --- |
| 권한 | 없음 (공개) |
| 요청 | 없음 |
| 응답 | `HelpCategoryListResponse` |

**응답 스키마:**
```
HelpCategoryListResponseSchema = {
  code: API_SUCCESS_CODE,
  data: {
    items: HelpCategoryView[]
  }
}

HelpCategoryViewSchema = {
  id: zUuid,
  name: z.string(),
  slug: z.string(),
  displayOrder: z.number().int(),
  isActive: z.boolean()
}
```

#### GET /api/help/articles

| 항목 | 내용 |
| --- | --- |
| 권한 | 없음 (공개) |
| 요청 쿼리 | `HelpArticleListQuery` |
| 응답 | `HelpArticleListResponse` |

**요청 스키마:**
```
HelpArticleListQuerySchema = zPaginationQuery.extend({
  type: HelpArticleTypeSchema.optional(),
  categoryId: zUuid.optional(),
  q: z.string().trim().min(1).optional()
}).strict()
```

**응답 스키마:**
```
HelpArticleListResponseSchema = {
  code: API_SUCCESS_CODE,
  data: {
    items: HelpArticleView[],
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int()
  }
}

HelpArticleViewSchema = {
  id: zUuid,
  type: HelpArticleTypeSchema,
  categoryId: zUuid.nullable(),
  category: HelpCategoryViewSchema.nullable(),
  title: z.string(),
  content: z.string(),
  isPublished: z.boolean(),
  isPinned: z.boolean(),
  displayOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string()
}
```

**정렬:**
- notice: `is_pinned DESC, created_at DESC`
- faq: `display_order ASC, created_at DESC`
- guide: `display_order ASC, created_at DESC`

**검색:** `title ILIKE '%q%' OR content ILIKE '%q%'`

#### GET /api/help/articles/[id]

| 항목 | 내용 |
| --- | --- |
| 권한 | 없음 (공개) |
| 요청 | params: `{ id: string }` |
| 응답 | `HelpArticleDetailResponse` |
| 에러 | 404 (문서 없음 또는 비공개) |

### 5.2 관리자 API

#### GET /api/admin/help-center/categories

| 항목 | 내용 |
| --- | --- |
| 권한 | admin (`withRole(["admin"])`) |
| 요청 | 없음 |
| 응답 | `AdminHelpCategoryListResponse` |

#### POST /api/admin/help-center/categories

| 항목 | 내용 |
| --- | --- |
| 권한 | admin |
| 요청 | `HelpCategoryCreateBody` |
| 응답 | `AdminHelpCategoryResponse` |
| 에러 | 409 (slug 중복) |

**요청 스키마:**
```
HelpCategoryCreateBodySchema = z.object({
  name: zNonEmptyString,
  slug: zNonEmptyString,
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
}).strict()
```

#### PATCH /api/admin/help-center/categories/[id]

| 항목 | 내용 |
| --- | --- |
| 권한 | admin |
| 요청 | `HelpCategoryPatchBody` |
| 응답 | `AdminHelpCategoryResponse` |
| 에러 | 404 (카테고리 없음), 409 (slug 중복) |

**요청 스키마:**
```
HelpCategoryPatchBodySchema = z.object({
  name: zNonEmptyString.optional(),
  slug: zNonEmptyString.optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
}).strict().refine(atLeastOneField)
```

#### DELETE /api/admin/help-center/categories/[id]

| 항목 | 내용 |
| --- | --- |
| 권한 | admin |
| 요청 | params: `{ id: string }` |
| 응답 | `AdminHelpCategoryDeleteResponse` |
| 에러 | 404 (카테고리 없음), 409 (연결된 FAQ 존재) |

#### GET /api/admin/help-center/articles

| 항목 | 내용 |
| --- | --- |
| 권한 | admin |
| 요청 쿼리 | `AdminHelpArticleListQuery` |
| 응답 | `AdminHelpArticleListResponse` |

**요청 스키마:**
```
AdminHelpArticleListQuerySchema = zPaginationQuery.extend({
  type: HelpArticleTypeSchema.optional(),
  categoryId: zUuid.optional(),
  isPublished: z.enum(["true", "false"]).optional(),
  q: z.string().trim().min(1).optional()
}).strict()
```

#### POST /api/admin/help-center/articles

| 항목 | 내용 |
| --- | --- |
| 권한 | admin |
| 요청 | `HelpArticleCreateBody` |
| 응답 | `AdminHelpArticleResponse` |
| audit_logs | action: `help_article.create`, target_type: `help_article` |

**요청 스키마:**
```
HelpArticleCreateBodySchema = z.object({
  type: HelpArticleTypeSchema,
  categoryId: zUuid.optional().nullable(),
  title: zNonEmptyString,
  content: zNonEmptyString,
  isPublished: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional()
}).strict()
```

#### GET /api/admin/help-center/articles/[id]

| 항목 | 내용 |
| --- | --- |
| 권한 | admin |
| 요청 | params: `{ id: string }` |
| 응답 | `AdminHelpArticleDetailResponse` |
| 에러 | 404 (문서 없음) |

#### PATCH /api/admin/help-center/articles/[id]

| 항목 | 내용 |
| --- | --- |
| 권한 | admin |
| 요청 | `HelpArticlePatchBody` |
| 응답 | `AdminHelpArticleResponse` |
| 에러 | 404 (문서 없음) |
| audit_logs | action: `help_article.update`, target_type: `help_article` |

**요청 스키마:**
```
HelpArticlePatchBodySchema = z.object({
  type: HelpArticleTypeSchema.optional(),
  categoryId: zUuid.optional().nullable(),
  title: zNonEmptyString.optional(),
  content: zNonEmptyString.optional(),
  isPublished: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional()
}).strict().refine(atLeastOneField)
```

#### DELETE /api/admin/help-center/articles/[id]

| 항목 | 내용 |
| --- | --- |
| 권한 | admin |
| 요청 | params: `{ id: string }` |
| 응답 | `AdminHelpArticleDeleteResponse` |
| 에러 | 404 (문서 없음) |
| audit_logs | action: `help_article.delete`, target_type: `help_article` |

### 5.3 에러 코드

| 코드 | 조건 |
| --- | --- |
| 400 | Zod 검증 실패, 필수 필드 누락 |
| 404 | 문서/카테고리 없음, 비공개 문서 공개 접근 |
| 409 | slug 중복, 카테고리 삭제 시 연결된 FAQ 존재 |
| 500 | DB 오류 |

## 6. 서비스/도메인 계층

### 6.1 Mapper (`app/src/server/help-center/mapper.ts`)

**mapHelpCategoryRow:**
- 입력: `Tables<"help_categories">`
- 출력: `HelpCategoryView`
- 변환: snake_case -> camelCase

**mapHelpArticleRow:**
- 입력: `Tables<"help_articles">` + optional `category: Tables<"help_categories"> | null`
- 출력: `HelpArticleView`
- 변환: snake_case -> camelCase, category join 처리

### 6.2 Service 계층

Service 계층 미사용 (단순 CRUD). API Route에서 직접 Supabase 호출.

- 근거: 복잡한 비즈니스 로직 없음, 트랜잭션 불필요
- 패턴 참조: `app/src/app/api/admin/categories/route.ts:1`

## 7. 테스트 전략

| 구분 | 시나리오 | 도구 |
| --- | --- | --- |
| 통합 | 공개 문서 목록 조회 (필터, 검색, 페이지네이션) | Vitest |
| 통합 | 공개 문서 상세 조회 (비공개 문서 404) | Vitest |
| 통합 | 관리자 문서 CRUD | Vitest |
| 통합 | 관리자 카테고리 CRUD | Vitest |
| 통합 | 카테고리 삭제 시 연결된 FAQ 존재 409 | Vitest |

### 검증 명령

```bash
pnpm lint
pnpm type-check
pnpm db:gen
```

## 8. 운영/배포

- 마이그레이션 적용 순서: 마이그레이션 -> 서버 코드 -> 프런트 코드
- 롤백 절차:
  1. 프런트 코드 롤백
  2. 서버 코드 롤백
  3. 마이그레이션 롤백 (help_articles DROP -> help_categories DROP -> enum DROP)
- 기능 플래그: 불필요 (신규 기능)

## 9. 백로그

- [ ] 예약 발행 (published_at 지정)
- [ ] Full-text Search (tsvector)
- [ ] 첨부파일 기능
- [ ] 조회수 카운트
- [ ] 로그 기반 인기/관련 문서 추천
- [ ] 다국어 지원

## Progress Log (append-only)

### [2026-01-30T01:15:28] schema-implementer

**완료 태스크**: SCHEMA-1, SCHEMA-2

**생성/수정 파일**:
- `app/src/lib/schema/help-center.ts` (CREATE)
- `app/supabase/migrations/20260130011528_help_center.sql` (CREATE)
- `app/src/lib/database.types.ts` (UPDATE - auto-generated)

**검증 결과**: type-check PASS, db:gen PASS

**다음**: backend-implementer, frontend-implementer 실행 가능
