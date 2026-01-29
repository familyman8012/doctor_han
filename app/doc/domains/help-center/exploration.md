# 헬프센터(FAQ/공지사항) 탐색 결과

## 탐색 일시
2026-01-30

## 1. 레이어별 관련 파일

### 1.1 UI 레이어
| 파일 | 용도 | 참고 패턴 |
|------|------|----------|
| `app/src/app/(main)/admin/categories/page.tsx` | 관리자 CRUD 페이지 | 트리 구조, 모달, 토스트, React Query |
| `app/src/app/(main)/admin/categories/components/FormModal.tsx` | 생성/수정 모달 | react-hook-form, Controller, watch |
| `app/src/app/(main)/admin/verifications/page.tsx` | 관리자 필터/검색 | 다중 필터, 페이지네이션, 배지 |
| `app/src/app/(main)/categories/[slug]/CategoryPage.tsx` | 공개 목록 페이지 | nuqs URL 상태, 필터, 그리드 |
| `app/src/app/(main)/legal/layout.tsx` | 공개 정적 페이지 | 중앙 정렬, 카드 스타일 |
| `app/src/app/(main)/search/page.tsx` | 검색 페이지 | 검색 폼, 인기 검색어, Suspense |
| `app/src/components/ui/Tab/Tab.tsx` | 탭 컴포넌트 | Framer Motion, layoutId |
| `app/src/components/Modal/Modal.tsx` | 기본 모달 | Portal, AnimatePresence |

### 1.2 API 레이어
| 파일 | 용도 | 참고 패턴 |
|------|------|----------|
| `app/src/app/api/admin/categories/route.ts` | 관리자 CRUD | withApi, withRole, audit_logs |
| `app/src/app/api/admin/categories/[id]/route.ts` | 상세 CRUD | PATCH, DELETE, zUuid 검증 |
| `app/src/app/api/categories/route.ts` | 공개 조회 | 비인증 접근, createSupabaseServerClient |
| `app/src/app/api/admin/users/route.ts` | 페이지네이션 | range(), count, 필터 조합 |

### 1.3 Server 레이어
| 파일 | 용도 | 참고 패턴 |
|------|------|----------|
| `app/src/server/auth/guards.ts` | 인증/인가 가드 | withApi, withRole, withAuth |
| `app/src/server/api/response.ts` | API 응답 | ok(), created(), fail() |
| `app/src/server/api/errors.ts` | 에러 처리 | badRequest, notFound, conflict |
| `app/src/server/category/mapper.ts` | DB→API 변환 | snake_case→camelCase |
| `app/src/server/lead/repository.ts` | 복합 조회 | Promise.all, 병렬 조회 |

### 1.4 Schema 레이어
| 파일 | 용도 | 참고 패턴 |
|------|------|----------|
| `app/src/lib/schema/common.ts` | 공통 스키마 | zUuid, zNonEmptyString, zPaginationQuery |
| `app/src/lib/schema/admin.ts` | 관리자 스키마 | Body, Patch, Response, .strict() |
| `app/src/lib/schema/category.ts` | 카테고리 스키마 | View, List Response |
| `app/src/lib/schema/review.ts` | 리뷰 스키마 | Enum, 조건부 검증(.refine) |

### 1.5 DB 레이어
| 파일 | 용도 | 참고 패턴 |
|------|------|----------|
| `app/supabase/migrations/20251218190000_p0_schema.sql` | 메인 스키마 | enum, RLS, trigger, index |
| `app/supabase/migrations/20260117152258_review_reports.sql` | 신고 테이블 | unique 제약, status enum |

### 1.6 API Client 레이어
| 파일 | 용도 | 참고 패턴 |
|------|------|----------|
| `app/src/api-client/client.ts` | Axios 설정 | 인터셉터, 에러 처리 |
| `app/src/api-client/admin.ts` | 관리자 API | CRUD 메서드 구조 |

---

## 2. PENDING Matrix

| Layer | Status | 관련 파일 |
|-------|--------|----------|
| SCHEMA | PENDING | `app/src/lib/schema/help-center.ts` (신규) |
| DB | PENDING | `app/supabase/migrations/YYYYMMDDHHMMSS_help_center.sql` (신규) |
| API | PENDING | `app/src/app/api/help/**`, `app/src/app/api/admin/help-center/**` (신규) |
| SERVER | PENDING | `app/src/server/help-center/**` (신규) |
| UI | PENDING | `app/src/app/(main)/help/**`, `app/src/app/(main)/admin/help-center/**` (신규) |
| API_CLIENT | PENDING | `app/src/api-client/help-center.ts` (신규) |
| TEST | PENDING | `app/src/tests/help-center/**` (신규) |

---

## 3. Planner 참고사항

### 3.1 기존 패턴 요약

**DB 설계:**
- enum 타입: `create type public.xxx as enum (...)`
- 테이블: id(uuid), created_at, updated_at, is_active/is_published
- RLS: anon/authenticated 공개 읽기 + admin 전체 권한
- Helper function: `is_admin()`, `current_profile_role()`
- Trigger: `set_updated_at()`

**API 설계:**
- 공개 GET: `withApi(async (req) => {...})`
- 관리자 CRUD: `withApi(withRole(["admin"], async (ctx) => {...}))`
- 응답: `ok({ items, page, pageSize, total })`, `created({ entity })`
- audit_logs: action, target_type, target_id, metadata

**UI 설계:**
- 관리자: 사이드바 레이아웃, 탭 분리, 모달 CRUD
- 공개: 중앙 정렬 레이아웃, 검색/필터, 페이지네이션
- URL 상태: nuqs useQueryState

### 3.2 헬프센터 특수 고려사항

1. **통합 테이블**: `help_articles` + type enum (faq, notice, guide)
2. **FAQ 카테고리**: 별도 `help_categories` 테이블 또는 기존 `categories` 활용 검토
3. **공개 접근**: RLS `is_published = true` 조건으로 anon 접근 허용
4. **검색**: ILIKE 기반 title + content 검색
5. **고정 기능**: notices에 `is_pinned` boolean 필드
6. **관리자 메뉴**: `/admin/help-center` 추가 (FAQ/공지 탭 분리)
7. **공개 메뉴**: `/help` 푸터/헤더 링크 추가

### 3.3 디렉토리 구조 제안

```
app/src/
├── app/
│   ├── (main)/
│   │   ├── help/                    # 공개 페이지
│   │   │   ├── page.tsx             # 헬프센터 홈
│   │   │   ├── faq/
│   │   │   │   ├── page.tsx         # FAQ 목록
│   │   │   │   └── [id]/page.tsx    # FAQ 상세
│   │   │   └── notice/
│   │   │       ├── page.tsx         # 공지 목록
│   │   │       └── [id]/page.tsx    # 공지 상세
│   │   └── admin/
│   │       └── help-center/         # 관리자 페이지
│   │           ├── page.tsx         # FAQ/공지 탭 통합
│   │           └── components/
│   └── api/
│       ├── help/                    # 공개 API
│       │   ├── articles/route.ts
│       │   └── articles/[id]/route.ts
│       └── admin/
│           └── help-center/         # 관리자 API
│               ├── articles/route.ts
│               └── articles/[id]/route.ts
├── server/
│   └── help-center/
│       ├── mapper.ts
│       └── repository.ts
├── lib/
│   └── schema/
│       └── help-center.ts
└── api-client/
    └── help-center.ts
```
