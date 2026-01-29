# 신고/제재 시스템 TSD

> 기반 문서: `app/doc/domains/admin/report-sanction/prd.md:1`
> 참고 코드: `app/src/lib/schema/review.ts:58`, `app/src/server/auth/guards.ts:109`, `app/supabase/migrations/20260117152258_review_reports.sql:1`

## 0. 변경 요약 (파일 단위)

| 파일 | 변경 | 변경 내용 요약 |
| --- | --- | --- |
| `app/supabase/migrations/20260130000000_reports_sanctions.sql` | CREATE | reports, sanctions 테이블 및 RLS 정책 |
| `app/src/lib/schema/report.ts` | CREATE | 신고/제재 Zod 스키마 정의 |
| `app/src/server/report/service.ts` | CREATE | 신고/제재 비즈니스 로직 서비스 |
| `app/src/server/report/mapper.ts` | CREATE | 신고/제재 DB Row -> View 변환 |
| `app/src/app/api/admin/reports/route.ts` | CREATE | 신고 목록 조회 API |
| `app/src/app/api/admin/reports/[id]/route.ts` | CREATE | 신고 상세 조회 API |
| `app/src/app/api/admin/reports/[id]/review/route.ts` | CREATE | 신고 심사 시작 API |
| `app/src/app/api/admin/reports/[id]/resolve/route.ts` | CREATE | 신고 처리 완료 + 제재 API |
| `app/src/app/api/admin/reports/[id]/dismiss/route.ts` | CREATE | 신고 기각 API |
| `app/src/app/api/admin/sanctions/route.ts` | CREATE | 제재 목록 조회 API |
| `app/src/app/api/admin/sanctions/[id]/revoke/route.ts` | CREATE | 제재 해제 API |
| `app/src/api-client/admin.ts` | UPDATE | 신고/제재 API 클라이언트 함수 추가 |
| `app/src/app/(main)/admin/layout.tsx` | UPDATE | 네비게이션에 '신고 관리' 항목 추가 |
| `app/src/app/(main)/admin/reports/page.tsx` | CREATE | 신고 관리 페이지 |
| `app/src/app/(main)/admin/reports/components/ReportDetailModal.tsx` | CREATE | 신고 상세 모달 |
| `app/src/app/(main)/admin/reports/components/SanctionModal.tsx` | CREATE | 제재 부과 모달 |
| `app/src/app/(main)/admin/reports/components/DismissModal.tsx` | CREATE | 기각 사유 입력 모달 |
| `app/src/app/(main)/admin/reports/components/SanctionHistoryPanel.tsx` | CREATE | 제재 이력 패널 |

## 0.1 영향 범위 매트릭스 (Impact Matrix)

| 레이어 | 변경 여부 | 관련 파일(대표) | 근거 |
| --- | --- | --- | --- |
| UI (Pages/Components/Stores/Hooks) | UPDATE | `app/src/app/(main)/admin/reports/page.tsx` | 신규 신고 관리 페이지 생성 |
| API Route | UPDATE | `app/src/app/api/admin/reports/route.ts` | 신규 신고/제재 API 엔드포인트 추가 |
| API Client | UPDATE | `app/src/api-client/admin.ts:19` | 신고/제재 API 함수 추가 필요 |
| Schema (Zod) | UPDATE | `app/src/lib/schema/report.ts` | 신규 Zod 스키마 생성 |
| Service | UPDATE | `app/src/server/report/service.ts` | 신규 서비스 레이어 생성 |
| Repo/DB (+ Migration) | UPDATE | `app/supabase/migrations/20260130000000_reports_sanctions.sql` | reports, sanctions 테이블 신규 생성 |
| Auth/Security/RLS | UPDATE | `app/src/server/auth/guards.ts:109`, `app/supabase/migrations/20260130000000_reports_sanctions.sql` | withRole(["admin"]) 사용, reports/sanctions RLS 정책 추가 |
| Integrations/Cache | NO CHANGE | - | 외부 연동 없음 |
| Config/Middleware/Env | NO CHANGE | `app/middleware.ts` | 미들웨어 변경 없음 |
| Tests | UPDATE | `app/src/tests/integration/admin-reports.test.ts` | 통합 테스트 추가 |

## 0.2 추가로 읽은 파일 (Read Set)

| 파일 | 라인 | 참조 이유 |
| --- | --- | --- |
| `app/src/app/(main)/admin/verifications/page.tsx` | 1-301 | 관리자 목록 페이지 UI 패턴 참조 |
| `app/src/app/api/admin/verifications/route.ts` | 1-113 | 관리자 목록 API 패턴 참조 |
| `app/supabase/migrations/20260117152258_review_reports.sql` | 1-57 | 기존 신고 테이블 구조 및 RLS 패턴 참조 |
| `app/src/lib/schema/admin.ts` | 1-241 | 관리자 스키마 패턴 참조 |
| `app/src/server/api/errors.ts` | 1-52 | 에러 응답 패턴 참조 |
| `app/src/server/api/response.ts` | 1-43 | API 응답 패턴 참조 |

## 0.3 Step-by-Step Implementation Tasks

| ID | Layer | File | Action | Description | Depends On |
|----|-------|------|--------|-------------|------------|
| SCHEMA-1 | Schema | `app/src/lib/schema/report.ts` | CREATE | 신고/제재 Zod 스키마 정의 | - |
| SCHEMA-2 | Migration | `app/supabase/migrations/20260130000000_reports_sanctions.sql` | CREATE | reports, sanctions 테이블 + RLS | - |
| BACKEND-1 | Mapper | `app/src/server/report/mapper.ts` | CREATE | DB Row -> View 변환 함수 | SCHEMA-1 |
| BACKEND-2 | Service | `app/src/server/report/service.ts` | CREATE | 신고/제재 비즈니스 로직 | SCHEMA-1, SCHEMA-2, BACKEND-1 |
| BACKEND-3 | API | `app/src/app/api/admin/reports/route.ts` | CREATE | 신고 목록 조회 API | BACKEND-2 |
| BACKEND-4 | API | `app/src/app/api/admin/reports/[id]/route.ts` | CREATE | 신고 상세 조회 API | BACKEND-2 |
| BACKEND-5 | API | `app/src/app/api/admin/reports/[id]/review/route.ts` | CREATE | 신고 심사 시작 API | BACKEND-2 |
| BACKEND-6 | API | `app/src/app/api/admin/reports/[id]/resolve/route.ts` | CREATE | 신고 처리 완료 + 제재 API | BACKEND-2 |
| BACKEND-7 | API | `app/src/app/api/admin/reports/[id]/dismiss/route.ts` | CREATE | 신고 기각 API | BACKEND-2 |
| BACKEND-8 | API | `app/src/app/api/admin/sanctions/route.ts` | CREATE | 제재 목록 조회 API | BACKEND-2 |
| BACKEND-9 | API | `app/src/app/api/admin/sanctions/[id]/revoke/route.ts` | CREATE | 제재 해제 API | BACKEND-2 |
| FRONTEND-1 | API-Client | `app/src/api-client/admin.ts` | UPDATE | 신고/제재 API 함수 추가 | BACKEND-3 ~ BACKEND-9 |
| FRONTEND-2 | UI | `app/src/app/(main)/admin/layout.tsx` | UPDATE | 네비게이션에 '신고 관리' 추가 | - |
| FRONTEND-3 | UI | `app/src/app/(main)/admin/reports/page.tsx` | CREATE | 신고 관리 메인 페이지 | SCHEMA-1, FRONTEND-1 |
| FRONTEND-4 | UI | `app/src/app/(main)/admin/reports/components/ReportDetailModal.tsx` | CREATE | 신고 상세 모달 | FRONTEND-3 |
| FRONTEND-5 | UI | `app/src/app/(main)/admin/reports/components/SanctionModal.tsx` | CREATE | 제재 부과 모달 | FRONTEND-3 |
| FRONTEND-6 | UI | `app/src/app/(main)/admin/reports/components/DismissModal.tsx` | CREATE | 기각 사유 모달 | FRONTEND-3 |
| FRONTEND-7 | UI | `app/src/app/(main)/admin/reports/components/SanctionHistoryPanel.tsx` | CREATE | 제재 이력 패널 | FRONTEND-3 |
| TEST-1 | Test | `app/src/tests/integration/admin-reports.test.ts` | CREATE | 신고/제재 API 통합 테스트 | BACKEND-3 ~ BACKEND-9 |

## 0.4 Parallelization Strategy

### 실행 모드

| 모드 | 특징 | 권장 상황 |
|------|------|----------|
| **Conservative (기본)** | Backend 완료 후 Frontend 시작 | 대부분의 경우, API 스펙 변경 가능성 있을 때 |

### 실행 단계 (Conservative)

| Phase | Tasks | Executor | Mode |
|-------|-------|----------|------|
| 1 | SCHEMA-1, SCHEMA-2 | schema-implementer | Sequential |
| 2 | BACKEND-1 ~ BACKEND-9 | backend-implementer | Sequential |
| 3 | FRONTEND-1 ~ FRONTEND-7 | frontend-implementer | Phase 2 완료 후 |
| 4 | TEST-1 | test-implementer | Phase 2 완료 후 |
| 5 | Integration | integrator | Phase 3, 4 완료 후 |

### 파일 소유권 (충돌 방지)

| Pattern | Owner | Others |
|---------|-------|--------|
| `app/src/lib/schema/report.ts` | schema-implementer | READ-ONLY |
| `app/supabase/migrations/**` | schema-implementer | READ-ONLY |
| `app/src/server/report/**` | backend-implementer | READ-ONLY |
| `app/src/app/api/admin/reports/**` | backend-implementer | READ-ONLY |
| `app/src/app/api/admin/sanctions/**` | backend-implementer | READ-ONLY |
| `app/src/app/(main)/admin/reports/**` | frontend-implementer | READ-ONLY |
| `app/src/api-client/admin.ts` | frontend-implementer | READ-ONLY |
| `app/src/app/(main)/admin/layout.tsx` | frontend-implementer | READ-ONLY |
| `app/src/tests/**` | test-implementer | READ-ONLY |

## 1. 범위

- **포함**
  - reports 테이블 (통합 신고)
  - sanctions 테이블 (제재 이력)
  - 관리자 신고 심사 UI (`/admin/reports`)
  - 관리자 신고/제재 API
  - 자동 블라인드 로직 (리뷰 5건 이상)
  - 수동 제재 부과 (경고/일시정지/영구정지)
  - RLS 정책

- **제외**
  - 기존 `review_reports` 테이블 삭제/마이그레이션
  - 신고자 처리 결과 알림
  - 이의제기/항소 기능
  - 일시정지 자동 만료 배치
  - AI 기반 자동 스팸 탐지

## 2. 시스템 개요

### 2.1 아키텍처 / 경계

```
+-----------------+     +-----------------+     +----------------+
| UI (Next.js)    | --> | API Routes      | --> | Service        |
| /admin/reports  |     | /api/admin/...  |     | (비즈니스로직)   |
+-----------------+     +-----------------+     +----------------+
                                                       |
                                                       v
                                               +----------------+
                                               | Supabase       |
                                               | (reports,      |
                                               |  sanctions,    |
                                               |  audit_logs)   |
                                               +----------------+
```

- UI: `app/src/app/(main)/admin/reports/`
- API: `app/src/app/api/admin/reports/`, `app/src/app/api/admin/sanctions/`
- API Client: `app/src/api-client/admin.ts`
- Schema (Zod): `app/src/lib/schema/report.ts`
- Service: `app/src/server/report/service.ts`
- Mapper: `app/src/server/report/mapper.ts`
- Repo/DB: `app/supabase/migrations/20260130000000_reports_sanctions.sql`
- Auth: `app/src/server/auth/guards.ts` (withRole(["admin"]))

### 2.2 데이터 흐름

1. 관리자가 `/admin/reports` 페이지 접근
2. UI -> API Client -> API Route -> Service -> Supabase
3. Service에서 비즈니스 로직 처리 (상태 변경, 제재 생성, 감사 로그)
4. Mapper로 DB Row -> View 변환 후 응답

## 3. UI/UX 설계

### 3.1 해결할 문제 (PRD 기반)

- **핵심 문제**: 신고 접수 후 체계적인 심사/제재 워크플로우 부재
- **핵심 니즈**: 신고 목록 확인 -> 상세 검토 -> 제재 결정/기각
- **성공 기준**: 관리자가 신고를 효율적으로 처리하고 제재 이력을 추적 가능

### 3.2 정보 구조 (Information Architecture)

**핵심 정보 (반드시 표시):**
- 신고 상태 (pending/reviewing/resolved/dismissed)
- 신고 대상 유형 (review/vendor/profile) + 대상 정보
- 신고 사유 (spam/inappropriate/false_info/privacy/other)
- 신고자 정보
- 신고 일시

**부가 정보 (상세 모달에서 표시):**
- 신고 상세 내용 (detail)
- 대상의 제재 이력
- 동일 대상 누적 신고 수
- 처리자 정보, 처리 일시

**정보 그룹핑:**
- 신고 유형별 탭 (전체/리뷰/업체/사용자)
- 상태별 필터 (전체/접수/심사중/처리완료/기각)

### 3.3 흐름(Flow) 설계

**메인 플로우:**
```
[신고 목록] -> [신고 클릭] -> [상세 모달] -> [제재/기각 결정] -> [확인 모달] -> [완료]
```

**예외/이탈 루트:**
- 검색 결과 없음 -> 빈 상태 메시지
- 이미 처리된 신고 -> 수정 불가, 이력만 표시
- 제재 취소 -> 제재 이력에서 해제(revoke) 버튼

**단계 최소화:**
- 목표까지 클릭 수: 4회 이하 (목록 -> 상세 -> 제재 버튼 -> 확인)

### 3.4 레이아웃 및 시각적 위계

**레이아웃 선택 + 근거:**
- 목록 형태: **리스트** (테이블 대신)
- 근거: 기존 `/admin/verifications` 페이지 패턴과 일관성 유지, 모바일 대응 용이

**시각적 위계 (중요도순):**
1. **Primary**: 제재 부과 버튼, 기각 버튼
2. **Secondary**: 상세 보기, 심사 시작
3. **Information**: 신고 목록, 상태 배지, 제재 이력

**영역 구분 (ASCII 레이아웃):**
```
+----------------------------------------------------------+
| 신고 관리                                                  |
+----------------------------------------------------------+
| [유형 탭: 전체 | 리뷰 | 업체 | 사용자]                      |
| [상태 필터: 전체 | 접수 | 심사중 | 처리완료 | 기각]          |
| [검색 입력] [검색 버튼]                                     |
+----------------------------------------------------------+
| 신고 목록 (리스트)                                         |
| +------------------------------------------------------+  |
| | [상태 배지] [일시]                                    |  |
| | 신고 대상: [유형] - [대상 요약]                        |  |
| | 신고자: [이름] | 사유: [사유]                         |  |
| | [제재 버튼] [기각 버튼] (pending/reviewing일 때만)     |  |
| +------------------------------------------------------+  |
| | ...                                                  |  |
| +------------------------------------------------------+  |
+----------------------------------------------------------+
| [페이지네이션]                                             |
+----------------------------------------------------------+
```

### 3.5 컴포넌트 구조

**파일 구조:**
```
app/src/app/(main)/admin/reports/
+-- page.tsx (200줄 이하, 레이아웃 + 상태 조합)
+-- components/
|   +-- ReportDetailModal.tsx (신고 상세 + 제재 이력)
|   +-- SanctionModal.tsx (제재 부과)
|   +-- DismissModal.tsx (기각 사유 입력)
|   +-- SanctionHistoryPanel.tsx (제재 이력 패널)
```

**컴포넌트 명명 규칙:**
- `ReportDetailModal`: 신고 상세 정보 표시
- `SanctionModal`: 제재 유형/기간 선택
- `DismissModal`: 기각 사유 입력
- `SanctionHistoryPanel`: 대상의 제재 이력 표시

**분리 기준:**
- page.tsx: 레이아웃 + 상태 조합만 (목록, 필터, 페이지네이션)
- 모달: 각각 독립 컴포넌트로 분리

### 3.6 상태 및 피드백

| 상태 | UI 표현 |
|------|---------|
| 초기 (데이터 없음) | "조건에 맞는 신고가 없습니다" |
| 로딩 | Spinner (목록 영역 중앙) |
| 빈 결과 | Empty 컴포넌트 + 필터 조건 안내 |
| 에러 | 토스트 메시지 (전역 에러 핸들러) |
| 성공 (제재/기각) | 토스트 + 목록 새로고침 |

**UX 편의 기능:**
- 엔터키 검색: 예 (검색 폼에서 Enter 시 검색 실행)
- 체크박스 일괄 선택: 아니오 (개별 처리)
- 영구정지 2단계 확인: 예 (ConfirmModal)

### 3.7 상태 관리

- **서버 상태**: React Query 사용
  - 쿼리 키: `["admin", "reports", targetType, status, q, page]`
  - 쿼리 키: `["admin", "sanctions", targetType, targetId]`
- **클라이언트 상태**: useState (모달 열림/닫힘, 선택된 항목)
- **URL 상태**: nuqs 사용 (필터 조건 유지/공유)
  - `targetType`, `status`, `q`, `page`

### 3.8 API Client

- `getReports(params)`: 신고 목록 조회
- `getReport(id)`: 신고 상세 조회
- `startReview(id)`: 신고 심사 시작
- `resolveReport(id, body)`: 신고 처리 완료 + 제재
- `dismissReport(id, body)`: 신고 기각
- `getSanctions(params)`: 제재 목록 조회
- `revokeSanction(id, body)`: 제재 해제

파일: `app/src/api-client/admin.ts`

## 4. 데이터 모델

### 4.1 reports 테이블

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 신고 ID |
| target_type | report_target_type | NOT NULL | 신고 대상 유형 (review/vendor/profile) |
| target_id | uuid | NOT NULL | 신고 대상 ID |
| reporter_user_id | uuid | NOT NULL, FK(profiles.id) | 신고자 ID |
| reason | report_reason | NOT NULL | 신고 사유 |
| detail | text | | 상세 내용 |
| status | report_status | NOT NULL, default 'pending' | 신고 상태 |
| reviewed_by | uuid | FK(profiles.id) | 심사 관리자 ID |
| reviewed_at | timestamptz | | 심사 시작 일시 |
| resolved_by | uuid | FK(profiles.id) | 처리 관리자 ID |
| resolved_at | timestamptz | | 처리 완료 일시 |
| resolution_note | text | | 처리 사유/메모 |
| created_at | timestamptz | NOT NULL, default now() | 생성 일시 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 일시 |

- 인덱스:
  - `idx_reports_target` (target_type, target_id)
  - `idx_reports_status` (status)
  - `idx_reports_reporter` (reporter_user_id)
- 유니크 제약: `unique(target_type, target_id, reporter_user_id)` (동일 대상 중복 신고 방지)
- 마이그레이션: `app/supabase/migrations/20260130000000_reports_sanctions.sql`
- 롤백(down) 전략: DROP TABLE reports CASCADE

### 4.2 sanctions 테이블

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 제재 ID |
| target_type | report_target_type | NOT NULL | 제재 대상 유형 |
| target_id | uuid | NOT NULL | 제재 대상 ID |
| report_id | uuid | FK(reports.id) | 관련 신고 ID (nullable) |
| sanction_type | sanction_type | NOT NULL | 제재 유형 (warning/suspension/permanent_ban) |
| status | sanction_status | NOT NULL, default 'active' | 제재 상태 (active/expired/revoked) |
| reason | text | NOT NULL | 제재 사유 |
| duration_days | integer | | 정지 기간 (일) - suspension일 때 필수 |
| starts_at | timestamptz | NOT NULL, default now() | 제재 시작 일시 |
| ends_at | timestamptz | | 제재 종료 일시 (영구정지는 null) |
| created_by | uuid | NOT NULL, FK(profiles.id) | 제재 부과 관리자 |
| revoked_by | uuid | FK(profiles.id) | 제재 해제 관리자 |
| revoked_at | timestamptz | | 제재 해제 일시 |
| revoke_reason | text | | 제재 해제 사유 |
| created_at | timestamptz | NOT NULL, default now() | 생성 일시 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 일시 |

- 인덱스:
  - `idx_sanctions_target` (target_type, target_id)
  - `idx_sanctions_status` (status)
  - `idx_sanctions_ends_at` (ends_at) WHERE status = 'active'
- 마이그레이션: `app/supabase/migrations/20260130000000_reports_sanctions.sql`
- 롤백(down) 전략: DROP TABLE sanctions CASCADE

### 4.3 Enum 타입

```sql
-- 신고 대상 유형
create type public.report_target_type as enum ('review', 'vendor', 'profile');

-- 신고 사유 (기존 review_report_reason 재사용하지 않고 별도 정의)
create type public.report_reason as enum ('spam', 'inappropriate', 'false_info', 'privacy', 'other');

-- 신고 상태
create type public.report_status as enum ('pending', 'reviewing', 'resolved', 'dismissed');

-- 제재 유형
create type public.sanction_type as enum ('warning', 'suspension', 'permanent_ban');

-- 제재 상태
create type public.sanction_status as enum ('active', 'expired', 'revoked');
```

### 4.4 RLS 정책

**reports 테이블:**
- admin: 전체 CRUD
- authenticated: 본인 신고만 INSERT

**sanctions 테이블:**
- admin: 전체 CRUD
- 일반 사용자: 접근 불가

## 5. API 설계

| 메서드/경로 | 권한 | 요청 스키마 | 응답 스키마 | 비고 |
| --- | --- | --- | --- | --- |
| `GET /api/admin/reports` | admin | Query: `AdminReportListQuerySchema` | `AdminReportListResponseSchema` | 신고 목록 조회 |
| `GET /api/admin/reports/:id` | admin | - | `AdminReportDetailResponseSchema` | 신고 상세 조회 |
| `POST /api/admin/reports/:id/review` | admin | - | `AdminReportActionResponseSchema` | 심사 시작 (pending->reviewing) |
| `POST /api/admin/reports/:id/resolve` | admin | Body: `AdminReportResolveBodySchema` | `AdminReportActionResponseSchema` | 처리 완료 + 제재 |
| `POST /api/admin/reports/:id/dismiss` | admin | Body: `AdminReportDismissBodySchema` | `AdminReportActionResponseSchema` | 신고 기각 |
| `GET /api/admin/sanctions` | admin | Query: `AdminSanctionListQuerySchema` | `AdminSanctionListResponseSchema` | 제재 목록 조회 |
| `POST /api/admin/sanctions/:id/revoke` | admin | Body: `AdminSanctionRevokeBodySchema` | `AdminSanctionActionResponseSchema` | 제재 해제 |

### 5.1 신고 목록 조회 (GET /api/admin/reports)

**Query Schema (`AdminReportListQuerySchema`):**
- `targetType`: `z.enum(["review", "vendor", "profile"]).optional()` - 대상 유형 필터
- `status`: `z.enum(["pending", "reviewing", "resolved", "dismissed"]).optional()` - 상태 필터
- `q`: `z.string().trim().min(1).optional()` - 검색어 (대상 정보, 신고자 이름)
- `page`: `z.coerce.number().int().min(1).default(1)`
- `pageSize`: `z.coerce.number().int().min(1).max(100).default(20)`

**정렬:** `created_at DESC` (최신순)

**Response Schema (`AdminReportListResponseSchema`):**
```
{
  code: "0000",
  data: {
    items: AdminReportListItemSchema[],
    page: number,
    pageSize: number,
    total: number
  }
}
```

**AdminReportListItemSchema:**
- `id`: uuid
- `targetType`: report_target_type
- `targetId`: uuid
- `targetSummary`: string (대상 요약 정보)
- `reporterUser`: { id, displayName, email }
- `reason`: report_reason
- `status`: report_status
- `createdAt`: string (ISO)

**에러 응답:**
- 400: Zod 검증 실패

### 5.2 신고 상세 조회 (GET /api/admin/reports/:id)

**Response Schema (`AdminReportDetailResponseSchema`):**
- `report`: AdminReportViewSchema
  - 위 목록 항목 + `detail`, `reviewedBy`, `reviewedAt`, `resolvedBy`, `resolvedAt`, `resolutionNote`
- `targetReportCount`: number (동일 대상 총 신고 수)
- `sanctions`: SanctionViewSchema[] (대상의 제재 이력)

**에러 응답:**
- 404: 신고 없음

### 5.3 신고 심사 시작 (POST /api/admin/reports/:id/review)

**동작:**
- status를 `pending` -> `reviewing`으로 변경
- reviewed_by, reviewed_at 설정

**에러 응답:**
- 400: 이미 처리된 신고 (status !== 'pending')
- 404: 신고 없음

### 5.4 신고 처리 완료 + 제재 (POST /api/admin/reports/:id/resolve)

**Body Schema (`AdminReportResolveBodySchema`):**
- `sanctionType`: `z.enum(["warning", "suspension", "permanent_ban"]).optional()` - 제재 유형 (미입력 시 제재 없이 처리)
- `durationDays`: `z.number().int().refine(v => v === 7 || v === 30).optional()` - 정지 기간 (suspension일 때 필수)
- `reason`: `z.string().trim().min(1).max(500)` - 처리/제재 사유

**동작 (트랜잭션):**
1. 신고 상태 `resolved`로 변경
2. sanctionType이 있으면 sanctions 테이블에 INSERT
3. permanent_ban이면 대상(profiles/vendors)의 status를 'banned'로 변경
4. suspension이면 해당 대상의 기존 active 제재를 revoked로 변경
5. audit_logs에 `report.resolve`, `sanction.create` 이벤트 기록

**에러 응답:**
- 400: 이미 처리된 신고, suspension인데 durationDays 없음
- 404: 신고 없음

### 5.5 신고 기각 (POST /api/admin/reports/:id/dismiss)

**Body Schema (`AdminReportDismissBodySchema`):**
- `reason`: `z.string().trim().min(1).max(500)` - 기각 사유

**동작:**
1. 신고 상태 `dismissed`로 변경
2. resolution_note에 사유 저장
3. audit_logs에 `report.dismiss` 이벤트 기록

**에러 응답:**
- 400: 이미 처리된 신고
- 404: 신고 없음

### 5.6 제재 목록 조회 (GET /api/admin/sanctions)

**Query Schema (`AdminSanctionListQuerySchema`):**
- `targetType`: `z.enum(["review", "vendor", "profile"]).optional()`
- `targetId`: `z.string().uuid().optional()` - 특정 대상의 제재 이력
- `status`: `z.enum(["active", "expired", "revoked"]).optional()`
- `page`, `pageSize`

**정렬:** `created_at DESC`

### 5.7 제재 해제 (POST /api/admin/sanctions/:id/revoke)

**Body Schema (`AdminSanctionRevokeBodySchema`):**
- `reason`: `z.string().trim().min(1).max(500)` - 해제 사유 (필수)

**동작 (트랜잭션):**
1. 제재 상태 `revoked`로 변경
2. revoked_by, revoked_at, revoke_reason 설정
3. permanent_ban이었으면 대상 status를 'active'로 복원
4. audit_logs에 `sanction.revoke` 이벤트 기록

**에러 응답:**
- 400: 이미 revoked된 제재
- 404: 제재 없음

## 6. 서비스/도메인 계층

### 6.1 ReportService (`app/src/server/report/service.ts`)

**메서드:**

1. `getReportList(supabase, query: AdminReportListQuery)`
   - 입력: Supabase 클라이언트, 쿼리 파라미터
   - 반환: `{ items: ReportListItem[], total: number }`
   - 동작: 필터/페이징 적용하여 신고 목록 조회
   - 대상 정보 조인: reviews(리뷰 내용), vendors(업체명), profiles(사용자명)

2. `getReportDetail(supabase, reportId: string)`
   - 입력: 신고 ID
   - 반환: `{ report: ReportView, targetReportCount: number, sanctions: SanctionView[] }`
   - 동작: 신고 상세 + 동일 대상 신고 수 + 제재 이력 조회

3. `startReview(supabase, reportId: string, adminUserId: string)`
   - 입력: 신고 ID, 관리자 ID
   - 반환: `{ report: ReportView }`
   - 동작: pending -> reviewing 상태 변경

4. `resolveReport(supabase, reportId: string, adminUserId: string, body: ResolveBody)`
   - 입력: 신고 ID, 관리자 ID, 처리 정보
   - 반환: `{ report: ReportView, sanction?: SanctionView }`
   - 트랜잭션: 신고 처리 + 제재 생성 + 대상 상태 변경 + 감사 로그
   - **자동 블라인드**: 대상이 리뷰이고, 총 신고 수 >= 5면 reviews.status = 'hidden' 자동 변경

5. `dismissReport(supabase, reportId: string, adminUserId: string, reason: string)`
   - 입력: 신고 ID, 관리자 ID, 기각 사유
   - 반환: `{ report: ReportView }`
   - 동작: 상태 dismissed로 변경 + 감사 로그

6. `getSanctionList(supabase, query: AdminSanctionListQuery)`
   - 입력: 쿼리 파라미터
   - 반환: `{ items: SanctionView[], total: number }`

7. `revokeSanction(supabase, sanctionId: string, adminUserId: string, reason: string)`
   - 입력: 제재 ID, 관리자 ID, 해제 사유
   - 반환: `{ sanction: SanctionView }`
   - 트랜잭션: 제재 해제 + 대상 상태 복원 + 감사 로그

### 6.2 자동 블라인드 로직

- **조건**: target_type = 'review' AND 해당 리뷰에 대한 총 신고 수 >= 5
- **동작**: reviews.status = 'hidden'으로 변경
- **감사 로그**: action = 'report.auto_blind'
- **예외**: 이미 hidden 상태면 스킵 (로그만 기록)

### 6.3 감사 로그 이벤트

| action | target_type | metadata |
|--------|-------------|----------|
| report.resolve | report | { reportId, sanctionType?, reason } |
| report.dismiss | report | { reportId, reason } |
| report.auto_blind | review | { reportId, reviewId, reportCount } |
| sanction.create | sanction | { sanctionId, targetType, targetId, sanctionType, durationDays? } |
| sanction.revoke | sanction | { sanctionId, reason } |

## 7. 테스트 전략

| 구분 | 시나리오 | 도구 |
| --- | --- | --- |
| 통합 | 신고 목록 조회 (필터, 페이징) | Vitest + Supertest |
| 통합 | 신고 심사 시작 | Vitest + Supertest |
| 통합 | 신고 처리 + 제재 부과 | Vitest + Supertest |
| 통합 | 중복 신고 409 에러 | Vitest + Supertest |
| 통합 | 이미 처리된 신고 400 에러 | Vitest + Supertest |
| 통합 | 자동 블라인드 (5건 이상) | Vitest + Supertest |
| 통합 | 영구정지 시 status 변경 | Vitest + Supertest |
| 통합 | 제재 해제 후 status 복원 | Vitest + Supertest |

### 검증 명령

```bash
pnpm lint
pnpm type-check
pnpm db:gen
pnpm test
```

## 8. 운영/배포

- **마이그레이션 적용 순서**:
  1. `pnpm db:migrate` - reports, sanctions 테이블 생성
  2. `pnpm db:gen` - 타입 생성
  3. 서버 코드 배포
  4. 프론트 코드 배포

- **롤백 절차**:
  1. 프론트 코드 롤백
  2. 서버 코드 롤백
  3. `DROP TABLE sanctions, reports CASCADE` (데이터 손실 주의)

- **기능 플래그**: 없음 (전체 배포)

## 9. 백로그

- [ ] 업체/사용자 신고 UI (업체 상세, 프로필 페이지에 신고 버튼)
- [ ] 신고자에게 처리 결과 알림 (이메일/푸시)
- [ ] 일시정지 자동 만료 배치 처리
- [ ] 관리자 대시보드에 신고/제재 통계 위젯
- [ ] 이의제기/항소 기능
- [ ] 자동 블라인드 임계치 설정 UI

---

## Progress Log (append-only)

### 2026-01-30 schema-implementer

**완료 태스크**: SCHEMA-1, SCHEMA-2
**생성/수정 파일**:
- `app/src/lib/schema/report.ts` (CREATE)
- `app/supabase/migrations/20260130000000_reports_sanctions.sql` (CREATE)
- `app/src/lib/database.types.ts` (UPDATE - db:gen)

**검증 결과**: type-check PASS, db:reset PASS, db:gen PASS
**다음**: backend-implementer, frontend-implementer 실행 가능

### 2026-01-30 backend-implementer

**완료 태스크**: BACKEND-1, BACKEND-2, BACKEND-3, BACKEND-4, BACKEND-5, BACKEND-6, BACKEND-7, BACKEND-8, BACKEND-9
**생성/수정 파일**:
- `app/src/server/report/mapper.ts` (CREATE) - DB Row -> View 변환 함수
- `app/src/server/report/service.ts` (CREATE) - 신고/제재 비즈니스 로직
- `app/src/app/api/admin/reports/route.ts` (CREATE) - GET 신고 목록
- `app/src/app/api/admin/reports/[id]/route.ts` (CREATE) - GET 신고 상세
- `app/src/app/api/admin/reports/[id]/review/route.ts` (CREATE) - POST 심사 시작
- `app/src/app/api/admin/reports/[id]/resolve/route.ts` (CREATE) - POST 처리 완료
- `app/src/app/api/admin/reports/[id]/dismiss/route.ts` (CREATE) - POST 기각
- `app/src/app/api/admin/sanctions/route.ts` (CREATE) - GET 제재 목록
- `app/src/app/api/admin/sanctions/[id]/revoke/route.ts` (CREATE) - POST 제재 해제

**검증 결과**: type-check PASS
**다음**: frontend-implementer 실행 가능
