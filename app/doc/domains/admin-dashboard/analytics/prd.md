# 관리자 대시보드/통계 고도화 PRD

> 참조: `app/src/app/(main)/admin/layout.tsx:1`, `app/supabase/migrations/20251218190000_p0_schema.sql:1`
> 본 문서는 P7까지 구현된 수익화 기능(크레딧, 결제, 리드 과금, 구독, 입점비, 광고, 비딩, 정산, 환불, 데이터 내보내기)의 운영 데이터를 관리자가 한눈에 파악할 수 있는 대시보드/통계 고도화를 정의한다.

## 1. 배경 및 문제 정의

- 현재 관리자 페이지(`/admin`)는 인증 승인, 사용자/업체/카테고리 CRUD, 신고 관리, 정산, 환불 등 **운영 기능** 위주로 구성되어 있다. 통계/대시보드 화면이 전혀 없어 플랫폼 현황을 파악하려면 DB를 직접 조회해야 한다.
  - 근거: `app/src/app/(main)/admin/layout.tsx:27-41` -- NAV_ITEMS에 통계/대시보드 메뉴 없음
  - 근거: `app/src/app/(main)/admin/page.tsx:10` -- 관리자 루트 진입 시 `/admin/verifications`로 리다이렉트

- P7까지 완료되면서 크레딧 충전(`credit_transactions`), 결제(`payments`), 리드 과금(`lead_charges`), 구독(`vendor_subscriptions`), 입점비(`vendor_memberships`), 광고(`ad_campaigns`, `ad_impressions`, `ad_priority_purchases`), 비딩(`bid_projects`, `bid_responses`), 정산(`settlements`), 환불(`refund_requests`) 등 다양한 거래 데이터가 축적되고 있으나 이를 집계/시각화하는 수단이 없다.

- 운영 의사결정(마케팅 투자, 가격 정책 조정, SLA 기준 변경 등)에 데이터 기반 근거가 부재하여, 감에 의존한 운영이 불가피하다.

## 2. 목표 (Goals)

1. 관리자가 별도 DB 조회 없이 플랫폼 핵심 지표(사용자, 리드, 매출, 광고, 운영)를 실시간에 가까운 수준으로 파악할 수 있다.
2. 기간별(오늘/7일/30일/90일/커스텀) 필터를 통해 트렌드 변화를 추적할 수 있다.
3. 기존 DB 테이블의 집계 쿼리로 구현하여 신규 테이블을 최소화한다.
4. recharts 기반 차트 시각화로 직관적인 데이터 이해를 제공한다.

## 3. 비범위 (Non-Goals)

- 실시간(WebSocket/SSE) 갱신 -- 페이지 로드 시 조회 + React Query 캐싱으로 충분
- 관리자 외 역할(doctor/vendor)을 위한 대시보드 -- 별도 PRD로 분리
- BI 도구 수준의 커스텀 리포트 빌더 -- 고정된 통계 카드/차트로 한정
- GA4/Tag Manager 연동 -- P8의 별도 항목으로 분리 (`app/doc/todo.md:653`)
- 알림/임계값 기반 자동 경고(매출 급감 알림 등) -- 후속 백로그
- PDF 리포트 다운로드 -- 후속 백로그 (현재 CSV Export는 `app/src/app/api/exports/` 참조)

## 4. 주요 사용자 및 시나리오

| 사용자 | 시나리오 | 기대 결과 |
| ------ | -------- | --------- |
| 관리자(admin) | 매일 아침 대시보드에 접속하여 전일 신규 가입자, 리드 수, 매출 요약을 확인한다 | Overview 페이지에서 KPI 카드와 트렌드 차트로 한눈에 파악 |
| 관리자(admin) | 이번 달 매출 구성(리드 과금 vs 구독 vs 입점비 vs 광고)을 파악하여 가격 정책 조정 근거를 마련한다 | 매출 통계 탭에서 수익원별 비중 파이차트 + 일별 추이를 확인 |
| 관리자(admin) | 업체 SLA(72시간 내 리드 응답) 준수율이 낮은 카테고리를 식별한다 | 리드 통계 탭에서 카테고리별 SLA 준수율 테이블을 확인 |
| 관리자(admin) | 배너 광고 캠페인 A의 CTR이 기대치 이하인지 확인하고 소재 교체를 결정한다 | 광고 성과 탭에서 캠페인별 노출/클릭/CTR 추이 차트를 확인 |
| 관리자(admin) | 가입 후 첫 리드 생성까지의 전환율 추이를 보고 온보딩 개선 우선순위를 판단한다 | 퍼널 분석 탭에서 단계별 전환율 퍼널 차트를 확인 |
| 관리자(admin) | 미처리 환불 요청이 쌓이고 있는지 빠르게 파악한다 | 운영 지표 탭에서 미처리 환불/신고/인증 큐 현황 카드를 확인 |

## 5. 기능 요구사항

### 5.1 대시보드 Overview (메인)

- 경로: `/admin/dashboard`
- 관리자 진입 시 기본 랜딩 페이지를 `/admin/verifications`에서 `/admin/dashboard`로 변경
  - 근거: `app/src/app/(main)/admin/page.tsx:10`
- 상단 KPI 카드 (당일 기준, 전일 대비 증감률 표시):
  - 오늘 신규 가입자 수
  - 오늘 리드 생성 수
  - 오늘 총 매출 (크레딧 충전액 기준)
  - 활성 업체 수 (vendor.status = 'active')
- 하단 요약 차트 (최근 7일 기본):
  - 일별 신규 가입자 트렌드 (막대)
  - 일별 리드 생성 트렌드 (선)
  - 일별 매출 트렌드 (선)
- 기간 필터: 오늘 / 최근 7일 / 최근 30일 / 최근 90일 / 커스텀 (날짜 범위 선택)

### 5.2 사용자 통계

- 경로: `/admin/dashboard/users`
- DAU/MAU:
  - DAU: `auth.users`의 `last_sign_in_at`이 당일인 고유 사용자 수
  - MAU: `auth.users`의 `last_sign_in_at`이 최근 30일 이내인 고유 사용자 수
  - DAU/MAU 비율 (스티키니스 지표)
- 신규 회원 통계:
  - 역할별(doctor/vendor) 일별 가입자 수 -- `profiles` 테이블의 `role`과 `created_at` 기준
  - 누적 회원 수 추이 (역할별 스택 영역 차트)
- 활성 사용자 트렌드:
  - 일별/주별/월별 활성 사용자 수 (로그인 기준)
  - 역할별 분리 표시

### 5.3 리드 통계

- 경로: `/admin/dashboard/leads`
- 리드 생성 추이:
  - 일/주/월별 리드 생성 수 -- `leads.created_at` 기준
  - 카테고리별 리드 분포 -- `leads.category_ids` + `categories` 조인
- 응답률:
  - 전체 응답률: `status NOT IN ('submitted', 'canceled', 'closed')` / 전체 리드 비율
  - 카테고리별 응답률
- SLA 준수율 (72시간 내 응답):
  - `lead_status_history`에서 `submitted` -> 첫 상태 변경까지의 시간이 72시간 이내인 비율
  - 카테고리별 SLA 준수율 테이블 (하위 카테고리 하이라이트)
- 평균 응답 시간:
  - 전체 평균 / 카테고리별 평균 (시간 단위)
  - 응답 시간 분포 히스토그램 (0-24h / 24-48h / 48-72h / 72h+)
- 리드 과금 현황:
  - 일별 과금 건수 및 금액 -- `lead_charges` 테이블
  - 환불/복구 건수 및 금액 -- `lead_charges.status = 'refunded'`
  - 중복 리드 비율 -- `lead_charges.is_duplicate = true`

### 5.4 매출 통계

- 경로: `/admin/dashboard/revenue`
- 수익원별 매출 (일/주/월 집계):
  - 크레딧 충전액: `credit_transactions` WHERE `type = 'charge'` AND `status = 'completed'`
  - 리드 과금액: `lead_charges` WHERE `status = 'charged'`의 `total_amount` 합계
  - 구독 매출: `vendor_subscriptions`의 `price_paid` 합계 (기간 내 생성 건)
  - 입점비 매출: `vendor_memberships`의 `price_paid` 합계 (기간 내 생성 건)
  - 광고 매출 (배너): `ad_campaigns`의 `monthly_price` 비례 분배 (활성 캠페인)
  - 광고 매출 (우선순위): `ad_priority_purchases`의 `price_paid` 합계 (기간 내 생성 건)
- 매출 구성 비율: 파이 차트 (수익원별 비중)
- 매출 추이: 스택 영역 차트 (수익원별 일별 추이)
- 결제 통계:
  - 결제 건수/금액 추이 -- `payments` WHERE `status = 'done'`
  - 결제 수단별 분포 -- `payments.method` 기준
  - 평균 결제 금액

### 5.5 광고 성과

- 경로: `/admin/dashboard/ads`
- 배너 광고:
  - 일별 총 노출수 / 클릭수 / CTR -- `ad_impressions` 테이블 집계
  - 캠페인별 성과 테이블: 캠페인명, 슬롯(메인/서브), 기간, 노출, 클릭, CTR, 월 단가
  - 슬롯 가동률: 활성 캠페인 수 / 전체 슬롯 수 (메인/서브 각각)
- 우선순위 노출:
  - 슬롯 가동률: 활성 구매 수 / 전체 슬롯 수 (등급별: premium/plus_up/plus/rookie)
  - 등급별 매출 추이 -- `ad_priority_purchases.price_paid`
  - 카테고리별 슬롯 점유 현황 테이블

### 5.6 퍼널/전환 분석

- 경로: `/admin/dashboard/funnel`
- 한의사 퍼널:
  - 가입 -> 인증 제출 -> 인증 승인 -> 첫 리드 생성
  - 각 단계 도달 수 및 전환율 (퍼널 차트)
  - 데이터 소스:
    - 가입: `profiles` WHERE `role = 'doctor'`
    - 인증 제출: `doctor_verifications` 존재 여부
    - 인증 승인: `doctor_verifications.status = 'approved'`
    - 첫 리드: `leads` WHERE `doctor_user_id` 기준 최초 건 존재 여부
- 업체 퍼널:
  - 가입 -> 인증 제출 -> 인증 승인 -> 첫 리드 응답
  - 각 단계 도달 수 및 전환율 (퍼널 차트)
  - 데이터 소스:
    - 가입: `profiles` WHERE `role = 'vendor'`
    - 인증 제출: `vendor_verifications` 존재 여부
    - 인증 승인: `vendor_verifications.status = 'approved'`
    - 첫 리드 응답: `leads` WHERE `vendor_id` 기준 `status NOT IN ('submitted')` 최초 건 존재 여부
- 기간 필터 적용: 해당 기간 내 가입한 코호트 기준으로 퍼널 계산

### 5.7 운영 지표

- 경로: `/admin/dashboard/operations`
- 환불 현황:
  - 미처리 환불 요청 수 -- `refund_requests.status = 'pending'`
  - 일별 환불 요청 건수 추이
  - 환불 처리율: `approved` / (`approved` + `rejected`) 비율
  - 평균 처리 시간: 요청 생성(`created_at`) -> 심사 완료(`reviewed_at`)
- 신고 현황:
  - 미처리 신고 수 -- `reports.status = 'pending'` 또는 `'reviewing'`
  - 신고 유형별 분포 (리뷰/업체/사용자)
  - 일별 신고 접수 추이
- 인증 큐 현황:
  - 미처리 한의사 인증 수 -- `doctor_verifications.status = 'pending'`
  - 미처리 업체 인증 수 -- `vendor_verifications.status = 'pending'`
  - 평균 처리 시간 (제출 -> 승인/반려)
- 정산 현황:
  - 미확인 정산 수 -- `settlements.status = 'pending'`
  - 이번 달 정산 총액

### 5.8 UI 진입점

- **경로**: `/admin/dashboard` (Overview), `/admin/dashboard/users`, `/admin/dashboard/leads`, `/admin/dashboard/revenue`, `/admin/dashboard/ads`, `/admin/dashboard/funnel`, `/admin/dashboard/operations`
- **진입점**: 관리자 사이드바(`layout.tsx`)의 최상단에 "대시보드" 메뉴 추가 (BarChart3 아이콘)
- **주요 화면**: Overview KPI 카드 + 탭 기반 상세 통계 (7개 탭)
- **레퍼런스**: 기존 `/admin/ads` 리포트 페이지(`app/src/app/api/admin/ads/reports/route.ts`)의 집계 쿼리 패턴 참조

### 5.9 API / 데이터

- 필요한 API 엔드포인트:
  - `GET /api/admin/analytics/overview` -- 대시보드 Overview KPI + 요약 차트 데이터
  - `GET /api/admin/analytics/users` -- 사용자 통계 (DAU/MAU, 가입 추이)
  - `GET /api/admin/analytics/leads` -- 리드 통계 (생성/응답률/SLA/과금)
  - `GET /api/admin/analytics/revenue` -- 매출 통계 (수익원별 집계)
  - `GET /api/admin/analytics/ads` -- 광고 성과 (배너 + 우선순위)
  - `GET /api/admin/analytics/funnel` -- 퍼널/전환 분석
  - `GET /api/admin/analytics/operations` -- 운영 지표 (환불/신고/인증큐)
- 공통 쿼리 파라미터:
  - `from` (string, ISO date) -- 시작일
  - `to` (string, ISO date) -- 종료일
  - `granularity` (enum: 'day' | 'week' | 'month') -- 집계 단위 (기본: 'day')
- 모든 엔드포인트는 기존 테이블에 대한 집계 쿼리로 구현 (신규 테이블 없음)

### 5.10 권한/보안

- 모든 `/api/admin/analytics/*` 엔드포인트는 `admin` 역할만 접근 가능
- 기존 admin guard 패턴 활용 -- `app/src/server/auth/guards.ts` 참조
- RLS: `service_role` 클라이언트로 집계 쿼리 실행 (다수 테이블 조인/집계 시 RLS 오버헤드 방지)
- 권한 변경 없음 (기존 admin 가드 재사용)

## 6. 비기능 요구사항 (NFR)

- 성능/응답성:
  - (API) p95 응답 시간 목표: 2,000ms 이하 (측정: 서버 로그, 개발자도구 기준). 집계 쿼리 특성상 단순 CRUD보다 느릴 수 있으나 2초를 초과하지 않도록 한다.
  - (목록/집계) 기본 기간은 최근 7일, 최대 기간은 365일로 상한 설정. 365일 초과 요청 시 400 에러 반환.
  - (프론트) 탭 전환 시 로딩 UX: 스켈레톤 카드 + 차트 영역 스피너
  - (데이터 규모 가정) 초기 6개월 기준 leads 약 5,000~10,000건, payments 약 500~2,000건, profiles 약 1,000~3,000건. 집계 대상 데이터는 인덱스 활용으로 충분히 빠름.
- 캐싱:
  - React Query `staleTime`: 5분 (대시보드 데이터는 실시간성이 낮으므로)
  - 서버 사이드 캐싱 불필요 (초기 데이터 규모에서는 DB 직접 쿼리로 충분)
  - 후속: 데이터 증가 시 materialized view 또는 집계 테이블 도입 검토
- 안정성/복구:
  - 집계 쿼리 실패 시 에러 카드 표시 + 재시도 버튼 (React Query 기본 retry 3회)
  - 부분 실패 허용: 개별 통계 섹션이 독립적으로 로드/실패하도록 분리
- 관측:
  - 감사 로그 불필요 (읽기 전용 대시보드)
  - 장애 분석용 로그 키: `userId`, `dateRange`, `granularity`

## 7. 엣지 케이스

- 데이터가 전혀 없는 초기 상태: "아직 데이터가 없습니다" 빈 상태 메시지 + 차트 영역 빈 상태 표시
- 기간 필터에 미래 날짜 선택: `to`가 오늘 이후인 경우 오늘까지로 자동 보정
- 기간 시작일이 종료일보다 이후: 400 에러 반환 + 프론트에서 선택 불가 처리
- DAU/MAU 계산 시 admin 계정 포함 여부: admin 계정은 제외 (운영자 활동이 지표를 왜곡하지 않도록)
- 커스텀 기간 365일 초과 요청: 400 에러 + "최대 365일까지 조회 가능합니다" 메시지
- 삭제된 업체/사용자의 과거 데이터: 정산/결제 등 금액 데이터는 ON DELETE CASCADE가 아닌 테이블이므로 정상 집계됨. leads는 `ON DELETE RESTRICT`이므로 삭제 불가.

## 8. 리스크 및 대응

| 리스크 | 영향 | 대응 |
| ------ | ---- | ---- |
| 집계 쿼리 성능 저하 (데이터 증가 시) | 대시보드 로딩 2초 초과 | 1단계: 인덱스 최적화, 2단계: materialized view 도입, 3단계: 별도 집계 테이블 |
| DAU/MAU 계산에 `auth.users.last_sign_in_at` 사용 시 정확도 | Supabase Auth 세션 갱신 방식에 따라 실제 활성과 차이 가능 | 초기에는 `last_sign_in_at` 기반으로 시작, 정확도 이슈 발생 시 별도 `user_activity_logs` 테이블 도입 검토 |
| SLA 준수율 계산에 `lead_status_history` 데이터 정합성 | 상태 이력이 누락된 과거 리드가 있을 수 있음 | `lead_status_history`가 없는 리드는 SLA 미측정으로 처리, 비율 계산에서 제외 |
| recharts 번들 크기 증가 | 관리자 페이지 초기 로딩 느려짐 | dynamic import로 차트 컴포넌트 지연 로딩 |

## 9. 롤아웃 / 백로그

1. 1차 릴리스 범위 (P8-1):
   - Overview 페이지 (KPI 카드 + 요약 차트)
   - 사용자 통계 (DAU/MAU, 가입 추이)
   - 리드 통계 (생성 추이, 응답률, SLA)
   - 매출 통계 (수익원별 집계, 추이)
   - 운영 지표 (미처리 큐 현황)

2. 후속 백로그 항목 (P8-2):
   - [ ] 광고 성과 상세 (기존 `/admin/ads` 리포트를 대시보드로 통합)
   - [ ] 퍼널/전환 분석 (코호트 기반 퍼널 계산은 쿼리 복잡도 높음)
   - [ ] 비딩 통계 (프로젝트 생성/입찰/선정 추이)
   - [ ] CSV/PDF 리포트 다운로드
   - [ ] 대시보드 커스터마이징 (위젯 순서 변경, 즐겨찾기 지표)
   - [ ] 임계값 기반 자동 알림 (매출 급감, SLA 위반율 급증 시 알림)
   - [ ] materialized view 기반 성능 최적화

## 10. 오픈 이슈 / 결정 필요

- [ ] (선택) DAU/MAU 측정 기준: `auth.users.last_sign_in_at` vs 별도 활동 로그 테이블. 초기에는 `last_sign_in_at`으로 시작하되, 정확도 이슈 시 마이그레이션 필요.
- [ ] (선택) 광고 매출 일할 계산 방식: 월 정액 배너의 일별 매출 배분을 `monthly_price / 해당월 일수`로 할지, 단순히 캠페인 시작일에 전액 인식할지 결정 필요.
- [ ] (선택) 퍼널 분석 코호트 기준: "가입일 기준 코호트"만 지원할지, "주간/월간 코호트 비교"까지 지원할지. 1차에서는 단순 누적 퍼널만 구현하는 것을 권장.
- [ ] (선택) 관리자 대시보드 접근 시 기본 랜딩 변경: `/admin` 진입 시 `/admin/dashboard`로 변경할지, 기존 `/admin/verifications`를 유지하고 사이드바에 대시보드 메뉴만 추가할지. 대시보드로 변경하는 것을 권장.
