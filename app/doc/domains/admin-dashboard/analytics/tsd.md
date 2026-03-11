# 관리자 대시보드/통계 고도화 TSD

> 기반 문서: `app/doc/domains/admin-dashboard/analytics/prd.md:1`
> 참고 코드: `app/src/app/(main)/admin/layout.tsx:27`, `app/src/server/auth/guards.ts:109`, `app/src/server/api/with-api.ts:1`, `app/src/lib/schema/common.ts:1`

## 0. 변경 요약 (파일 단위)

| 파일 | 변경 | 변경 내용 요약 |
| --- | --- | --- |
| `app/supabase/migrations/20260311100000_analytics_indexes.sql` | CREATE | 집계 쿼리 성능을 위한 인덱스 추가 마이그레이션 |
| `app/src/lib/schema/analytics.ts` | CREATE | 7개 analytics 엔드포인트의 요청/응답 Zod 스키마 |
| `app/src/server/analytics/repository.ts` | CREATE | 집계 쿼리 함수 (service_role 사용) |
| `app/src/server/analytics/service.ts` | CREATE | 비즈니스 로직 (날짜 보정, 파라미터 검증) |
| `app/src/server/analytics/mapper.ts` | CREATE | DB Row -> DTO 변환 |
| `app/src/app/api/admin/analytics/overview/route.ts` | CREATE | GET /api/admin/analytics/overview |
| `app/src/app/api/admin/analytics/users/route.ts` | CREATE | GET /api/admin/analytics/users |
| `app/src/app/api/admin/analytics/leads/route.ts` | CREATE | GET /api/admin/analytics/leads |
| `app/src/app/api/admin/analytics/revenue/route.ts` | CREATE | GET /api/admin/analytics/revenue |
| `app/src/app/api/admin/analytics/ads/route.ts` | CREATE | GET /api/admin/analytics/ads |
| `app/src/app/api/admin/analytics/funnel/route.ts` | CREATE | GET /api/admin/analytics/funnel |
| `app/src/app/api/admin/analytics/operations/route.ts` | CREATE | GET /api/admin/analytics/operations |
| `app/src/api-client/analytics.ts` | CREATE | 7개 analytics API 클라이언트 함수 |
| `app/src/app/(main)/admin/dashboard/page.tsx` | CREATE | Overview 대시보드 메인 페이지 |
| `app/src/app/(main)/admin/dashboard/users/page.tsx` | CREATE | 사용자 통계 페이지 |
| `app/src/app/(main)/admin/dashboard/leads/page.tsx` | CREATE | 리드 통계 페이지 |
| `app/src/app/(main)/admin/dashboard/revenue/page.tsx` | CREATE | 매출 통계 페이지 |
| `app/src/app/(main)/admin/dashboard/ads/page.tsx` | CREATE | 광고 성과 페이지 |
| `app/src/app/(main)/admin/dashboard/funnel/page.tsx` | CREATE | 퍼널 분석 페이지 |
| `app/src/app/(main)/admin/dashboard/operations/page.tsx` | CREATE | 운영 지표 페이지 |
| `app/src/app/(main)/admin/dashboard/components/DateRangeFilter.tsx` | CREATE | 공통 기간 필터 컴포넌트 |
| `app/src/app/(main)/admin/dashboard/components/KpiCard.tsx` | CREATE | KPI 카드 컴포넌트 |
| `app/src/app/(main)/admin/dashboard/components/ChartPanel.tsx` | CREATE | 차트 래퍼 컴포넌트 (로딩/에러/빈 상태 처리) |
| `app/src/app/(main)/admin/dashboard/components/DashboardNav.tsx` | CREATE | 대시보드 서브 네비게이션 (탭) |
| `app/src/app/(main)/admin/layout.tsx` | UPDATE | NAV_ITEMS 최상단에 대시보드 메뉴 추가 |
| `app/src/app/(main)/admin/page.tsx` | UPDATE | 리다이렉트 대상을 `/admin/dashboard`로 변경 |

## 0.1 영향 범위 매트릭스 (Impact Matrix)

| 레이어 | 변경 여부 | 관련 파일(대표) | 근거 |
| --- | --- | --- | --- |
| UI (Pages/Components) | UPDATE | `app/src/app/(main)/admin/dashboard/**` | 대시보드 7개 페이지 + 4개 공통 컴포넌트 신규 생성. 기존 layout, page 수정. |
| API Route | UPDATE | `app/src/app/api/admin/analytics/*/route.ts` | 7개 GET 엔드포인트 신규 생성. 기존 엔드포인트 변경 없음. |
| API Client | UPDATE | `app/src/api-client/analytics.ts` | 7개 API 호출 함수 신규 파일 생성. 기존 `admin.ts` 변경 없음 -- 도메인 분리를 위해 별도 파일. |
| Schema (Zod) | UPDATE | `app/src/lib/schema/analytics.ts` | 공통 쿼리 스키마, 7개 응답 스키마 신규 파일. 기존 스키마 변경 없음. |
| Service | UPDATE | `app/src/server/analytics/service.ts` | analytics 서비스 신규 생성. 기존 서비스 변경 없음. |
| Repo/DB (+Migration) | UPDATE | `app/src/server/analytics/repository.ts`, `app/supabase/migrations/20260311100000_analytics_indexes.sql` | 집계 전용 repository 신규 생성. 인덱스 추가 마이그레이션. 기존 테이블 스키마 변경 없음. |
| Auth/Security/RLS | NO CHANGE | `app/src/server/auth/guards.ts:109` | 기존 `withRole(["admin"], ...)` 가드 재사용. RLS 변경 없음 -- `service_role`(admin client)로 집계 쿼리 실행하여 RLS 바이패스. `app/src/server/supabase/admin.ts:6` 참조. |
| Integrations/Cache | NO CHANGE | - | 외부 연동 없음. 캐싱은 React Query `staleTime: 5min`으로 클라이언트 측에서만 처리. |
| Config/Middleware/Env | NO CHANGE | `app/middleware.ts:41` | matcher 패턴 `/((?!_next/...).*)`가 `/admin/dashboard` 경로 포함. 추가 설정 불필요. |
| Tests | NO CHANGE | - | 초기 릴리스에서 테스트 미포함 (후속 백로그). `pnpm lint` + `pnpm type-check`로 검증. |

## 0.2 추가로 읽은 파일 (Read Set)

| 파일 | 라인 | 참조 이유 |
| --- | --- | --- |
| `app/src/app/api/admin/ads/reports/route.ts` | 1-20 | 관리자 집계 API Route 패턴 참조 (withApi + withRole + searchParams 파싱) |
| `app/src/server/ad/service.ts` | 299-329 | `getAdReport` 집계 서비스 패턴 참조 (admin client 사용, mapper 변환) |
| `app/src/api-client/admin.ts` | 1-250 | 기존 관리자 API 클라이언트 패턴 참조 |
| `app/src/api-client/client.ts` | 1-169 | axios 인스턴스 패턴 참조 |
| `app/src/lib/schema/ad.ts` | 210-218 | `AdminAdReportQuerySchema` 쿼리 스키마 패턴 참조 |
| `app/src/server/api/response.ts` | 1-42 | `ok` / `fail` 응답 유틸 |
| `app/src/server/api/errors.ts` | 1-51 | `ApiError` / `badRequest` 에러 팩토리 |
| `app/src/server/supabase/admin.ts` | 1-21 | `createSupabaseAdminClient` service_role 클라이언트 |
| `app/src/components/ui/Tab/Tab.tsx` | 1-79 | 기존 Tabs 컴포넌트 패턴 |
| `app/src/components/ui/Skeleton/Skeleton.tsx` | 1-53 | 로딩 스켈레톤 패턴 |
| `app/src/app/(main)/admin/settlements/page.tsx` | 1-50 | 관리자 페이지 프론트엔드 패턴 (nuqs, useQuery, adminApi) |
| `app/supabase/migrations/20251218190000_p0_schema.sql` | 72-268 | profiles, leads, lead_status_history 테이블 스키마 |
| `app/supabase/migrations/20260228120000_credit_system.sql` | 49-62 | credit_transactions 테이블 스키마 |
| `app/supabase/migrations/20260228120001_payments.sql` | 27-39 | payments 테이블 스키마 |
| `app/supabase/migrations/20260228141000_lead_charges.sql` | 26-44 | lead_charges 테이블 스키마 |
| `app/supabase/migrations/20260228150000_subscriptions.sql` | 23-38 | vendor_subscriptions 테이블 스키마 |
| `app/supabase/migrations/20260302000001_vendor_memberships.sql` | 50-64 | vendor_memberships 테이블 스키마 |
| `app/supabase/migrations/20260228140000_ad_system.sql` | 39-132 | ad_campaigns, ad_impressions, ad_priority_purchases 테이블 스키마 |
| `app/supabase/migrations/20260302140000_settlements.sql` | 13-36 | settlements 테이블 스키마 |
| `app/supabase/migrations/20260302200000_refund_requests.sql` | 16-29 | refund_requests 테이블 스키마 |
| `app/supabase/migrations/20260130000000_reports_sanctions.sql` | 50-60 | reports 테이블 스키마 |

## 0.3 Step-by-Step Implementation Tasks

| ID | Layer | File | Action | Description | Depends On |
|----|-------|------|--------|-------------|------------|
| SCHEMA-1 | Schema | `app/src/lib/schema/analytics.ts` | CREATE | 공통 쿼리 스키마(`AnalyticsQuerySchema`), 7개 응답 스키마, granularity enum | - |
| SCHEMA-2 | Migration | `app/supabase/migrations/20260311100000_analytics_indexes.sql` | CREATE | 집계 쿼리 성능용 인덱스 추가 | - |
| BACKEND-1 | Repository | `app/src/server/analytics/repository.ts` | CREATE | 7개 도메인 집계 쿼리 함수 (admin client 사용) | SCHEMA-1, SCHEMA-2 |
| BACKEND-2 | Mapper | `app/src/server/analytics/mapper.ts` | CREATE | DB Row -> DTO 변환 함수 | SCHEMA-1 |
| BACKEND-3 | Service | `app/src/server/analytics/service.ts` | CREATE | 7개 도메인 비즈니스 로직 (날짜 보정, 파라미터 검증, repository 호출) | BACKEND-1, BACKEND-2 |
| BACKEND-4 | API | `app/src/app/api/admin/analytics/overview/route.ts` | CREATE | GET overview 엔드포인트 | BACKEND-3 |
| BACKEND-5 | API | `app/src/app/api/admin/analytics/users/route.ts` | CREATE | GET users 엔드포인트 | BACKEND-3 |
| BACKEND-6 | API | `app/src/app/api/admin/analytics/leads/route.ts` | CREATE | GET leads 엔드포인트 | BACKEND-3 |
| BACKEND-7 | API | `app/src/app/api/admin/analytics/revenue/route.ts` | CREATE | GET revenue 엔드포인트 | BACKEND-3 |
| BACKEND-8 | API | `app/src/app/api/admin/analytics/ads/route.ts` | CREATE | GET ads 엔드포인트 | BACKEND-3 |
| BACKEND-9 | API | `app/src/app/api/admin/analytics/funnel/route.ts` | CREATE | GET funnel 엔드포인트 | BACKEND-3 |
| BACKEND-10 | API | `app/src/app/api/admin/analytics/operations/route.ts` | CREATE | GET operations 엔드포인트 | BACKEND-3 |
| FRONTEND-1 | API-Client | `app/src/api-client/analytics.ts` | CREATE | 7개 API 클라이언트 함수 | SCHEMA-1 |
| FRONTEND-2 | UI | `app/src/app/(main)/admin/dashboard/components/DateRangeFilter.tsx` | CREATE | 공통 기간 필터 컴포넌트 | - |
| FRONTEND-3 | UI | `app/src/app/(main)/admin/dashboard/components/KpiCard.tsx` | CREATE | KPI 카드 컴포넌트 | - |
| FRONTEND-4 | UI | `app/src/app/(main)/admin/dashboard/components/ChartPanel.tsx` | CREATE | 차트 래퍼 컴포넌트 | - |
| FRONTEND-5 | UI | `app/src/app/(main)/admin/dashboard/components/DashboardNav.tsx` | CREATE | 대시보드 서브 네비게이션 | - |
| FRONTEND-6 | UI | `app/src/app/(main)/admin/dashboard/page.tsx` | CREATE | Overview 메인 페이지 | FRONTEND-1~5, BACKEND-4 |
| FRONTEND-7 | UI | `app/src/app/(main)/admin/dashboard/users/page.tsx` | CREATE | 사용자 통계 페이지 | FRONTEND-1~5, BACKEND-5 |
| FRONTEND-8 | UI | `app/src/app/(main)/admin/dashboard/leads/page.tsx` | CREATE | 리드 통계 페이지 | FRONTEND-1~5, BACKEND-6 |
| FRONTEND-9 | UI | `app/src/app/(main)/admin/dashboard/revenue/page.tsx` | CREATE | 매출 통계 페이지 | FRONTEND-1~5, BACKEND-7 |
| FRONTEND-10 | UI | `app/src/app/(main)/admin/dashboard/ads/page.tsx` | CREATE | 광고 성과 페이지 | FRONTEND-1~5, BACKEND-8 |
| FRONTEND-11 | UI | `app/src/app/(main)/admin/dashboard/funnel/page.tsx` | CREATE | 퍼널 분석 페이지 | FRONTEND-1~5, BACKEND-9 |
| FRONTEND-12 | UI | `app/src/app/(main)/admin/dashboard/operations/page.tsx` | CREATE | 운영 지표 페이지 | FRONTEND-1~5, BACKEND-10 |
| FRONTEND-13 | UI | `app/src/app/(main)/admin/layout.tsx` | UPDATE | NAV_ITEMS 최상단에 대시보드 메뉴 추가 (BarChart3 아이콘) | - |
| FRONTEND-14 | UI | `app/src/app/(main)/admin/page.tsx` | UPDATE | 리다이렉트 대상을 `/admin/dashboard`로 변경 | - |

## 0.4 Parallelization Strategy

### 실행 모드

**Conservative** (기본) -- API 스펙이 신규이므로 Backend 완료 후 Frontend 시작 권장.

### 실행 단계

| Phase | Tasks | Executor | 비고 |
|-------|-------|----------|------|
| 1 | SCHEMA-1, SCHEMA-2 | schema-implementer | 스키마 + 인덱스 마이그레이션 |
| 2 | BACKEND-1~10 | backend-implementer | Repository, Mapper, Service, 7개 API Route |
| 3 | FRONTEND-1~14 | frontend-implementer | Phase 2 완료 후 시작. FRONTEND-2~5(공통 컴포넌트)와 FRONTEND-13~14(레이아웃 수정)는 API 무관하므로 Phase 2와 병렬 가능. |
| 4 | Integration | main | lint + type-check + 수동 검증 |

### 파일 소유권 (충돌 방지)

| Pattern | Owner | Others |
|---------|-------|--------|
| `app/src/lib/schema/analytics.ts` | schema-implementer | READ-ONLY |
| `app/supabase/migrations/20260311*` | schema-implementer | READ-ONLY |
| `app/src/server/analytics/**` | backend-implementer | READ-ONLY |
| `app/src/app/api/admin/analytics/**` | backend-implementer | READ-ONLY |
| `app/src/app/(main)/admin/dashboard/**` | frontend-implementer | READ-ONLY |
| `app/src/app/(main)/admin/layout.tsx` | frontend-implementer | READ-ONLY |
| `app/src/app/(main)/admin/page.tsx` | frontend-implementer | READ-ONLY |
| `app/src/api-client/analytics.ts` | frontend-implementer | READ-ONLY |

## 1. 범위

- **포함**
  - Overview KPI 카드 + 요약 차트 (P8-1)
  - 사용자 통계: DAU/MAU, 역할별 가입 추이 (P8-1)
  - 리드 통계: 생성 추이, 응답률, SLA 준수율, 과금 현황 (P8-1)
  - 매출 통계: 수익원별 집계, 결제 통계 (P8-1)
  - 광고 성과: 배너 노출/클릭/CTR, 우선순위 슬롯 현황 (P8-2 -- 본 TSD에 설계 포함하되 후순위 구현)
  - 퍼널 분석: 한의사/업체 전환 퍼널 (P8-2 -- 본 TSD에 설계 포함하되 후순위 구현)
  - 운영 지표: 미처리 큐 현황, 환불/신고/인증 (P8-1)
  - 관리자 사이드바 대시보드 메뉴 추가 + 기본 랜딩 변경
- **제외**
  - 실시간(WebSocket/SSE) 갱신
  - CSV/PDF 리포트 다운로드 (기존 `/admin/exports` 활용)
  - BI 수준 커스텀 리포트 빌더
  - 임계값 기반 자동 알림
  - materialized view 기반 성능 최적화 (후속 백로그)

## 2. 시스템 개요

### 2.1 아키텍처 / 경계

```
┌───────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│  API Routes (BFF)     │ -> │  Service             │ -> │  Repository          │
│  /api/admin/analytics │    │  analytics/service.ts │    │  analytics/repo.ts   │
│  (withRole["admin"])  │    │  (날짜 보정/검증)     │    │  (admin client 집계) │
└───────────────────────┘    └──────────────────────┘    └──────────────────────┘
         ^                                                          |
         |                                                          v
┌───────────────────────┐                               ┌──────────────────────┐
│  UI Pages             │                               │  Supabase (Postgres) │
│  /admin/dashboard/**  │                               │  service_role 쿼리   │
│  (React Query + nuqs) │                               │  RLS 바이패스        │
└───────────────────────┘                               └──────────────────────┘
```

- UI: `app/src/app/(main)/admin/dashboard/**`
- API: `app/src/app/api/admin/analytics/*/route.ts`
- API Client: `app/src/api-client/analytics.ts`
- Schema (Zod): `app/src/lib/schema/analytics.ts`
- Service: `app/src/server/analytics/service.ts`
- Repository: `app/src/server/analytics/repository.ts`
- Mapper: `app/src/server/analytics/mapper.ts`
- Auth: `app/src/server/auth/guards.ts` (기존 `withRole` 재사용)

### 2.2 데이터 흐름

1. UI (DateRangeFilter) -> nuqs로 URL 쿼리 파라미터 관리 (`from`, `to`, `granularity`)
2. React Query -> `analyticsApi.getOverview({from, to, granularity})` 호출
3. API Route -> `withApi(withRole(["admin"], ...))` -> Zod parse -> Service 호출
4. Service -> 날짜 보정 (미래 날짜 -> 오늘, 최대 365일 제한) -> Repository 호출
5. Repository -> `createSupabaseAdminClient()` -> SQL 집계 쿼리 실행
6. Mapper -> DB Row -> DTO 변환 -> `ok(data)` 응답

## 3. UI/UX 설계

### 3.1 해결할 문제 (PRD 기반)

- **핵심 문제**: 관리자가 플랫폼 운영 현황을 파악하려면 DB를 직접 조회해야 함 (`app/src/app/(main)/admin/layout.tsx:27-41` -- 대시보드 메뉴 없음)
- **핵심 니즈**: 접속 즉시 핵심 KPI 확인 -> 특정 도메인 드릴다운 -> 기간 변경하여 트렌드 추적
- **성공 기준**: 관리자가 별도 DB 조회 없이 주요 지표를 2초 이내에 확인 가능

### 3.2 정보 구조 (Information Architecture)

**핵심 정보 (Overview에 항상 표시):**
- 오늘 신규 가입자 수 (전일 대비 증감률)
- 오늘 리드 생성 수 (전일 대비 증감률)
- 오늘 총 매출 (전일 대비 증감률)
- 활성 업체 수

**부가 정보 (각 탭 드릴다운 시 표시):**
- 사용자: DAU/MAU, 역할별 가입 추이, 스티키니스 지표
- 리드: 카테고리별 분포, 응답률, SLA 준수율, 과금 현황
- 매출: 수익원별 비중, 결제 수단별 분포, 추이 차트
- 광고: 캠페인별 성과 테이블, 슬롯 가동률
- 퍼널: 한의사/업체 전환율 퍼널 차트
- 운영: 미처리 큐 (환불/신고/인증/정산)

**정보 그룹핑:**
- Overview + 6개 도메인별 탭으로 그룹핑
- 각 탭 내에서 상단 요약 카드 + 하단 차트/테이블 구조

### 3.3 흐름(Flow) 설계

**메인 플로우:**
```
[관리자 로그인] -> [/admin -> /admin/dashboard 리다이렉트]
   -> [Overview: KPI 카드 + 요약 차트 확인]
   -> [서브 탭 클릭 (users/leads/revenue/...)]
   -> [기간 필터 변경 (오늘/7일/30일/90일/커스텀)]
   -> [상세 차트/테이블 확인]
```

**예외/이탈 루트:**
- 데이터 없음 -> "아직 데이터가 없습니다" 빈 상태 메시지 표시
- API 에러 -> 에러 카드 + "재시도" 버튼 (React Query retry 3회 자동)
- 기간 시작일 > 종료일 -> DateRangeFilter에서 선택 불가 처리
- 365일 초과 기간 -> 서버 400 에러 + 프론트 토스트

### 3.4 레이아웃 및 시각적 위계

**레이아웃 선택 + 근거:**
- 메인 레이아웃: **카드 그리드 (KPI) + 차트 패널 (트렌드)** -- 대시보드 특성상 테이블보다 시각적 요약이 적합
- 상세 데이터: **테이블** -- 카테고리별 SLA, 캠페인별 성과 등 비교 데이터는 테이블이 적합

**시각적 위계 (중요도순):**
1. **Primary**: KPI 카드 (숫자 + 증감률) -- 즉각 파악
2. **Secondary**: 트렌드 차트 (시계열) -- 추이 파악
3. **Tertiary**: 상세 테이블/분포 차트 -- 드릴다운

**영역 구분 (Overview 페이지):**
```
┌─────────────────────────────────────────────────────────────┐
│  [대시보드 서브 네비게이션 탭]                                 │
│  Overview | 사용자 | 리드 | 매출 | 광고 | 퍼널 | 운영         │
├─────────────────────────────────────────────────────────────┤
│  [기간 필터] 오늘 / 7일 / 30일 / 90일 / 커스텀               │
├───────────────┬───────────────┬──────────────┬──────────────┤
│  [KPI 카드]   │  [KPI 카드]   │  [KPI 카드]  │  [KPI 카드]  │
│  신규 가입자  │  리드 생성    │  오늘 매출   │  활성 업체   │
│  +12% ▲      │  -3% ▼       │  +25% ▲     │  128        │
├───────────────┴───────────────┴──────────────┴──────────────┤
│  [일별 가입자 트렌드 - BarChart]                              │
├─────────────────────────────────────────────────────────────┤
│  [일별 리드 생성 트렌드 - LineChart]                          │
├─────────────────────────────────────────────────────────────┤
│  [일별 매출 트렌드 - LineChart]                               │
└─────────────────────────────────────────────────────────────┘
```

**영역 구분 (상세 탭 페이지, 예: 매출 통계):**
```
┌─────────────────────────────────────────────────────────────┐
│  [대시보드 서브 네비게이션 탭] -- 매출 활성                    │
├─────────────────────────────────────────────────────────────┤
│  [기간 필터]                                                 │
├───────────────┬───────────────┬──────────────┬──────────────┤
│  [요약 카드]  │  [요약 카드]  │  [요약 카드] │  [요약 카드] │
│  총 매출     │  리드 과금    │  구독 매출   │  평균 결제액 │
├─────────────────────────────┬───────────────────────────────┤
│  [수익원별 추이 AreaChart]   │  [수익원별 비중 PieChart]      │
├─────────────────────────────┴───────────────────────────────┤
│  [결제 수단별 분포 BarChart]                                  │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 컴포넌트 구조

**파일 구조:**
```
app/src/app/(main)/admin/dashboard/
  page.tsx                          -- Overview 메인 (200줄 이하)
  users/
    page.tsx                        -- 사용자 통계
  leads/
    page.tsx                        -- 리드 통계
  revenue/
    page.tsx                        -- 매출 통계
  ads/
    page.tsx                        -- 광고 성과
  funnel/
    page.tsx                        -- 퍼널 분석
  operations/
    page.tsx                        -- 운영 지표
  components/
    DateRangeFilter.tsx             -- 기간 필터 (preset + 커스텀)
    KpiCard.tsx                     -- KPI 카드 (값, 증감률, 아이콘)
    ChartPanel.tsx                  -- 차트 래퍼 (제목, 로딩/에러/빈 상태)
    DashboardNav.tsx                -- 서브 네비게이션 탭
```

**분리 기준:**
- page.tsx: 200줄 이하 (레이아웃 + React Query 조합만)
- 차트 컴포넌트 (recharts): `dynamic import`로 지연 로딩 (번들 크기 최적화, PRD 리스크 항목)
- 공통 컴포넌트 4개는 `dashboard/components/`에 배치 (대시보드 전용, 범용 UI 컴포넌트 아님)

### 3.6 상태 및 피드백

| 상태 | UI 표현 |
|------|---------|
| 초기 로딩 | KPI 카드: Skeleton (4개) + 차트 영역: Skeleton (높이 고정) |
| 데이터 없음 (빈 기간) | "선택한 기간에 데이터가 없습니다" + Empty 컴포넌트 |
| API 에러 | ChartPanel 내 에러 카드 + "재시도" 버튼 (해당 섹션만 에러) |
| 기간 필터 변경 | 차트 영역만 로딩 스피너 (KPI 카드는 이전 데이터 유지 -- React Query 패턴) |
| 탭 전환 | 새 페이지 로딩 (Next.js 라우팅) |

**UX 편의 기능:**
- 기간 프리셋 버튼 (오늘/7일/30일/90일): 클릭 즉시 반영
- 커스텀 기간: 날짜 선택기(input type="date") 2개
- 탭 전환: URL 기반 라우팅 (뒤로가기 지원)

### 3.7 상태 관리

- **서버 상태**: React Query 직접 사용 (커스텀 Hook 래핑 금지)
  - 쿼리 키 패턴: `["admin", "analytics", "<domain>", {from, to, granularity}]`
  - `staleTime: 5 * 60 * 1000` (5분)
  - `retry: 3` (기본)
- **URL 상태**: nuqs 사용
  - `from`: `parseAsString` (ISO date, 기본값: 7일 전)
  - `to`: `parseAsString` (ISO date, 기본값: 오늘)
  - `granularity`: `parseAsString` (기본값: `'day'`)
- **클라이언트 상태**: 없음 (Zustand 불필요 -- 모든 상태가 URL 또는 서버 상태)

### 3.8 API Client

- 파일: `app/src/api-client/analytics.ts`
- 메서드 시그니처:
  - `analyticsApi.getOverview(params: AnalyticsQuery): Promise<OverviewResponse>`
  - `analyticsApi.getUsers(params: AnalyticsQuery): Promise<UsersResponse>`
  - `analyticsApi.getLeads(params: AnalyticsQuery): Promise<LeadsResponse>`
  - `analyticsApi.getRevenue(params: AnalyticsQuery): Promise<RevenueResponse>`
  - `analyticsApi.getAds(params: AnalyticsQuery): Promise<AdsResponse>`
  - `analyticsApi.getFunnel(params: AnalyticsQuery): Promise<FunnelResponse>`
  - `analyticsApi.getOperations(params: AnalyticsQuery): Promise<OperationsResponse>`
- 모든 메서드는 `api.get<T>("/api/admin/analytics/<domain>", { params })` 패턴
- 기존 `app/src/api-client/client.ts` axios 인스턴스 사용

## 4. 데이터 모델

### 4.1 기존 테이블 변경

DB 스키마 변경 없음. 기존 테이블에 대한 집계 쿼리로만 구현.

### 4.2 인덱스 추가

마이그레이션: `app/supabase/migrations/20260311100000_analytics_indexes.sql`

추가할 인덱스:

| 테이블 | 인덱스명 | 컬럼 | 용도 |
| --- | --- | --- | --- |
| `profiles` | `idx_profiles_created_at` | `created_at` | 일별 가입자 집계 |
| `profiles` | `idx_profiles_role_created_at` | `role, created_at` | 역할별 가입 추이 |
| `leads` | `idx_leads_created_at` | `created_at` | 일별 리드 생성 집계 |
| `payments` | `idx_payments_created_at` | `created_at` | 일별 결제 집계 |
| `refund_requests` | `idx_refund_requests_reviewed_at` | `reviewed_at` | 환불 처리 시간 계산 |
| `vendor_subscriptions` | `idx_vs_created_at` | `created_at` | 구독 매출 기간 집계 |
| `vendor_memberships` | `idx_vm_created_at` | `created_at` | 입점비 매출 기간 집계 |
| `ad_priority_purchases` | `idx_app_created_at` | `created_at` | 광고 매출 기간 집계 |
| `reports` | `idx_reports_created_at` | `created_at` | 일별 신고 접수 집계 |

롤백(down) 전략: `DROP INDEX IF EXISTS` -- 인덱스만 추가하므로 데이터 손실 없이 안전하게 롤백 가능.

## 5. API 설계

### 5.0 공통 사항

**공통 쿼리 스키마** (`AnalyticsQuerySchema`):

| 필드 | 타입 | 제약 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `from` | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` | ISO date | 7일 전 | 시작일 |
| `to` | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` | ISO date | 오늘 | 종료일 |
| `granularity` | `z.enum(['day', 'week', 'month'])` | - | `'day'` | 집계 단위 |

**공통 검증 규칙** (Service 레이어):
- `to`가 오늘 이후 -> 오늘로 자동 보정
- `from > to` -> `badRequest("시작일은 종료일보다 이전이어야 합니다.")`
- 기간이 365일 초과 -> `badRequest("최대 365일까지 조회 가능합니다.")`

**공통 응답 래퍼**: `{ code: "0000", data: { ... }, message?: string }`

**공통 에러 응답**:
- `400`: 잘못된 기간 파라미터
- `401`: 인증 실패
- `403`: admin 권한 없음
- `500`: 집계 쿼리 실패

**권한**: 모든 엔드포인트 `withRole(["admin"], ...)` -- `app/src/server/auth/guards.ts:109`

---

### 5.1 GET /api/admin/analytics/overview

| 항목 | 내용 |
| --- | --- |
| 메서드/경로 | `GET /api/admin/analytics/overview` |
| 권한 | `withRole(["admin"])` |
| 요청 스키마 | `AnalyticsQuerySchema` (query params) |
| 응답 스키마 | `OverviewResponseSchema` |

**응답 데이터 shape:**

```
{
  kpi: {
    newUsersToday: number,
    newUsersYesterday: number,
    newUsersChangeRate: number,         // 전일 대비 증감률 (%)
    leadsToday: number,
    leadsYesterday: number,
    leadsChangeRate: number,
    revenueToday: number,               // 크레딧 충전액 기준
    revenueYesterday: number,
    revenueChangeRate: number,
    activeVendors: number,              // vendors.status = 'active' 총 수
  },
  trends: {
    users: Array<{ date: string, count: number }>,        // 기간 내 일별 신규 가입자
    leads: Array<{ date: string, count: number }>,        // 기간 내 일별 리드 생성
    revenue: Array<{ date: string, amount: number }>,     // 기간 내 일별 매출
  }
}
```

---

### 5.2 GET /api/admin/analytics/users

| 항목 | 내용 |
| --- | --- |
| 메서드/경로 | `GET /api/admin/analytics/users` |
| 권한 | `withRole(["admin"])` |
| 요청 스키마 | `AnalyticsQuerySchema` (query params) |
| 응답 스키마 | `UsersAnalyticsResponseSchema` |

**응답 데이터 shape:**

```
{
  dau: number,                        // 당일 활성 사용자 (admin 제외)
  mau: number,                        // 최근 30일 활성 사용자 (admin 제외)
  dauMauRatio: number,                // DAU/MAU (소수점 2자리)
  signupTrend: Array<{
    date: string,
    doctor: number,
    vendor: number,
  }>,                                 // granularity 기준 역할별 가입자 수
  cumulativeUsers: Array<{
    date: string,
    doctor: number,
    vendor: number,
  }>,                                 // 역할별 누적 회원 수
  activeTrend: Array<{
    date: string,
    doctor: number,
    vendor: number,
  }>,                                 // granularity 기준 역할별 활성 사용자
}
```

DAU/MAU 계산 기준: `auth.users.last_sign_in_at` (PRD 오픈 이슈 -- 초기 구현 기준). admin 계정은 `profiles.role = 'admin'`인 사용자를 제외.

---

### 5.3 GET /api/admin/analytics/leads

| 항목 | 내용 |
| --- | --- |
| 메서드/경로 | `GET /api/admin/analytics/leads` |
| 권한 | `withRole(["admin"])` |
| 요청 스키마 | `AnalyticsQuerySchema` (query params) |
| 응답 스키마 | `LeadsAnalyticsResponseSchema` |

**응답 데이터 shape:**

```
{
  creationTrend: Array<{
    date: string,
    count: number,
  }>,                                 // granularity 기준 리드 생성 수
  categoryDistribution: Array<{
    categoryId: string,
    categoryName: string,
    count: number,
  }>,                                 // 카테고리별 리드 분포 (기간 내)
  responseRate: {
    total: number,                    // 전체 리드 수
    responded: number,                // 응답된 리드 수 (status NOT IN submitted, canceled, closed)
    rate: number,                     // 응답률 (%)
  },
  slaCompliance: {
    totalMeasured: number,            // SLA 측정 가능한 리드 수
    compliant: number,                // 72시간 내 응답
    rate: number,                     // SLA 준수율 (%)
    byCategory: Array<{
      categoryId: string,
      categoryName: string,
      totalMeasured: number,
      compliant: number,
      rate: number,
    }>,
  },
  avgResponseTime: {
    overall: number,                  // 전체 평균 응답 시간 (시간)
    distribution: {
      within24h: number,
      within48h: number,
      within72h: number,
      over72h: number,
    },
  },
  charges: {
    trend: Array<{
      date: string,
      count: number,
      amount: number,
    }>,                               // 일별 과금 건수 및 금액
    refundCount: number,              // 환불/복구 건수
    refundAmount: number,             // 환불/복구 금액
    duplicateRate: number,            // 중복 리드 비율 (%)
  },
}
```

SLA 계산: `lead_status_history` 테이블에서 `from_status = 'submitted'`인 최초 기록의 `created_at`과 리드 `created_at` 간 차이. `lead_status_history`가 없는 리드는 SLA 미측정으로 처리 (비율 계산 제외).

---

### 5.4 GET /api/admin/analytics/revenue

| 항목 | 내용 |
| --- | --- |
| 메서드/경로 | `GET /api/admin/analytics/revenue` |
| 권한 | `withRole(["admin"])` |
| 요청 스키마 | `AnalyticsQuerySchema` (query params) |
| 응답 스키마 | `RevenueAnalyticsResponseSchema` |

**응답 데이터 shape:**

```
{
  summary: {
    totalRevenue: number,             // 총 매출
    creditCharges: number,            // 크레딧 충전액
    leadCharges: number,              // 리드 과금액
    subscriptions: number,            // 구독 매출
    memberships: number,              // 입점비 매출
    adBanners: number,                // 배너 광고 매출
    adPriority: number,               // 우선순위 광고 매출
  },
  revenueTrend: Array<{
    date: string,
    creditCharges: number,
    leadCharges: number,
    subscriptions: number,
    memberships: number,
    adBanners: number,
    adPriority: number,
  }>,                                 // granularity 기준 수익원별 추이
  payments: {
    trend: Array<{
      date: string,
      count: number,
      amount: number,
    }>,                               // 결제 건수/금액 추이
    byMethod: Array<{
      method: string,
      count: number,
      amount: number,
    }>,                               // 결제 수단별 분포
    avgAmount: number,                // 평균 결제 금액
  },
}
```

**매출 집계 로직 상세:**
- 크레딧 충전: `credit_transactions WHERE type = 'charge' AND status = 'completed'`의 `amount` 합계
- 리드 과금: `lead_charges WHERE status = 'charged'`의 `total_amount` 합계
- 구독: `vendor_subscriptions`의 `price_paid` 합계 (기간 내 `created_at` 기준)
- 입점비: `vendor_memberships`의 `price_paid` 합계 (기간 내 `created_at` 기준)
- 배너 광고: `ad_campaigns WHERE status IN ('active', 'completed')`의 `monthly_price` 합계 (기간 내 활성 일수 비례 -- 초기에는 캠페인 시작일에 전액 인식. PRD 오픈 이슈 참조)
- 우선순위 광고: `ad_priority_purchases`의 `price_paid` 합계 (기간 내 `created_at` 기준)
- 결제: `payments WHERE status = 'done'` 기준

---

### 5.5 GET /api/admin/analytics/ads

| 항목 | 내용 |
| --- | --- |
| 메서드/경로 | `GET /api/admin/analytics/ads` |
| 권한 | `withRole(["admin"])` |
| 요청 스키마 | `AnalyticsQuerySchema` (query params) |
| 응답 스키마 | `AdsAnalyticsResponseSchema` |

**응답 데이터 shape:**

```
{
  banner: {
    impressionTrend: Array<{
      date: string,
      impressions: number,
      clicks: number,
      ctr: number,
    }>,                               // 일별 배너 노출/클릭/CTR
    campaigns: Array<{
      campaignId: string,
      advertiserName: string,
      slotPosition: string,
      startsAt: string,
      endsAt: string,
      impressions: number,
      clicks: number,
      ctr: number,
      monthlyPrice: number,
    }>,                               // 캠페인별 성과 테이블
    slotUtilization: {
      main: { total: number, active: number, rate: number },
      sub: { total: number, active: number, rate: number },
    },                                // 메인/서브 슬롯 가동률
  },
  priority: {
    slotUtilization: Array<{
      tier: string,
      total: number,
      active: number,
      rate: number,
    }>,                               // 등급별 슬롯 가동률
    revenueTrend: Array<{
      date: string,
      premium: number,
      plusUp: number,
      plus: number,
      rookie: number,
    }>,                               // 등급별 매출 추이
    categoryOccupancy: Array<{
      categoryId: string,
      categoryName: string,
      tier: string,
      maxSlots: number,
      activeSlots: number,
    }>,                               // 카테고리별 슬롯 점유 현황
  },
}
```

---

### 5.6 GET /api/admin/analytics/funnel

| 항목 | 내용 |
| --- | --- |
| 메서드/경로 | `GET /api/admin/analytics/funnel` |
| 권한 | `withRole(["admin"])` |
| 요청 스키마 | `AnalyticsQuerySchema` (query params: `from`, `to` -- granularity 미사용) |
| 응답 스키마 | `FunnelAnalyticsResponseSchema` |

**응답 데이터 shape:**

```
{
  doctor: {
    signup: number,                   // 가입 수 (기간 내 created_at)
    verificationSubmitted: number,    // 인증 제출 수
    verificationApproved: number,     // 인증 승인 수
    firstLead: number,                // 첫 리드 생성 수
    conversionRates: {
      signupToVerification: number,   // %
      verificationToApproval: number, // %
      approvalToFirstLead: number,    // %
      overallConversion: number,      // % (가입 -> 첫 리드)
    },
  },
  vendor: {
    signup: number,
    verificationSubmitted: number,
    verificationApproved: number,
    firstLeadResponse: number,        // 첫 리드 응답 수
    conversionRates: {
      signupToVerification: number,
      verificationToApproval: number,
      approvalToFirstResponse: number,
      overallConversion: number,
    },
  },
}
```

퍼널 계산 기준: 기간 내 가입한 코호트 기준. 즉 `from`~`to` 사이에 `profiles.created_at`이 속하는 사용자만 대상.

---

### 5.7 GET /api/admin/analytics/operations

| 항목 | 내용 |
| --- | --- |
| 메서드/경로 | `GET /api/admin/analytics/operations` |
| 권한 | `withRole(["admin"])` |
| 요청 스키마 | `AnalyticsQuerySchema` (query params) |
| 응답 스키마 | `OperationsAnalyticsResponseSchema` |

**응답 데이터 shape:**

```
{
  refunds: {
    pendingCount: number,                 // 미처리 환불 요청 수
    trend: Array<{ date: string, count: number }>, // 일별 환불 요청 추이
    approvalRate: number,                 // 환불 승인율 (%)
    avgProcessingHours: number,           // 평균 처리 시간 (시간)
  },
  reports: {
    pendingCount: number,                 // 미처리 신고 수 (pending + reviewing)
    byTargetType: Array<{
      targetType: string,
      count: number,
    }>,                                   // 신고 유형별 분포
    trend: Array<{ date: string, count: number }>, // 일별 신고 접수 추이
  },
  verifications: {
    doctorPending: number,                // 미처리 한의사 인증 수
    vendorPending: number,                // 미처리 업체 인증 수
    avgProcessingHours: number,           // 평균 처리 시간 (시간)
  },
  settlements: {
    pendingCount: number,                 // 미확인 정산 수
    currentMonthTotal: number,            // 이번 달 정산 총액
  },
}
```

---

## 6. 서비스/도메인 계층

### 6.1 analytics service (`app/src/server/analytics/service.ts`)

모든 service 함수의 공통 패턴:
- 입력: `supabase: SupabaseClient<Database>` (사용하지 않음 -- 시그니처 호환), `params: { from: string, to: string, granularity: 'day' | 'week' | 'month' }`
- 내부적으로 `createSupabaseAdminClient()`로 service_role 클라이언트 생성 (RLS 바이패스)
- 날짜 보정 로직 수행 후 repository 함수 호출
- mapper로 DTO 변환 후 반환

**메서드 목록:**

- `getOverviewAnalytics(supabase, params)` -> `OverviewData`
  - repository: `fetchKpiData`, `fetchTrendData`

- `getUsersAnalytics(supabase, params)` -> `UsersData`
  - repository: `fetchDauMau`, `fetchSignupTrend`, `fetchCumulativeUsers`, `fetchActiveTrend`

- `getLeadsAnalytics(supabase, params)` -> `LeadsData`
  - repository: `fetchLeadCreationTrend`, `fetchCategoryDistribution`, `fetchResponseRate`, `fetchSlaCompliance`, `fetchAvgResponseTime`, `fetchLeadCharges`

- `getRevenueAnalytics(supabase, params)` -> `RevenueData`
  - repository: `fetchRevenueSummary`, `fetchRevenueTrend`, `fetchPaymentStats`

- `getAdsAnalytics(supabase, params)` -> `AdsData`
  - repository: `fetchBannerStats`, `fetchPriorityStats`

- `getFunnelAnalytics(supabase, params)` -> `FunnelData`
  - repository: `fetchDoctorFunnel`, `fetchVendorFunnel`

- `getOperationsAnalytics(supabase, params)` -> `OperationsData`
  - repository: `fetchRefundStats`, `fetchReportStats`, `fetchVerificationStats`, `fetchSettlementStats`

**공통 날짜 보정 함수** (`validateAndNormalizeDateRange`):

```
입력: { from?: string, to?: string }
처리:
  1. from 미지정 -> 7일 전
  2. to 미지정 -> 오늘
  3. to > 오늘 -> 오늘로 보정
  4. from > to -> badRequest 발생
  5. 기간 > 365일 -> badRequest 발생
반환: { from: string, to: string } (보정된 날짜)
```

### 6.2 analytics repository (`app/src/server/analytics/repository.ts`)

- `"server-only"` import
- 모든 함수는 `createSupabaseAdminClient()` 반환 값을 인자로 받음
- 에러 발생 시 `internalServerError` throw
- 집계 쿼리는 Supabase JS client의 `.rpc()` 또는 `.from().select()` 사용
  - 복잡한 집계가 필요한 경우 (예: SLA 계산, 퍼널 분석) `.rpc()` 사용 불가 시 raw SQL 대안 검토 필요하나, 초기에는 Supabase client의 필터링 + JS 측 집계로 구현
  - 단순 집계 (COUNT, SUM, GROUP BY date_trunc): Supabase client `.select("count")` + 필터 조합

**주요 집계 쿼리 패턴 (예시):**

- 일별 가입자: `profiles` WHERE `created_at BETWEEN from AND to` GROUP BY `date_trunc(granularity, created_at)`
- DAU: `auth.users` WHERE `last_sign_in_at::date = today` AND `id NOT IN (admin profiles)` COUNT DISTINCT
- 수익원별 매출: 각 테이블 별도 쿼리 + JS 측 합산
- SLA 준수율: `lead_status_history` JOIN `leads` WHERE `from_status IS NULL` (첫 상태 변경) AND `created_at - lead.created_at <= 72h`

### 6.3 analytics mapper (`app/src/server/analytics/mapper.ts`)

- DB Row -> DTO 변환 함수
- 증감률 계산: `(today - yesterday) / yesterday * 100` (yesterday = 0이면 today > 0 -> 100%, today = 0 -> 0%)
- CTR 계산: `impressions > 0 ? (clicks / impressions * 100).toFixed(2) : 0`
- 비율 계산: `total > 0 ? (part / total * 100).toFixed(2) : 0`

### 6.4 기존 서비스 변경

기존 서비스 변경 없음.

## 7. 테스트 전략

| 구분 | 시나리오 | 도구 |
| --- | --- | --- |
| 정적 검증 | 타입 안전성, 린트 규칙 준수 | `pnpm lint`, `pnpm type-check` |
| 수동 검증 | 각 탭 페이지 렌더링, 기간 필터 동작, 차트 표시, 빈 상태 처리 | 브라우저 |

### 검증 명령

```bash
cd app
pnpm lint
pnpm type-check
```

## 8. 운영/배포

- 마이그레이션 적용 순서:
  1. `pnpm db:migrate` (인덱스 추가 마이그레이션)
  2. `pnpm db:gen` (타입 재생성 -- 테이블 변경 없으므로 선택적)
  3. 서버 코드 배포 (API Route + Service)
  4. 프론트 코드 배포 (대시보드 페이지)
- 롤백 절차:
  - 인덱스 마이그레이션: `DROP INDEX IF EXISTS` -- 데이터 손실 없음
  - 서버/프론트 코드: 이전 버전 배포 (대시보드 페이지가 없으면 404, 기존 기능 영향 없음)
- 기능 플래그: 불필요 (관리자 전용, 점진적 롤아웃 불필요)

## 9. 백로그

- [ ] 광고 성과 상세 (기존 `/admin/ads` 리포트를 대시보드로 통합)
- [ ] 퍼널/전환 분석 (코호트 기반 퍼널 계산 쿼리 최적화)
- [ ] 비딩 통계 (프로젝트 생성/입찰/선정 추이)
- [ ] CSV/PDF 리포트 다운로드
- [ ] 대시보드 커스터마이징 (위젯 순서 변경)
- [ ] 임계값 기반 자동 알림
- [ ] materialized view 기반 성능 최적화 (데이터 증가 시)
- [ ] DAU/MAU를 별도 `user_activity_logs` 테이블 기반으로 전환 (정확도 개선)
- [ ] 단위/통합 테스트 추가
