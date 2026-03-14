# Medihub(가칭) 구현 TODO

목표: `app/doc/business.md`의 “의료계의 크몽”을 `app/doc/test.csv`의 기능 목록(MVP 포함) 형태로 구현한다.

## 구현 원칙(고정)
- Frontend는 **Supabase(DB) 직접 호출 금지**. 모든 데이터 통신은 `src/app/api/**/route.ts`(BFF) + React Query로 통일.
- 예외: Auth(`supabase.auth.*`)는 허용. Storage는 “서버 Signed URL 발급 → 클라 업/다운로드”만 허용.
- 스키마 변경은 Supabase CLI 마이그레이션으로 관리: `app/supabase/migrations`.
- DB 명령은 pnpm 스크립트로 통일: `pnpm db:*` (Supabase CLI 래퍼).

## 운영 메모 (Vercel Cron)
- [x] 2026-03-01 기준 Hobby(무료) 임시 설정 적용:
  - [x] 파일: `app/vercel.json`
  - [x] 경로: `/api/cron/lead-no-response`
  - [x] 스케줄: `0 0 * * *` (UTC 기준 하루 1회)
- [ ] 프로모션/트래픽 증가로 Pro 전환 시 복구 체크리스트:
  - [ ] `app/vercel.json` 스케줄을 `0 */1 * * *`로 복구 (매시간)
  - [ ] Vercel 재배포 후 Cron validation 에러 없는지 확인
  - [ ] 실행 결과 모니터링: `/api/cron/lead-no-response` 응답(`warned`, `refunded`) 확인
  - [ ] Pro 전환 전까지는 하루 1회 스케줄 유지 (Hobby 제한)

## 통합 메모 (main 포트)
- [x] 2026-03-02: 누락 기능 main 기준 포트 통합 완료
  - [x] 감사로그 조회 (`pr-7/audit-change`)
  - [x] 헬프데스크 (`feature/help-desk`)
  - [x] 회귀/버그 수정
    - [x] FAQ 링크 경로 수정 (`/help/faq/[id]`)
    - [x] 관리자 티켓 검색 정합성 수정 (제목/내용/사용자명/이메일)
    - [x] `audit_logs` INSERT 정책 하드닝 + 서버 `service_role` 기록 경로 보강
    - [x] support 관련 타입 정합성 보강 (`database.types.ts`, `confirmModalStore`)

---

## 0) 킥오프(가장 먼저)
- [x] `app/doc/domains/` 문서 루트 생성 + PRD 초안 작성
  - [x] [`domains/auth/prd.md`](domains/auth/prd.md) (가입/로그인/권한/세션)
  - [x] [`domains/profile-verification/prd.md`](domains/profile-verification/prd.md) (한의사/업체 인증 + 승인/반려)
  - [x] [`domains/category-search/prd.md`](domains/category-search/prd.md) (카테고리 트리 + 검색/필터/정렬)
  - [x] [`domains/vendor/prd.md`](domains/vendor/prd.md) (업체 프로필/포트폴리오/가격/지역/배지)
  - [x] [`domains/lead/prd.md`](domains/lead/prd.md) (문의 생성/상태/견적/대화/첨부)
  - [x] [`domains/review/prd.md`](domains/review/prd.md) (리뷰 작성/조회)
  - [x] [`domains/admin-mvp/prd.md`](domains/admin-mvp/prd.md) (승인 큐/사용자·업체 관리/카테고리 CRUD)
- [ ] MVP 범위 확정(이번 사이드프로젝트 1차 릴리즈)
  - [ ] 포함: 회원가입/로그인(기본), 업체 리스트/상세, 문의(리드) 생성/관리, 승인/반려(관리자), 찜, 리뷰(작성/조회)
  - [ ] 제외(P1+): 소셜 로그인, 휴대폰 본인인증, 알림/메시징, 광고/과금/정산(TossPayments), 통계/리포트, 고객지원, 외부 연동(GA4/지도/쇼핑몰), “임상 케이스 DB”
  - [ ] P1~P4 개발 순서는 문서 하단 “Post-MVP Roadmap” 기준으로 진행

## 1) 개발환경/도구(Supabase + pnpm)
- [x] Supabase 개발 전략: 로컬(개발) + 원격(스테이징/운영)
  - [x] 로컬 실행: `pnpm db:start` / 상태 확인: `pnpm db:status` / 중지: `pnpm db:stop`
  - [x] 작업 재개(내일 이어서): `pnpm db:start` → `pnpm dev`
  - [x] 작업 종료: `pnpm db:stop`
  - [ ] 원격 프로젝트 연결: `pnpm exec supabase login` → `pnpm exec supabase link`
- [x] 환경변수 템플릿 정리: `app/.env.example` + `app/.env.local`(로컬 키)
  - [x] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [x] `SUPABASE_SERVICE_ROLE_KEY`(서버 전용)
  - [ ] `SUPABASE_PROJECT_ID` (원격 `pnpm db:gen`용)
  - [x] `SUPABASE_SCHEMA`(기본 `public`)
- [x] DB 스크립트(`pnpm db:*`) 추가
  - [x] `pnpm db:new -- "<name>"`
  - [x] `pnpm db:migrate` (원격: `supabase db push`, link 필요)
  - [x] `pnpm db:reset` (로컬)
  - [x] `pnpm db:gen` (로컬: `-- --local`, 원격: `SUPABASE_PROJECT_ID`)

## 2) 데이터 모델(Supabase) — P0 스키마부터
- [x] P0 스키마 마이그레이션 작성/적용: `app/supabase/migrations/20251218190000_p0_schema.sql`
- [x] 타입 생성(로컬): `pnpm db:gen -- --local` → `src/lib/database.types.ts`

### 2-1. 공통(권한/감사/파일)
- [x] Role 설계: `admin / doctor / vendor` (+ guest는 `anon`)
- [x] 공통 프로필 테이블: `profiles`
- [x] 파일 메타데이터 테이블: `files`
  - [x] 용도(purpose): `doctor_license`, `vendor_business_license`, `portfolio`, `lead_attachment`, `avatar`
  - [ ] Storage bucket 분리 + Signed URL 기반 업/다운(API 단계에서 구현)
- [x] 감사 로그(최소) 테이블: `audit_logs` — 어드민 승인/반려/제재 기록

### 2-2. 회원/인증(검수)
`test.csv`의 “한의사 회원 인증 / 업체 회원 인증 / 승인·반려 알림”을 구현하기 위한 최소 스키마.
- [x] 한의사 인증 테이블: `doctor_verifications`
  - [x] 상태: `pending/approved/rejected`
  - [x] 면허번호/성명/생년월일/병원명/면허증 파일 참조
- [x] 업체 인증 테이블: `vendor_verifications`
  - [x] 상태: `pending/approved/rejected`
  - [x] 사업자등록증/담당자/연락처/파일 참조 (카테고리/지역/가격은 `vendors`/`vendor_categories`로 분리)

### 2-3. 카테고리/검색
- [x] 카테고리 트리(대/중/소) 테이블: `categories`
  - [x] `parent_id` 기반 트리 + 정렬/가중치(추천용 파라미터는 후순위)
- [x] 초기 카테고리 시드(원외탕전/의료기기/인테리어/간판/전자차트/마케팅/세무·노무/홈페이지 등)

### 2-4. 업체(프로필/리스트/상세)
- [x] 업체 프로필: `vendors`
- [x] 업체 제공 서비스/카테고리 연결: `vendor_categories`
- [x] 가격/지역 범위(필터용) 컬럼: `vendors.price_min/price_max`, `region_primary/region_secondary`
- [x] 포트폴리오: `vendor_portfolios`, `vendor_portfolio_assets`
- [ ] 배지/라벨(후순위로 시작하되 확장 가능하게)

### 2-5. 리드/문의(핵심)
`test.csv`의 “리드 생성 / 리드 박스(한의사) / 리드 박스(업체) / 상태 자동화 / 첨부” 구현 범위.
- [x] 리드(문의) 테이블: `leads`
  - [x] 생성자(doctor), 수신자(vendor), 서비스명/연락처/선호 채널/문의내용
  - [x] 상태 enum: `public.lead_status`
- [x] 리드 상태 이력: `lead_status_history` — 나중에 SLA/통계에 필요
- [ ] 리드 메시지 스레드(후순위 가능): `lead_messages`
- [x] 리드 첨부: `lead_attachments`

### 2-6. 리뷰/평점/찜/최근본
- [x] 리뷰: `reviews` + 별점 집계(트리거로 `vendors.rating_avg/review_count` 갱신)
- [x] 찜: `favorites`
- [x] 최근 본 항목(후순위): `recent_views`

### 2-7. RLS(필수)
- [x] 모든 테이블 RLS ON
- [x] doctor는 자기 리드/리뷰/찜만 접근 (+ 승인 전 write 제한)
- [x] vendor는 자기 업체/리드만 접근 (+ 승인 전 public 노출/수신 제한)
- [x] admin은 승인/제재/운영 데이터 접근
- [x] 기본은 **유저 컨텍스트로 호출**(RLS 적용) 원칙 유지

## 3) API(BFF) — Next.js API Route 설계
### 3-1. 공통
- [x] 공통 응답/에러 포맷 확정(프론트 에러 중앙화와 호환)
- [x] 인증/권한 가드(roles) 헬퍼 구현
- [x] 입력 검증(Zod) 패턴 확정(`src/lib/schema` 신설)

### 3-2. 엔드포인트(우선순위)
- [x] Auth/Me:
  - [x] `GET /api/me`
  - [x] `POST /api/profile` (signup 직후 role/profile 생성)
  - [x] `PATCH /api/profile` (내 프로필 수정)
- [x] Verification:
  - [x] `GET /api/doctor/verification` / `POST /api/doctor/verification`
  - [x] `GET /api/vendor/verification` / `POST /api/vendor/verification`
- [x] Category: `GET /api/categories`
- [x] Vendor:
  - [x] `GET /api/vendors` (리스트 + 필터/정렬)
  - [x] `GET /api/vendors/:id` (상세)
  - [x] `GET /api/vendors/me`
  - [x] `POST /api/vendors/me` / `PATCH /api/vendors/me` (업체 프로필 편집)
  - [x] `POST /api/vendors/me/portfolio`
  - [x] `DELETE /api/vendors/me/portfolio/:id`
- [ ] Lead:
  - [x] `POST /api/leads` (문의 생성)
  - [x] `GET /api/leads` (역할별 목록)
  - [x] `GET /api/leads/:id` (상세)
  - [x] `PATCH /api/leads/:id/status`
  - [ ] (후순위) `POST /api/leads/:id/messages`
- [x] Review/Favorite:
  - [x] `POST /api/favorites/toggle`
  - [x] `GET /api/favorites`
  - [x] `POST /api/reviews`
  - [x] `GET /api/vendors/:id/reviews`
- [x] Admin(MVP):
  - [x] `GET /api/admin/verifications` (승인 큐)
  - [x] `POST /api/admin/verifications/:id/approve`
  - [x] `POST /api/admin/verifications/:id/reject`
  - [x] `GET /api/admin/users`
  - [x] `GET /api/admin/vendors`
  - [x] `POST /api/admin/categories`
  - [x] `PATCH /api/admin/categories/:id`
  - [x] `DELETE /api/admin/categories/:id`
- [x] File:
  - [x] `POST /api/files/signed-upload`
  - [x] `GET /api/files/signed-download`

## 4) 프론트엔드(UI) — MVP 화면부터
### 4-1. 공통 레이아웃/내비게이션
- [x] 헤더/검색창/카테고리 진입 동선
- [x] 역할별 가드(guest/doctor/vendor/admin)

### 4-2. 회원가입/로그인(MVP)
- [x] 일반 회원가입(이메일/비번) + 한의사 프로필 입력 + 면허증 업로드(검수 대기)
- [x] 사업자 회원가입(이메일/비번) + 업체 기본정보/담당자 + 사업자등록증 업로드(검수 대기)
- [x] 로그인/로그아웃
- [ ] 계정찾기(후순위)
- [ ] 휴대폰 본인인증/소셜 로그인(후순위)

### 4-3. 검색/리스트/상세(MVP)
- [x] 카테고리 트리 UI
- [x] 키워드 검색(업체명/소개/태그 등)
- [x] 업체 리스트(카드) + 필터(가격/평점/배지) + 정렬(최신/응답순 등은 데이터 준비 후)
- [x] 업체 상세(포트폴리오/가격/FAQ/리뷰)
- [x] 찜/공유(공유는 후순위 가능)

### 4-4. 리드/문의(MVP)
- [x] 문의 생성 폼(필수 입력 + 첨부)
- [x] 한의사 "내 문의함"(상태/메모/첨부/취소)
- [x] 업체 "받은 리드함"(상태 관리/견적/응답)
- [ ] 상태 자동화/SLA 알림(후순위)

### 4-5. 마이페이지/파트너센터(MVP)
- [x] 한의사: 프로필 수정(아바타 포함)/찜 리스트/리뷰 작성/조회/수정/삭제/사진/비공개 전환
  - 리뷰 사진 업로드: `/api/files/signed-upload`에 `purpose=review_photo`로 업로드 → 반환된 `file.id`들을 리뷰 API의 `photoFileIds: string[]`로 전달
- [x] 업체: 업체 프로필 관리/포트폴리오 관리/리드 대응

### 4-6. 관리자 페이지(MVP)
- [x] 인증 승인/반려 큐(한의사/업체)
- [x] 사용자/업체 목록(최소 필터/검색)
- [x] 카테고리 CRUD

---

## Post-MVP Roadmap (P1 → P4)

## 5) P1 — 계정/신뢰/전환 개선
목표: “가입 → 인증 → 첫 리드/응답” 전환을 높이고, 운영 신뢰(약관/알림/리뷰/스팸 대응)를 최소 단위로 갖춘다.

### 5-1. 계정 복구(비밀번호 재설정) — 로그인 ID는 이메일 고정
- [ ] 공통(Supabase/Resend/운영)
  - [x] 정책: 로그인 ID는 `email`로 고정(아이디 찾기 기능은 제공하지 않음)
  - [x] Supabase Auth: Password Recovery Redirect URL에 `/auth/update-password` 등록(로컬/운영)
  - [x] Supabase Auth: SMTP를 Resend로 설정(Confirm email/Reset email 템플릿 포함) - https://supabase.com/dashboard/project/qhyzwhblglxodbcbkgem/auth/templates
  - [x] Resend: `RESEND_FROM_EMAIL` 도메인 인증(DKIM/SPF) + 발신자 고정
  - [ ] 이메일 분실(예외 처리): 카카오채널/채널톡 오픈 + 운영 처리 룰(응답 시간/필수 확인 정보)만 정리 (**P1에서는 개발 X**)
  - [ ] (P2+ 검토) OTP/PASS(휴대폰 본인인증) — **P1에서는 구현하지 않음**
    - 이유: 인프라/비용/장애 대응 등 운영 부담이 커서 “지금” 핵심 가치(리드/전환) 대비 효율이 낮음
    - 도입 조건: 계정 복구/분실 문의가 운영 병목 / 휴대폰 로그인·2FA 필요 / 스팸·어뷰징 억제에 강한 신원확인이 필요할 때
- [x] Backend (API/DB)
  - [x] 엔드포인트: 없음(비밀번호 재설정은 Supabase Auth(`supabase.auth.*`)로 처리)
- [x] Frontend (UI)
  - [x] `/auth/reset-password`(요청) 페이지
  - [x] `/auth/update-password`(변경) 페이지 + redirect 처리
  - [x] 보안 UX: 가입 여부를 노출하지 않는 동일 문구/응답 + (필요 시) 스텝업 캡차
  - [x] 이메일 분실: "계정 복구 문의" 링크(카카오채널/채널톡) 노출
- [x] 완료 기준(AC): 비로그인 사용자가 안전하게 비번 재설정을 수행 가능

### 5-2. 소셜 로그인(카카오/구글)
- [ ] 공통(Supabase/Kakao/Google)
  - [x] Supabase Auth Provider 설정: Kakao/Google OAuth(redirect URL, scopes, local/production 도메인)
  - [ ] Supabase Auth: Manual linking(계정 연결) 허용(로컬/운영)
    - [x] 로컬: `app/supabase/config.toml`에서 `enable_manual_linking=true`
    - [ ] 운영: Supabase Dashboard(Auth 설정)에서 manual linking 활성화
  - [x] Kakao: 비즈 앱 전환 + 이메일 수집(동의항목) 설정(비즈 앱 전환 전에는 이메일 미수집 가능)
  - [x] Google: OAuth 동의 화면/credentials 설정 + redirect URI(로컬/운영)
  - [x] 키/시크릿 정리: Kakao REST API 키, Google Client ID/Secret, Redirect URI(로컬/운영) 문서화 + .env.local 보관
  - [ ] 계정 연결 정책 확정: 동일 이메일 기존 계정과의 연동/중복 처리(가이드 문구 포함)
    - [ ] 정책(권장): 자동 병합 없음 → 기존 계정 로그인 후 “소셜 계정 연결”로만 연결 허용
    - [ ] P1 범위: 연결(add)만 제공, 해제(unlink)는 P2+로 이관(락아웃 방지/보안 정책 필요)
- [x] Backend (API/DB)
  - [x] 기존 엔드포인트: `GET /api/me` (`onboardingRequired` 분기), `POST /api/profile` (소셜 첫 로그인 후 프로필 생성)
  - [x] 추가 API/DB 작업 없음: 계정 연결은 Supabase Auth(`linkIdentity`) + `/auth/callback`에서 세션 교환으로 처리
- [x] Frontend (UI)
  - [x] 로그인/가입 화면에 소셜 버튼 추가(카카오/구글)
  - [x] OAuth 콜백 라우트: `/auth/callback` (통합 콜백, code 교환 → 세션 저장 → 리다이렉트)
    - [x] 로그인과 "계정 연결"을 같은 콜백에서 처리(redirectTo/returnUrl/next 파라미터로 복귀 위치 제어)
  - [x] 계정 설정(마이페이지 등)에 "소셜 계정 연결" UI 추가(연결 상태 표시 + Kakao/Google 연결 버튼)
    - [x] 연결 플로우: 로그인된 상태에서 `supabase.auth.linkIdentity({ provider })` 호출 → 콜백 복귀 후 완료 처리
    - [x] 동일 이메일 충돌 UX: 로그인/가입 화면에서 오류 안내 + "기존 계정 로그인 → 계정 설정에서 연결" 가이드 제공
  - [x] 최초 로그인 온보딩: `GET /api/me`에서 `onboardingRequired=true`면 역할 선택 → `POST /api/profile`
- [ ] 완료 기준(AC): 소셜 로그인/연결 후 역할 기반 가드/세션이 기존 이메일 로그인과 동일하게 동작

### 5-3. 알림(이메일 1st) — 승인/반려 알림 + 설정
- [ ] 공통(Resend/Vercel)
  - [x] 정책: 알림 채널 1순위는 이메일(카카오/문자/인앱은 P2+)
  - [x] 이메일 발송 인프라: Resend (Vercel 배포 기준)
  - [ ] Resend: 도메인 인증(DKIM/SPF) + 발신자 고정(`RESEND_FROM_EMAIL`)
  - [x] 환경변수: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (Vercel/운영 환경 설정)
- [x] Backend (API/DB)
  - [x] 원칙: 이메일 발송은 서버(API)에서만 수행(클라에서 Resend 직접 호출 금지)
  - [x] 이메일 발송 유틸/서비스: Resend API 호출 모듈 + 템플릿(한의사/업체 승인/반려)
  - [x] DB: 사용자 알림 설정 최소 스키마
    - [x] `notification_settings`(user_id, email on/off, 알림 종류 on/off)
    - [x] (선택) `notification_deliveries`(type, channel, provider_response, sent_at, failed_at)
  - [x] 엔드포인트: `GET /api/notification-settings`, `PATCH /api/notification-settings`
  - [x] 엔드포인트(수정): `POST /api/admin/verifications/:id/approve`, `POST /api/admin/verifications/:id/reject`에서 이메일 발송 + 실패 로깅
  - [x] api-client: 컴포넌트에서 직접 api.get/api.patch 호출로 처리
- [x] Frontend (UI)
  - [x] 알림 설정 UI: 마이페이지에서 알림 종류 on/off(최소: 인증 결과, 리드 관련, 마케팅)
- [ ] 완료 기준(AC): 승인/반려 시 이메일이 발송되고, 설정에 따라 발송 여부가 제어됨 (Resend 도메인 인증 후 테스트 필요)

### 5-4. 온보딩(역할별) + 프로필 완성도
- [x] 공통(정책/설계)
  - [x] 온보딩 퍼널 정의: doctor(인증 제출 → 업체 탐색/찜 → 첫 문의) / vendor(프로필/포트폴리오 → 인증 제출 → 리드 응답)
  - [x] 프로필 완성도 규칙 정의(역할별 체크리스트)
- [x] Backend (API/DB)
  - [x] 기존: `GET /api/me`에 `onboardingRequired` 존재(프로필 생성 필요 여부)
  - [x] 온보딩 상태 저장 방식 결정: `profiles` 컬럼(jsonb) vs `user_onboarding_steps` 테이블
  - [x] 완성도 계산/저장 방식 결정(저장 vs 런타임 계산)
  - [x] (택1) 엔드포인트 설계
    - [x] `GET /api/me` 확장으로 체크리스트/완성도 포함 또는
    - [x] `GET /api/onboarding`, `PATCH /api/onboarding` 신설
  - [x] api-client: 온보딩 조회/저장 함수 추가
- [x] Frontend (UI)
  - [x] 역할별 첫 방문 가이드(퍼널) UI
  - [x] 프로필 완성도 UI(배너/체크리스트)
- [x] 완료 기준(AC): 신규 유저가 다음 행동(인증/프로필/첫 리드)에 도달하는 길이 명확해짐

### 5-5. 약관/동의(버전 관리 + 이력 저장 + 철회)
- [x] 공통(정책/문서)
  - [x] (MVP) 이용약관/개인정보처리방침은 정적 페이지(HTML/MD)로 제공하고, 푸터에 링크만 노출
  - [x] (MVP) 필수 동의 저장 최소화: `profiles`에 "동의 시각 + 문서 버전(예: `YYYY-MM-DD`)"만 저장
  - [x] (MVP) 마케팅 수신동의는 선택으로 두고, 실제 마케팅 발송 시작할 때 `opt_in_at`/`opt_out_at`만 관리
  - [x] 문서 버전 규칙 확정: `YYYY-MM-DD` (문서 변경 시 버전 bump) → `CURRENT_TERMS_VERSION/CURRENT_PRIVACY_VERSION = "2026-01-18"`
- [x] Backend (API/DB)
  - [x] DB(필수 동의 최소): `profiles.terms_agreed_version`, `profiles.terms_agreed_at`, `profiles.privacy_agreed_version`, `profiles.privacy_agreed_at`
  - [x] DB(선택 동의): `notification_settings.marketing_enabled` + `profiles.marketing_opt_in_at`/`profiles.marketing_opt_out_at`
  - [x] DTO/Mapper: `MeDataSchema`에 `requiredConsents` 포함
  - [x] 엔드포인트(수정): `POST /api/profile`에서 필수 동의(버전/시각) 저장(약관/개인정보 동시)
  - [x] 엔드포인트(추가/택1): 마케팅 수신 동의 토글/철회
    - [x] 기존 `PATCH /api/notification-settings`로 처리 + opt-in/out 시각 기록
  - [x] api-client: 기존 notification-settings API 활용
  - [ ] (P2+ 필요 시) 동의 이력 고도화(append-only + 철회 이력)
    - [ ] 약관 모델 설계: 이용약관/개인정보/광고성 수신(필수/선택, 버전, 시행일)
    - [ ] DB: `terms_versions`, `user_consents`(append-only, 철회 시 `revoked_at` 기록)
- [x] Frontend (UI)
  - [x] 정적 문서 페이지 작성: 이용약관(`/legal/terms`)/개인정보처리방침(`/legal/privacy`)
  - [x] 푸터 링크 추가: 이용약관/개인정보처리방침 (MainLayout, AuthLayout)
  - [x] 가입/최초 로그인 동의 UI: 필수(이용약관/개인정보) 체크박스 + 선택(마케팅 수신 동의)
  - [x] 가입/최초 로그인 시 약관 동의 플로우(필수 미동의 시 가입/온보딩 버튼 비활성화 + 로그인 후 미동의/버전 상이 시 모달로 사용 제한)
  - [x] 마이페이지: 약관 링크 (알림 설정 페이지 하단에 추가)
  - [ ] (P2+ 필요 시) 마이페이지: 동의 이력 노출 + 광고성 수신 철회 이력
- [x] 완료 기준(AC): 약관은 푸터 링크로 접근 가능, 필수 동의는 버전+시각이 저장됨(마케팅은 선택/철회 가능)

### 5-6. SEO 기본(카테고리/업체 메타 + OG 템플릿)
- [x] Backend (API/DB)
  - [x] 없음(API/DB 작업 없음)
- [x] Frontend (UI/SEO)
  - [x] 카테고리/업체 페이지 `generateMetadata` 정리(title/description/canonical/OG)
  - [x] OG 템플릿: 기본 OG 이미지 + (선택) 동적 OG 이미지 라우트
  - [x] sitemap/robots: 최소 `sitemap.xml`, `robots.txt` 제공
- [x] 완료 기준(AC): 공유/검색 결과에서 기본 메타/OG가 정상 노출

### 5-7. 리뷰 고도화(정렬 + 노출 정책 + 운영 대응)
- [x] 공통(정책/운영)
  - [x] 노출 정책 문서화: 정렬/블라인드/스팸 대응 기준(운영 정책) + UI 링크 문구 확정
- [x] Backend (API/DB)
  - [x] 엔드포인트(수정): `GET /api/vendors/:id/reviews`에 `sort=recent|rating_high|rating_low` 지원
  - [x] DB(선택): 리뷰 신고 저장용 `review_reports` 테이블 + RLS
  - [x] 엔드포인트(추가): `POST /api/reviews/:id/report` (신고 접수)
  - [x] 엔드포인트(추가, admin): `POST /api/admin/reviews/:id/hide`, `POST /api/admin/reviews/:id/unhide`
  - [x] 운영 이력: 신고/블라인드/복구는 `audit_logs`에 기록(사유 포함)
  - [x] api-client: 리뷰 정렬/신고/블라인드 관련 함수 추가
- [x] Frontend (UI)
  - [x] 리뷰 정렬 UI
  - [x] 노출 정책 안내: 리뷰 작성/노출 기준, 블라인드/스팸 대응 정책 페이지(링크 노출)
  - [x] 리뷰 신고 UI
- [x] 완료 기준(AC): 리뷰 정렬이 가능하고, 운영 정책이 UI에 명확히 안내됨

### 5-8. 운영 최소(Rate limit / 스팸 방지 / 오류 로그)
- [x] 공통(정책/외부 설정)
  - [x] 정책: P1에서는 "유저 기준 제한(일/시간) + 쿨다운"으로 시작
    - 참고: IP 기반/짧은 윈도우(초당/분당) + 서버리스 인스턴스 공통 적용은 공유 저장소 필요 → Redis(Upstash/Vercel KV)로 P2+ 또는 어뷰징 심해지면 도입
  - [x] (선택) Sentry 프로젝트 생성 + DSN 발급(서버/클라)
  - [x] (필요 시) 캡차 공급자 선정(예: Cloudflare Turnstile) + site/secret 키 발급
- [x] Backend (API/DB/Infra)
  - [x] 유저 기준 Rate limit(기본): 주요 엔드포인트에 일/시간 단위 제한 + 쿨다운
    - [x] 적용 대상: `POST /api/leads`, `POST /api/reviews`, `POST /api/files/signed-upload`, `POST /api/doctor/verification`, `POST /api/vendor/verification`
  - [x] 리드 스팸 방지(서버): doctor별 일/주 단위 발송 제한 + 동일 업체 반복 문의 쿨다운 + 차단 로그
  - [x] 차단/제한 로그: 차단 발생 시 `audit_logs` 또는 별도 `abuse_logs`에 기록
  - [x] 오류 로그 수집(서버): API 에러/리퀘스트 로그를 Sentry 등으로 수집(최소 설정)
  - [x] (P2+ 또는 필요 시) IP 기반 짧은 윈도우 + 서버리스 공통 레이트리밋: Upstash/Vercel KV(=Redis)로 적용
- [x] Frontend
  - [x] 캡차(조건부/스텝업): 매 요청마다 노출하지 않고 "어뷰징 징후"일 때만 노출(기본 off)
    - [x] 예) 로그인 연속 실패 N회 이후(로그인 폼 단계)
    - [x] 예) 비번 재설정 요청 과다(이메일/시간 기준, `/auth/reset-password`)
    - [x] 예) 리드 생성 과다/차단 발생 시(리드 생성 폼 단계)
  - [x] 오류 로그 수집(클라): React 에러/리퀘스트 로그를 Sentry 등으로 수집(최소 설정)
- [x] 완료 기준(AC): 리드 남발/비정상 트래픽을 1차 방어하고, 장애 원인 추적이 가능

## 6) P2 — 알림/메시징/고객지원/운영 고도화
- [x] 통합 메시징: 카카오 알림톡/이메일(SMTP) 발송 + 실패 재시도 + 로그
- [x] 리드 Q&A 스레드: 리드별 대화, 읽음 표시, 첨부, 관리자 가시성
- [ ] 리드 상태 자동화: 타임아웃/리마인드/만료 전 안내, 종료 사유 수집
- [x] 신고/제재: 신고 접수 → 임시 블라인드 → 심사 → 제재 단계 → 이력 관리
- [x] FAQ/공지: 헬프센터 문서 CRUD + 검색(로그 기반 추천은 후순위)
- [x] 고객지원(헬프데스크): 1:1 문의 티켓 + SLA + FAQ 연동
- [x] 감사 로그/변경 기록: 가입/수정/삭제/다운로드/승인, 요금/제재/환불 변경 로그

---

## Post-P2: 수익화 모델 Roadmap

> 참조: `app/doc/domains/monetization/prd.md`

### 병렬 작업 가이드 (Claude Squad)

```
Wave 1 — 동시 착수 가능 (상호 의존 없음)
├── 7-1 크레딧 시스템           (독립 도메인)
├── 7-2 TossPayments 연동      (독립 도메인)
├── 7-3 업체 가격 정책          (독립 도메인)
├── 10-1 + 10-2 광고 시스템     (완전 독립 도메인)
└── 11-2 비딩 코어              (스코어링/매칭 로직만, 결제 제외)

Wave 2 — Wave 1 완료 후 (크레딧+결제 인프라 필요)
├── 8-1 건별 리드 과금          ← 7-1 + 7-3
├── 8-2 기간제 상품             ← 7-1 + 7-2
├── 9-2 입점비 구현             ← 7-2
└── 11-2 비딩 결제 연동         ← 7-1 + 7-2

Wave 3 — Wave 2 완료 후 (거래 데이터 필요)
├── 12-1 정산                   ← 8-1 + 8-2 + 9-2
├── 12-2 환불/보상              ← 7-1 + 8-1
├── 12-3 데이터 내보내기         ← 전체
└── 13 P8 통계/대시보드          ← 전체 데이터
```

## 7) P3 — 수익화 기반 (결제/크레딧)

### 7-1. 크레딧 시스템 `[Wave 1]`
- [x] 정책: 선불 크레딧, 12개월 유효, 자동충전 2% 보너스
- [x] DB: `credit_accounts`, `credit_transactions`, `credit_packages`
  - [x] 마이그레이션 작성: `20260228120000_credit_system.sql` (+ 보정: `20260228123000_fix_credit_balance_update.sql`)
  - [x] RLS 정책 설정 (업체별 본인 계정만 접근)
- [x] Schema: `app/src/lib/schema/credit.ts`
- [x] Server: `app/src/server/credit/{repository,service,mapper}.ts`
- [x] API:
  - [x] `GET /api/credits` - 잔액 조회
  - [x] `GET /api/credits/transactions` - 거래 내역 조회
  - [x] `POST /api/credits/charge` - 충전 준비
  - [x] `PATCH /api/credits/auto-charge` - 자동 충전 설정
- [x] UI:
  - [x] 파트너센터 헤더에 크레딧 잔액 표시
  - [x] `/partner/credits` - 크레딧 관리 페이지
  - [x] 충전 페이지 (패키지 선택 → 결제)
  - [x] 거래 내역 페이지

### 7-2. TossPayments 연동 `[Wave 1]`
- [x] 가맹점 등록 + 테스트 API 키 발급
  - [x] `TOSS_PAYMENTS_SECRET_KEY`, `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`, `TOSS_PAYMENTS_WEBHOOK_SECRET`
  - [x] 웹훅 URL 등록: `https://doctor-han.vercel.app/api/payments/webhook`
  - [ ] 운영 환경 API 키 발급 (라이브 전환 시)
- [x] DB: `payments`, `payment_webhooks`
  - [x] 마이그레이션 작성: `20260228120001_payments.sql`
- [x] Schema: `app/src/lib/schema/payment.ts`
- [x] Server: `app/src/server/payment/{repository,service}.ts`
- [ ] API:
  - [ ] `POST /api/payments/prepare` - 결제 준비 (현재 `POST /api/credits/charge`에서 충전 준비를 처리)
  - [x] `POST /api/payments/confirm` - 결제 승인
  - [x] `POST /api/payments/webhook` - 웹훅 수신
  - [x] `GET /api/payments/[id]` - 결제 상세 조회
- [x] UI:
  - [x] TossPayments 결제 위젯 통합
  - [x] 결제 완료 페이지
  - [x] 결제 실패 페이지

### 7-3. 업체 가격 정책 `[Wave 1]` ✅
- [x] DB: `vendor_service_prices`
  - [x] 마이그레이션 작성: `20260228130000_vendor_service_prices.sql`
- [x] Schema: `app/src/lib/schema/vendor-pricing.ts`
- [x] Server: `app/src/server/vendor/pricing-{mapper,repository,service}.ts`
- [x] API:
  - [x] `GET /api/vendors/me/prices` - 단가 조회
  - [x] `POST /api/vendors/me/prices` - 단가 설정
  - [x] `PATCH /api/vendors/me/prices/[id]` - 단가 수정
  - [x] `DELETE /api/vendors/me/prices/[id]` - 단가 삭제
- [x] UI:
  - [x] `/partner/pricing` - 가격 설정 페이지

## 8) P3.5 — CPL 과금 (리드 기반)

### 8-1. 건별 리드 과금 `[Wave 2 ← 7-1 + 7-3]`
- [ ] 정책 구현:
  - [x] 서비스별 단가 (1만~20만원)
  - [x] 복수 서비스 선택 시 합산
  - [x] 30일 중복 리드 무효 처리
  - [ ] 크레딧 부족 시 소프트 거절 + 충전 요청 알림
- [x] DB: `lead_charges`
  - [x] 마이그레이션 작성: `20260228140000_lead_charges.sql`
- [x] Schema: `app/src/lib/schema/lead.ts` 확장
- [x] Server 수정:
  - [x] `app/src/server/lead/repository.ts` - 크레딧 차감 로직 통합
  - [x] `app/src/server/lead/charge-service.ts` - 과금 서비스 신규
- [x] 중복 리드 체크 + 크레딧 복구 로직
- [x] 무응답 처리 (Cron):
  - [x] 48시간 무응답 → 카톡 알림 발송
  - [x] 72시간 무응답 → 자동 크레딧 복구
- [ ] 허위 리드 처리:
  - [ ] 자동 필터링 (전화번호 형식 오류, 테스트성 문자열, 욕설)
  - [x] 업체 신고 → 관리자 심사 → 크레딧 복구
- [ ] 알림 추가:
  - [x] `lead_charged` - 리드 과금 완료
  - [ ] `lead_refunded` - 리드 환불 완료
  - [ ] `credit_low` - 잔액 부족
  - [x] `lead_no_response_warning` - 48시간 무응답 경고
  - [ ] TODO: 과금 상태별 알림 타입 분기(`lead_charged`/`credit_low`/`lead_refunded`) 정합성 개선
- [x] 보강 작업:
  - [x] 서버 검증: 요청 `categoryIds`가 업체 등록 + 단가 설정 카테고리인지 검증
  - [x] Admin 신고 목록 API: query 파라미터 Zod 파싱 적용

### 8-2. 기간제 상품 `[Wave 2 ← 7-1 + 7-2]`
- [x] 정책: 30/60/90/180/365일 무제한
- [x] DB: `vendor_subscriptions`
  - [x] 마이그레이션 작성: `20260228150000_subscriptions.sql` (+ `20260301100000_subscription_policy_and_purchase_rpc.sql`)
- [x] Schema: `app/src/lib/schema/subscription.ts`
- [x] Server: `app/src/server/subscription/{repository,service}.ts`
- [x] API:
  - [x] `GET /api/vendors/me/subscriptions` - 구독 목록
  - [x] `POST /api/vendors/me/subscriptions` - 구독 구매/연장
  - [x] `GET /api/vendors/me/subscriptions/[id]` - 구독 상세
- [x] 구독 중 해당 카테고리 리드 무료 처리 로직 (8-1 연동 포인트: `hasActiveSubscription`)
- [x] 만료 7일/1일 전 알림 (Cron)
- [x] UI:
  - [x] `/partner/subscriptions` - 구독 관리 페이지
  - [x] 구독 구매 페이지

## 9) P4 — 입점비/연회비 (S등급)

> 사업계획서 수익모델 (1) — S등급 업종 연 200만원, 1년차 예상 1.77억

### 9-1. 입점비 정책
- [x] 대상: S등급 업종만 (원외탕전(한약) 120개, 원외탕전(약침) 25개, 약재회사/제약사 150개 = 총 295개)
- [x] 금액: 연 200만원 (초기 할인 프로모션 검토)
- [x] 미납 업체: 무료 기본 입점 가능, 단 노출 제한 & 리드 연결 불가
- [x] 납부 시 풀 기능 개방

### 9-2. 입점비 구현 `[Wave 2 ← 7-2]`
- [x] DB: `vendor_memberships` (업체별 입점 등급, 연회비 상태, 유효기간, 결제 이력)
  - [x] 마이그레이션 작성: `20260302000001_vendor_memberships.sql`
- [x] Schema: `app/src/lib/schema/vendor-membership.ts`
- [x] Server: `app/src/server/vendor/membership-{repository,service}.ts`
- [x] 노출 제한 로직: 미납 S등급 업체 → 검색 결과 하위 노출 + 리드 수신 차단
- [x] API:
  - [x] `GET /api/vendors/me/membership` - 입점 상태 조회
  - [x] `POST /api/vendors/me/membership` - 연회비 결제 (크레딧 차감, 충전은 TossPayments)
  - [x] `GET /api/admin/memberships` - 관리자 연회비 관리
  - [x] `PATCH /api/admin/memberships/[id]` - 상태 변경 (해지)
- [x] UI:
  - [x] 업체 파트너센터: 입점 상태 표시 + 연회비 결제
  - [x] 관리자: 연회비 납부 현황 + 업체별 상태 관리
- [x] 만료 알림 (30일/7일 전) — Cron

## 10) P5 — 광고 시스템 (배너 + 우선순위노출)

> 사업계획서 수익모델 (3) 배너광고 + (4) 우선순위노출 광고
> 1년차 예상: 배너 2.02억 + 우선순위 8,064만 = 약 2.83억

### 10-1. 배너광고 `[Wave 1]`
- [x] 정책:
  - [x] 메인 배너 3개 (200만/월), 서브 배너 2개 (120만/월)
  - [x] 랜덤 회전형 독점 슬롯 (2배수: 메인 6개, 서브 4개 광고주)
  - [x] 초기 정액형(CPM) → 추후 혼합형(CPC) 전환
  - [x] 카테고리별 차등 광고비 (추후)
- [x] DB: `ad_slots`, `ad_campaigns`, `ad_creatives`
  - [x] 마이그레이션 작성: `20260228140000_ad_system.sql`
- [x] Schema: `app/src/lib/schema/ad.ts`
- [x] Server: `app/src/server/ad/{repository,service}.ts`
- [x] API:
  - [x] `GET /api/ads/banners` - 배너 노출 (위치별 로테이션)
  - [x] `POST /api/ads/banners/[id]/click` - 클릭 트래킹
  - [x] `GET /api/admin/ads/campaigns` - 캠페인 목록
  - [x] `POST /api/admin/ads/campaigns` - 캠페인 생성
  - [x] `PATCH /api/admin/ads/campaigns/[id]` - 캠페인 수정
  - [x] `GET /api/admin/ads/reports` - 성과 리포트 (노출/클릭/CTR)
- [x] UI:
  - [x] 메인/서브 배너 컴포넌트 (로테이션 + 클릭 트래킹)
  - [x] 관리자: 캠페인 CRUD + 성과 리포트

### 10-2. 우선순위노출 광고 `[Wave 1, 10-1과 함께]`
- [x] 정책:
  - [x] 4단계: 프리미엄(30만/주) / 플러스업(21만/주) / 플러스(6만/주) / 루키(3만/주)
  - [x] 카테고리당 4줄 x 4개 = 16슬롯
  - [x] 주단위 상품
  - [x] 루키: 기간 내 3회 점프업 (1일 1회, 30분씩 프리미엄 위 노출)
- [x] DB: `ad_priority_slots`, `ad_priority_purchases`
  - [x] 마이그레이션: `20260228140000_ad_system.sql`, `20260301100000_ad_priority_purchase_atomic.sql`
- [x] Server: `app/src/server/ad/priority-{repository,service}.ts`
- [x] API:
  - [x] `GET /api/ads/priority?category=[id]` - 카테고리별 우선순위 노출 목록
  - [x] `POST /api/ads/priority/purchase` - 슬롯 구매
  - [x] `POST /api/ads/priority/[id]/jumpup` - 루키 점프업
  - [x] `GET /api/vendors/me/ads` - 내 광고 현황
- [x] UI:
  - [x] 카테고리 페이지: 상위 4줄 광고 영역 (등급별 배경/배지 구분)
  - [x] 업체 파트너센터: 광고 구매 + 현황 관리
  - [x] 관리자: 슬롯 현황 + 매출 리포트

## 11) P6 — 비딩

### 11-1. CPA (회원가입형) — 현 단계 보류, 트래픽 확보 후 도입
> 모델: 업체 쇼핑몰에 회원 1명 유치 시 건당 10만원 과금 (웹훅 트래킹)
> 대상: 원외탕전, 유통쇼핑몰, 한약재 유통몰 (자체 쇼핑몰 보유 업종)
> 보류 사유: 초기 플랫폼이라 업체에 트래킹 연동 요구할 협상력 없음.
> 도입 조건: 트래픽 충분히 쌓인 후 업체에 웹훅 연동 요구 가능한 시점.
> (결정일: 26.02.07)

### 11-2. 비딩 시스템 (인테리어) `[Wave 1: 코어 | Wave 2: 결제 연동 ← 7-1 + 7-2]`
- [x] 정책: 자동 매칭 + 파운더 겸임 (전담 매니저 없음), 수수료 3%, 추천업체 3개
- [x] DB: `bid_projects`, `bid_responses`, `bid_contracts`
  - [x] 마이그레이션 작성: `20260302120000_bidding.sql`
- [x] Schema: `app/src/lib/schema/bidding.ts`
- [x] Server: `app/src/server/bidding/{repository,service}.ts`
- [x] 자동 스코어링 매칭 (지역30%/평점25%/응답률20%/포트폴리오15%/가격10%)
- [x] API:
  - [x] `POST /api/bid/projects` - 프로젝트 등록 (의사)
  - [x] `GET /api/bid/projects` - 프로젝트 목록
  - [x] `GET /api/bid/projects/[id]` - 프로젝트 상세
  - [x] `POST /api/bid/projects/[id]/responses` - 입찰 제출 (업체)
  - [x] `PATCH /api/bid/projects/[id]/select` - 업체 선정 (의사)
- [x] UI:
  - [x] `/interior` - 인테리어 프로젝트 등록 (의사)
  - [x] `/partner/bids` - 입찰 관리 (업체)
  - [x] `/admin/bid-projects` - 프로젝트 현황 (분쟁/상담 대응용)

### ~~11-3. 쇼핑몰~~ — 현 단계 제외
> 최소 구현도 DB 8~10개, API 20개+, 화면 15개+로 별도 프로덕트 규모.
> 플랫폼 안정 운영 후 별도 프로젝트로 검토. (결정일: 26.02.07)

## 12) P7 — 정산/환불/리포트..

### 12-1. 정산 관리 `[Wave 3 ← 8-1 + 8-2 + 9-2]`
- [x] DB: `settlements`, `settlement_items`
  - [x] 마이그레이션 작성: `20260302140000_settlements.sql`, `20260302153000_settlement_atomic_rpc.sql`
- [x] Schema: `app/src/lib/schema/settlement.ts`
- [x] Server: `app/src/server/settlement/{repository,service}.ts`
- [x] 월별 정산 자동 생성 (Cron)
- [x] API:
  - [x] `GET /api/admin/settlements` - 정산 목록
  - [x] `GET /api/admin/settlements/[id]` - 정산 상세
  - [x] `POST /api/admin/settlements/[id]/approve` - 정산 승인
  - [x] `POST /api/admin/settlements/[id]/payout` - 지급 처리
- [x] UI:
  - [x] `/admin/settlements` - 정산 관리 페이지

----
결론부터: 업체별 정산이 맞아요. 초기 6개월이라 "합산이 간단하니까"라는 유혹이 있겠지만, 운영 현실을 보면 업체별이 오히려 덜 고생합니다.
왜 플랫폼 합산이 문제인지:
첫째, 정산 분쟁이 생기면 어차피 업체별로 쪼개야 합니다. 업체 A가 "이 리드는 중복인데 왜 과금됐냐"고 문의하면, 합산 정산서에서 A의 건만 골라내서 확인해야 하는데 이게 수작업이에요. PRD에 72시간 무응답 환불, 중복 감지 등 11개 과금 정책이 있잖아요 — 이 정책들 때문에 분쟁이 반드시 생기고, 그때마다 업체별로 뜯어봐야 합니다.
둘째, 세금계산서 발행이 업체별입니다. 한국 B2B에서 정산 = 세금계산서인데, 이건 거래 상대방(업체)별로 발행해야 하니까 합산 정산의 의미가 없어요. 어차피 업체별 금액을 알아야 합니다.
셋째, 초기 업체 수가 적으니까 업체별이 부담이 아닙니다. 체크리스트 보면 파일럿으로 5개 업종에서 업체 확보하는 단계잖아요. 10~30개 업체 정산이면 합산이든 개별이든 운영 공수 차이가 거의 없어요. 오히려 합산해놓고 나중에 분리하는 게 마이그레이션 비용이 더 큽니다.
다만 초기 6개월에 맞게 단순화할 부분은 있어요:
자동 Cron 정산은 나중에 하고, 처음엔 관리자가 "이번 달 정산 생성" 버튼 누르는 수동 트리거로 가세요. 초기엔 예외 케이스(환불 처리 중인 건, 분쟁 중인 건)를 사람이 확인하고 정산을 확정하는 게 안전합니다. 자동화는 패턴이 안정된 후(3~4개월 뒤)에 붙여도 늦지 않아요.
지급도 마찬가지로, API로 자동 송금 연동하기보단 정산서 확정 → 엑셀 다운로드 → 수동 이체로 시작하는 게 현실적이에요. TossPayments 정산 API 연동은 업체 수가 50개 넘어가면 그때 해도 됩니다.
정리하면: 구조는 업체별로 잡되, 프로세스는 수동(반자동)으로 시작하는 게 초기 운영에 가장 합리적입니다. DB와 스키마는 업체별 정산 기준으로 만들어두고, 자동화 레벨만 점진적으로 올리면 돼요.

---




### 12-2. 환불/보상 `[Wave 3 ← 7-1 + 8-1]`
- [x] 정책: SLA/무응답/허위 리드 기준
- [x] DB: `refund_requests`
  - [x] 마이그레이션 작성: `YYYYMMDDHHMMSS_refunds.sql`
- [x] Schema: `app/src/lib/schema/refund.ts`
- [x] Server: `app/src/server/refund/{repository,service}.ts`
- [x] API:
  - [x] `POST /api/refunds` - 환불 요청 (업체)
  - [x] `GET /api/refunds` - 환불 요청 목록
  - [x] `GET /api/admin/refunds` - 관리자 환불 목록
  - [x] `PATCH /api/admin/refunds/[id]` - 환불 심사/처리
- [x] UI:
  - [x] `/partner/refunds` - 환불 요청 페이지
  - [x] `/admin/refunds` - 환불 관리 페이지

### 12-3. 데이터 내보내기 `[Wave 3 ← 전체]`
- [x] 결제/정산/리드 CSV Export 기능
- [x] API:
  - [x] `GET /api/exports/payments` - 결제 내역 CSV
  - [x] `GET /api/exports/settlements` - 정산 내역 CSV
  - [x] `GET /api/exports/leads` - 리드 내역 CSV

## 13) P8 — 데이터/성장(통계/외부연동) `[Wave 3]`
- [ ] 관리자 대시보드/통계 고도화: DAU/MAU, 신규회원, 리드/응답률/SLA, 퍼널/이탈, 광고 성과
- [ ] 분석/태그: GA4/Tag Manager 이벤트 설계(가입/문의/결제) + 전환 목표
- [ ] UTM 규칙: 캠페인별 UTM 자동 생성/검수
- [ ] 지도/주소: 카카오/네이버 지도, 주소 검색/자동완성, 좌표 저장, 길찾기 링크
- [ ] 백업 포인트: 정책/카테고리 설정 스냅샷 백업/복원
- [ ] 챗봇/실시간 채팅상담(AI 상담)(필요 시)
- [ ] 외부 쇼핑몰 통합검색(필요 시)

## 14) P9 — UI/UX 상용화 (크몽/오늘의집 수준)

> 목표: 현재 MVP 수준의 UI/UX를 크몽·오늘의집 같은 상용 B2B 마켓플레이스 수준으로 끌어올린다.
> 벤치마크: 크몽(서비스 마켓), 오늘의집(시공 업체), 숨고(전문가 매칭)
> 접근: 4단계(A→B→C→D) 파이프라인, 같은 단계 내 태스크는 워크트리 병렬 가능
> 관련문서 : /Users/julian/workspace/doctor_han/app/doc/domains/ui-ux/analysis.md

### 병렬 작업 가이드

```
Phase A  기반 + Backend (서로 독립, 전부 병렬 OK)
  ├─ A1: 디자인 시스템          ← config/CSS/UI tokens
  ├─ A2: 이미지 에셋 제작       ← public/ assets (Replicate AI)
  ├─ A3: 배지 Backend           ← new domain: server/badge/
  ├─ A4: 리뷰 확장 Backend      ← server/review/ 확장
  ├─ A5: 필터·정렬·포트폴리오 Backend ← server/vendor/ API 확장
  └─ A6: 검색 Backend           ← server/search/ (new)
         ↓ merge
Phase B  공통 컴포넌트 (A1 merge 후, 서로 병렬 OK)
  ├─ B1: 업체 카드 리디자인     ← widgets/VendorCard (new)
  └─ B2: 배지 Frontend          ← components/ui/Badge (A3 필요)
         ↓ merge
Phase C  페이지별 Frontend (B merge 후, 페이지별 병렬 OK)
  ├─ C1: 메인 페이지 리디자인   ← app/(main)/page.tsx 로컬 컴포넌트
  ├─ C2: 카테고리 리스트 페이지 ← app/(main)/categories/
  └─ C3: 업체 상세 페이지       ← app/(main)/vendors/[id]/
         ↓ merge
Phase D  크로스커팅 (전 페이지 merge 후)
  ├─ D1: 모바일 반응형 최적화   ← 전 페이지 레이아웃
  └─ D2: 마이크로 인터랙션      ← 전 페이지 동작
         (D1·D2는 레이아웃 vs 동작이라 병렬 가능하나, 같은 파일 수정 위험 있어 순차 권장)
```

---

### Phase A — 기반 + Backend (🔀 전부 병렬 가능)

> 서로 다른 파일/도메인을 건드리므로 워크트리 분리 안전.
> A1~A6 모두 동시에 시작 가능.

#### A1: 14-1. 디자인 시스템 기반 정비 `🔀 병렬` `branch: p9/design-system` ✅
> 수정 대상: tailwind config, globals.css, components/ui/
- [x] 컬러 팔레트 정리: Primary(#0a3b41/#62e3d5) 외 Secondary/Accent/Semantic 색상 체계 확립
- [x] 타이포그래피 스케일: heading(h1~h4)/body/caption/label 크기·weight 규칙 문서화 + Tailwind preset
- [x] 간격(spacing) 시스템: 4px 기반 그리드, section 간격/카드 내부 패딩 규칙 통일
- [x] 그림자(elevation) 단계: card/dropdown/modal/toast 4단계 shadow 토큰
- [x] 아이콘 체계: lucide-react 기본 + 카테고리별 커스텀 아이콘 (현재 이모지/SVG 혼용 → 통일)
- [x] 버튼 변형: Primary/Secondary/Ghost/Danger + size(sm/md/lg) 매트릭스 정리
- [x] 반응형 breakpoint 규칙: mobile(375)/tablet(768)/desktop(1280)/wide(1440) 기준 정리
- [x] 다크모드 대응 여부 결정 (P9에서는 라이트 모드만 완성, 다크는 선택)

#### A2: 14-10. 이미지 에셋 제작 (AI 생성 or 스톡) `🔀 병렬` `branch: p9/image-assets` ✅
> 수정 대상: public/images/ (신규), 스크립트
- [x] 카테고리 아이콘 세트 (9개 업종)
- [x] 히어로 배너 이미지 (3~5장)
- [x] 카테고리 리스트 상단 배경 이미지 (9개)
- [x] 업체 기본 프로필 이미지 (카테고리별 9종)
- [x] 빈 상태(empty state) 일러스트 (검색 결과 없음, 리뷰 없음, 포트폴리오 없음 등)
- [x] 온보딩/가이드 일러스트
- [x] (도구) Replicate MCP 연동으로 AI 이미지 생성 파이프라인 구축

#### A3: 14-6. 배지 시스템 Backend `🔀 병렬` `branch: p9/badge-backend` ✅
> 수정 대상: supabase/migrations/ (new), server/badge/ (new), API route (new)
- [x] 배지 종류 정의:
  - [x] "메디허브 인증" — 사업자 인증 완료
  - [x] "빠른 응답" — 평균 응답시간 24h 이내
  - [x] "Top N%" — 카테고리 내 리뷰/평점 상위
  - [x] "프리미엄 파트너" — 유료 멤버십 업체
  - [x] "신규 입점" — 입점 30일 이내
- [x] (Backend) 배지 자동 계산 로직:
  - [x] DB: `vendor_badges` 테이블 또는 `vendors.badges` jsonb 컬럼
  - [x] Cron/트리거: 응답시간/리뷰/멤버십 기반 배지 자동 부여/회수
  - [x] API: `GET /api/vendors/:id` 응답에 배지 목록 포함

#### A4: 14-5 리뷰 확장 Backend `🔀 병렬` `branch: p9/review-backend` ✅
> 수정 대상: supabase/migrations/ (new), server/review/ (확장), API route 확장
> 현재 server/review/에 mapper.ts만 존재 → repository.ts, service.ts 신규 생성
- [x] (Backend) 리뷰 항목별 세부 평점 필드 추가
  - [x] DB: `reviews` 테이블에 `quality_rating`, `communication_rating`, `speed_rating` 추가
  - [x] API: `POST /api/reviews` 확장, `GET /api/vendors/:id/reviews` 응답 확장
- [x] (Backend) 업체 답변 기능
  - [x] DB: `review_replies` 테이블 (또는 `reviews.vendor_reply` 필드)
  - [x] API: `POST /api/reviews/:id/reply` (업체 전용)

#### A5: 14-3/14-5 필터·정렬·포트폴리오 Backend `🔀 병렬` `branch: p9/vendor-api-ext` ✅
> 수정 대상: server/vendor/repository.ts (쿼리 확장), API route params, 포트폴리오 메타
> ⚠️ 필터/정렬 + 포트폴리오 메타 + 서비스소개 확장 모두 vendor 관련이므로 하나의 브랜치로 묶음
- [x] (Backend) 필터/정렬 API 확장: `GET /api/vendors` 쿼리 파라미터 추가
  - [x] 지역 필터 (시/도 → 시/군/구 2단계)
  - [x] 평점 필터 (4.0 이상 / 4.5 이상)
  - [x] 리뷰 수 필터 (리뷰 있는 업체만)
  - [x] 응답률/응답시간 필터
  - [x] 배지 필터 (인증업체 / 프리미엄 등)
  - [x] 정렬 옵션 추가: 최신순 / 평점순 / 리뷰많은순 / 응답빠른순 / 인기순
- [x] (Backend) 포트폴리오 메타데이터 확장: title, description, tags, is_featured
- [x] (Backend) 업체 소개 필드를 리치텍스트(markdown/html)로 확장
  - [x] `PATCH /api/vendors/me` description 필드 확장 또는 별도 `rich_description` 추가
- [x] (Backend) `vendor_service_prices` 데이터를 상세 페이지에서 노출
- [x] (Backend) 탭별 데이터 lazy loading 또는 한 번에 로드

#### A6: 14-7. 검색 Backend `🔀 병렬` `branch: p9/search-backend` ✅
> 수정 대상: supabase/migrations/ (index), server/search/ (new)
- [x] (Backend) 검색 인덱스 최적화 (Supabase full-text search 또는 별도 인덱싱)
- [x] 검색 자동완성 API: 업체명/카테고리/태그 제안
- [x] 인기 검색어 API

---

### Phase B — 공통 컴포넌트 (🔀 B1·B2 병렬 가능, A1 merge 필요)

> A1(디자인 시스템) merge 후 시작. B1과 B2는 서로 다른 컴포넌트이므로 병렬 OK.

#### B1: 14-4. 업체 카드 리디자인 `🔀 병렬` `branch: p9/vendor-card`
> 수정 대상: components/widgets/VendorCard.tsx (new), VendorSection 내 카드 교체
> 선행: A1(디자인 토큰), A2(기본 이미지)
- [ ] 카드 썸네일: 빌딩 아이콘 플레이스홀더 → 실제 업체 대표 이미지
  - [ ] (Backend) 업체 프로필 이미지 업로드 기능 강화
  - [ ] 이미지 없는 업체용 카테고리별 기본 이미지 세트 제작 (AI 생성)
  - [ ] 이미지 aspect ratio 통일: 16:10 또는 4:3
- [ ] 카드 정보 밀도 개선:
  - [ ] 업체명 + 1줄 소개 (현재 OK)
  - [ ] 평점 ★ + 리뷰 수 (현재 OK → 스타일 개선)
  - [ ] 주요 서비스 태그 (최대 3개, 칩 형태)
  - [ ] 지역 + 응답률/응답시간 뱃지
  - [ ] 가격 범위 (현재 OK → 포맷 개선: "200만원~" 간략화)
- [ ] 배지 시스템 시각화:
  - [ ] "인증업체" 뱃지 (사업자 인증 완료)
  - [ ] "빠른응답" 뱃지 (평균 응답 24시간 이내)
  - [ ] "프리미엄" 뱃지 (유료 회원)
  - [ ] "Top N%" 뱃지 (카테고리 내 상위)
- [ ] 호버 효과: 이미지 살짝 확대 + 그림자 깊어짐 + "상세보기" 오버레이
- [ ] 찜 버튼: 현재 하트 → 호버 시 색상 전환 애니메이션

#### B2: 14-6. 배지 시스템 Frontend `🔀 병렬` `branch: p9/badge-frontend`
> 수정 대상: components/ui/ 또는 widgets/ (배지 컴포넌트)
> 선행: A1(디자인 토큰), A3(배지 Backend)
- [ ] (Frontend) 배지 UI 컴포넌트:
  - [ ] 카드/상세 페이지에서 배지 아이콘+라벨 표시
  - [ ] 배지 hover 시 설명 tooltip
  - [ ] 배지별 고유 색상/아이콘

---

### Phase C — 페이지별 Frontend (🔀 C1·C2·C3 병렬 가능, Phase B merge 필요)

> Phase B(카드+배지 컴포넌트) merge 후 시작.
> C1·C2·C3는 서로 다른 페이지 디렉토리를 수정하므로 병렬 OK.

#### C1: 14-2. 메인 페이지 리디자인 `🔀 병렬` `branch: p9/main-page`
> 수정 대상: app/(main)/page.tsx, 로컬 컴포넌트 (HeroBanner, CategoryScroller, VendorSection, PromoBanner)
> 선행: B1(업체 카드), A2(이미지 에셋)

##### 히어로 배너
- [ ] 실제 의료 관련 고퀄리티 이미지 적용 (picsum 대체)
  - [ ] AI 이미지 생성(Replicate) 또는 스톡 이미지 확보
  - [ ] 배너별 이미지: 개원 준비, 의료기기, 인테리어 등 카테고리 대표 이미지
- [ ] 배너 높이/비율 조정: 현재 단색 그라데이션 → 이미지+오버레이 구조
- [ ] CTA 버튼 강화: "파트너 찾기" → 구체적 문구 ("개원 준비 시작하기", "업체 비교하기" 등)
- [ ] 자동 슬라이드 + 인디케이터 개선 (dot → progress bar 또는 numbering)
- [ ] (선택) 검색바를 히어로 내부에 통합 배치 (크몽 스타일)

##### 카테고리 섹션
- [ ] 아이콘 리디자인: 현재 기본 아이콘 → 의료/업종 특화 일러스트 아이콘
  - [ ] 원외탕전: 한약재/탕전 일러스트
  - [ ] 의료기기: 의료장비 일러스트
  - [ ] 인테리어: 병원 인테리어 일러스트
  - [ ] 기타 업종별 맞춤 아이콘
- [ ] hover 인터랙션 추가: scale + 배경색 변경 + 업체 수 tooltip
- [ ] 카테고리 카드에 "업체 N개" 서브텍스트 추가

##### 추천 파트너 / 이번 달 인기 섹션
- [ ] 카드 디자인 개선 (→ B1 업체 카드 리디자인 참조)
- [ ] 섹션 간 시각적 구분 강화: 배경색 교차 또는 구분선
- [ ] "더보기" 버튼 스타일 개선: 텍스트 링크 → 아웃라인 버튼
- [ ] 카드 hover 인터랙션: 이미지 줌 + 그림자 확대 + CTA 노출

##### 신뢰 구간 (Value Proposition)
- [ ] 현재 "검증된 업체 / 쉬운 비교 / 빠른 문의" 섹션 비주얼 강화
  - [ ] 숫자 기반 실적 노출: "등록 업체 N개", "누적 리뷰 N건", "평균 응답 N시간"
  - [ ] 아이콘 + 일러스트 조합으로 시각적 임팩트
- [ ] 사용 후기/추천사 섹션 신규 추가 (의사 추천 코멘트 카드 3~4개)

##### 업체 입점 CTA 배너
- [ ] 현재 단조로운 CTA → 2컬럼(한의사용 / 업체용) CTA 또는 비주얼 강화
- [ ] 입점 혜택 요약 포함 (무료 입점, 리드 수신, 매출 확대)

##### 푸터
- [ ] 푸터 리디자인: 현재 한 줄 → 3~4컬럼 (서비스 소개/고객지원/법적고지/SNS)
- [ ] 회사 정보(상호/대표/사업자번호/통신판매업) 노출 (전자상거래법 필수)
- [ ] 뉴스레터 구독 입력 (선택)

#### C2: 14-3. 카테고리 리스트 페이지 리디자인 `🔀 병렬` `branch: p9/category-list`
> 수정 대상: app/(main)/categories/ 페이지 및 로컬 컴포넌트
> 선행: B1(업체 카드), A5(필터/정렬 Backend), A2(배경 이미지)

##### 페이지 상단
- [ ] 카테고리 대표 비주얼: 카테고리명 + 배경 이미지/일러스트 (현재 텍스트만)
- [ ] 업체 수 + 간략 설명 문구 ("의료기기 분야 검증된 업체 8곳을 비교해보세요")
- [ ] 서브카테고리 필터 칩: 현재 OK → 선택 시 인터랙션 강화 (스크롤 애니메이션)

##### 필터/정렬 시스템 고도화 (Frontend)
- [ ] 필터 UI 구현:
  - [ ] 지역 필터 (시/도 → 시/군/구 2단계)
  - [ ] 평점 필터 (4.0 이상 / 4.5 이상)
  - [ ] 리뷰 수 필터 (리뷰 있는 업체만)
  - [ ] 응답률/응답시간 필터 (빠른 응답 업체)
  - [ ] 배지 필터 (인증업체 / 프리미엄 등)
- [ ] 정렬 옵션 UI: 최신순 / 평점순 / 리뷰많은순 / 응답빠른순 / 인기순
- [ ] 필터 UI 개선: 크몽식 사이드바 필터 또는 상단 드롭다운 조합
- [ ] 선택된 필터 태그 표시 + 초기화 버튼
- [ ] 필터 결과 카운트 실시간 업데이트 ("N개 업체")

##### 업체 카드 뷰 모드
- [ ] 그리드뷰 / 리스트뷰 토글 (크몽 참고)
- [ ] 그리드뷰: 현재와 유사하되 카드 정보 밀도 개선
- [ ] 리스트뷰: 좌(이미지) + 우(정보 밀집) 가로형 카드

##### 무한 스크롤 / 페이지네이션
- [ ] 현재 페이지네이션 방식 확인 후 개선
- [ ] 스크롤 시 자연스러운 로딩 인디케이터
- [ ] 검색 결과 없음 페이지 개선 (빈 상태 일러스트 + 추천 액션)

#### C3: 14-5. 업체 상세 페이지 리디자인 `🔀 병렬` `branch: p9/vendor-detail`
> 수정 대상: app/(main)/vendors/[id]/ 내 컴포넌트 (VendorDetailPage, VendorHeader, VendorInfo, ReviewSection 등)
> 선행: B1(업체 카드), B2(배지), A4(리뷰 Backend), A5(포트폴리오/가격 Backend)

##### 히어로 / 갤러리 영역 (상단)
- [ ] 단일 빌딩 아이콘 → 이미지 갤러리 캐러셀 (크몽 참고)
  - [ ] 메인 이미지 1장 + 썸네일 리스트
  - [ ] 클릭 시 라이트박스(전체화면 갤러리)
  - [ ] 이미지 없는 경우: 카테고리별 디폴트 비주얼
- [ ] 갤러리 + 기본 정보 2컬럼 레이아웃:
  - [ ] 좌: 이미지 갤러리
  - [ ] 우: 업체명/소개/평점/지역/태그 + CTA 버튼

##### Sticky CTA 패널 (오른쪽 사이드바)
- [ ] 크몽/오늘의집 스타일 sticky 패널:
  - [ ] 가격 정보 요약
  - [ ] "문의하기" Primary CTA 버튼 (항상 보이는 위치)
  - [ ] "찜하기" / "공유하기" Secondary 버튼
  - [ ] 응답률/응답시간 표시
  - [ ] (선택) "최근 N명이 문의했어요" 사회적 증거
- [ ] 모바일: 하단 고정 CTA 바 (크몽 모바일 참고)

##### 탭 기반 콘텐츠 구조
- [ ] 현재 단일 스크롤 → 탭 네비게이션 (오늘의집 참고):
  - [ ] 서비스 소개 탭
  - [ ] 포트폴리오 탭
  - [ ] 가격 정보 탭
  - [ ] 리뷰 탭
  - [ ] 업체 정보 탭
- [ ] 탭 스크롤 시 sticky header (스크롤 위치에 따라 자동 활성화)

##### 서비스 소개 탭
- [ ] 현재 plain text → 리치 콘텐츠 지원:
  - [ ] 마크다운 또는 WYSIWYG 에디터 (업체가 직접 편집)
  - [ ] 이미지 삽입 가능한 서비스 설명
  - [ ] 서비스 특장점 아이콘+텍스트 리스트
  - [ ] FAQ 아코디언 (자주 묻는 질문)

##### 포트폴리오 탭
- [ ] 현재 이미지 1장 → 갤러리 그리드 (크몽 86개 포트폴리오 참고)
  - [ ] 이미지 그리드 (3~4열)
  - [ ] 클릭 시 상세 모달 (제목/설명/이미지 확대)
  - [ ] 카테고리/태그별 필터
- [ ] 사례(케이스 스터디) 형태 지원:
  - [ ] "대표 사례" 태그 (오늘의집 참고)
  - [ ] 시공 전/후 비교 이미지
  - [ ] 프로젝트 설명 (규모/기간/비용)

##### 가격 정보 탭
- [ ] 현재 단순 가격 범위 → 서비스별 가격표 (크몽 STANDARD/DELUXE/PREMIUM 참고)
  - [ ] 가격 티어 비교 테이블 (있는 경우)
  - [ ] 서비스 항목별 단가 리스트
  - [ ] "정확한 견적은 문의" 안내 + 바로 문의 CTA

##### 리뷰 탭 (Frontend)
- [ ] 리뷰 요약 영역 강화:
  - [ ] 평점 분포 막대그래프 (5점/4점/3점/2점/1점 비율) — 크몽 참고
  - [ ] 항목별 평점 (결과물 만족도 / 소통 / 응답 속도) — 크몽 참고
  - [ ] (선택) AI 리뷰 요약 (오늘의집 참고: 키워드 추출 + 긍/부정 요약)
- [ ] 리뷰 카드 개선:
  - [ ] 리뷰어 프로필 (아바타 + 닉네임 + 인증뱃지)
  - [ ] 사진 리뷰 강조: 사진 포함 리뷰 상단 노출 / "사진 리뷰만 보기" 필터
  - [ ] 업체 답변 표시 (크몽 참고: 전문가 답변 카드)
  - [ ] 리뷰 도움됐어요 버튼 (좋아요 카운트)
- [ ] 리뷰 필터: 최신순/평점높은순/평점낮은순/사진리뷰

##### 업체 정보 탭
- [ ] 기본 정보: 설립일, 직원수, 대표자, 사업자번호(선택)
- [ ] 서비스 지역: 지도 연동 (카카오맵 임베드) — P8 지도/주소와 연계
- [ ] 영업시간 / 상담 가능 시간
- [ ] 연락처 (전화/이메일 — 리드 유도 위해 제한적 노출)

#### C4: 14-7. 검색 UX Frontend `🔀 병렬` `branch: p9/search-frontend`
> 수정 대상: GNB 검색바 컴포넌트, 검색 결과 페이지 (new)
> 선행: A6(검색 Backend)
- [ ] 검색바 자동완성 (업체명/카테고리/태그 제안)
- [ ] 최근 검색어 / 인기 검색어 드롭다운
- [ ] 검색 결과 페이지 별도 구성 (카테고리별 그룹핑)
- [ ] 검색 결과 없음 → 유사 업체 추천

---

### Phase D — 크로스커팅 (Phase C merge 후, ⚠️ 순차 권장)

> 전 페이지를 횡단하므로 Phase C 전부 merge 후 시작.
> D1(레이아웃)과 D2(동작)는 성격이 다르지만 같은 파일 수정 가능성 있어 순차 권장.

#### D1: 14-8. 모바일 반응형 최적화 `branch: p9/mobile-responsive`
> 수정 대상: 전 페이지 레이아웃/CSS
- [ ] 메인 페이지: 히어로 배너 모바일 대응, 카테고리 2열 그리드
- [ ] 카테고리 리스트: 카드 1열, 필터 bottom sheet
- [ ] 업체 상세: 탭 가로 스크롤, 하단 고정 CTA 바
- [ ] GNB: 모바일 햄버거 메뉴 + 카테고리 full-screen overlay
- [ ] 터치 인터랙션: 스와이프 갤러리, pull-to-refresh
- [ ] 이미지 최적화: next/image + WebP + 반응형 srcSet

#### D2: 14-9. 마이크로 인터랙션 / 애니메이션 `branch: p9/micro-interactions`
> 수정 대상: 전 페이지 동작/전환 효과
- [ ] 페이지 전환: skeleton loading (현재 있으면 개선, 없으면 추가)
- [ ] 카드 로딩: 순차적 fade-in 애니메이션
- [ ] 찜 버튼: 하트 bounce 애니메이션
- [ ] 스크롤 연동: 탭 highlight + 부드러운 스크롤
- [ ] 필터 변경: 카드 리스트 fade-out → fade-in 전환
- [ ] Toast 알림: 찜 추가/제거, 문의 완료 등

---

## 15) Future — 임상 케이스 DB

> 사업계획서 수익모델 (11) + 솔루션 B — 3년차 예상 25.2억+
> 장기 핵심 BM. 구독형 열람권 + 학회/업체 제휴.

- [ ] 케이스 업로드 템플릿(증상/진단/치료(처방/약대)/경과/부작용 메타데이터 표준화)
- [ ] 유사도 검색/태그 검색, 개인·학회 단위 업로드·관리
- [ ] 통계/인사이트 리포트 (질환별 처방 조합, 반응률, 트렌드)
- [ ] 구독형 열람권: 자기 학회 케이스 무료, 타 학회 유료 (월 7만원)
- [ ] 프리미엄 단건: 희귀·난치성 케이스 묶음, 학회 리포트
- [ ] 학회 제휴: 회원 서비스/학술 지원 (평균 700만/년/학회)
- [ ] 업체 제휴: 제품 언급 통계, 경쟁 분석 (연 2,000만/업체)
- [ ] AI 임상 의사결정 보조 (유사 케이스 추천, 요약, 금기 플래그)
- [ ] 비식별화/동의/감사 로그 (준법 내장)
- [ ] (장기) 국제화: 영어/일본어/스페인어, 해외 기관 구독

## 16) Future — 게시판/게시물광고

> 사업계획서 솔루션 A-5 (게시판/마켓플레이스) + 수익모델 (5) 게시물광고
> 게시판이 선행되어야 게시물광고 수익 모델 가능. 1년차 예상 4,416만원

### 16-1. 게시판 시스템
- [ ] 개원입지 매물 게시판
- [ ] 학회/세미나 모집 게시판
- [ ] 구인구직 게시판
- [ ] 중고거래 게시판
- [ ] 한의원 양수·양도 게시판

### 16-2. 게시물광고 (게시판 구축 후)
- [ ] 개원입지 광고: VIP(3슬롯 고정) / 프리미엄(9x2 로테이션) / 플러스(8x3 로테이션) / 일반
- [ ] 학회/세미나 광고: 프리미엄존 6x2 로테이션, 단독 30만/월, 스폰서 50만/월
- [ ] 기간제 + 정액제 이중 과금 모델

## 17) Backlog — 개원세미나 (오프라인)

> 사업계획서 수익모델 (6) — 1년차 예상 1.2억
> 오프라인 행사 위주. 개발은 온라인 신청/결제/관리 페이지 정도.

- [ ] 매월 오프라인 개원세미나 주최
- [ ] 핵심 업종 7개 (입지/인테리어/개원자금/의료기기/마케팅/세무노무): 강연 + 부스 (100만/업체)
- [ ] 서브 업종 6개 (보험/원외탕전/간판/전자차트/홈페이지/의료기기): 부스만 (50만/업체)
- [ ] 예비 개원의 참가비: 무료~3만원
- [ ] 온라인: 세미나 신청 페이지, 업체 참가 신청/결제, 참가자 관리

## 18) Backlog — 개원패키지 (턴키)

> 사업계획서 수익모델 (7) — 1년차 예상 2.1억
> 엄선 업체로 턴키 개원. 수수료 7%.

- [ ] 베이직 패키지: 인테리어/간판/의료기기/세무노무/전자차트 (~8천만원, 마진 560만)
- [ ] 프리미엄 패키지: 베이직 + 가구/마케팅/직원교육/홈페이지 (~1.7억, 마진 1,190만)
- [ ] 온라인: 패키지 소개 페이지, 상담 신청, 견적서/계약 관리, 진행 현황 트래킹

## 19) Backlog — 쇼룸 운영 (오프라인)

> 사업계획서 수익모델 (8) — 1년차 예상 3.36억
> 오프라인 상설 전시공간. 개발보다 공간 확보/운영이 핵심.

- [ ] 전시존: 업체 부스 20~25개 (프리미엄 150만/월, 일반 100만/월)
- [ ] 교육장: 70~80명 수용, 외부 대관 월 8회 x 50만
- [ ] 온라인: 쇼룸 안내 페이지, 전시/대관 신청, 업체 부스 관리

## 20) Backlog — 공동구매

> 사업계획서 수익모델 (9) — 1년차 예상 4,800만
> MOQ 달성형, 에스크로/정산, 수수료 10%.

- [ ] 공동구매 상품 등록/MOQ 설정
- [ ] 참여 신청/결제 (에스크로)
- [ ] MOQ 달성 시 확정/미달 시 환불
- [ ] 납품 품질관리/정산
- [ ] 회원수 8,000명 기준 참여율 10% = 800명, 1인 평균 5만원

## 21) Backlog — 소모품 가격비교/통합검색

> 사업계획서 수익모델 (10) + 솔루션 A-4 — 예상매출 미정
> 다수 의료소모품 유통쇼핑몰의 재고/가격/배송비 한눈 비교.

- [ ] 외부 쇼핑몰 상품 크롤링/API 연동 (보유 여부부터 시작 → 추후 가격비교)
- [ ] 통합검색 UI (한약재, 의료 소모품 위주)
- [ ] 상단 고정 광고 상품 (검색 시 추천 업체 노출, 월 10만)
- [ ] 회원가입형 리드 연결 (CPA 모델과 연계)


todo.md 기준으로 MVP→P1→P4까지 뼈대를 먼저 만들고, 실제로 코파운더랑 운영하면서

  - “진짜 돈 되는 흐름(리드→전환→유료)”에서 병목이 생기는 지점
  - 정책/권한/검수/정산처럼 운영 이슈가 터지는 지점

  이런 것들부터 우선순위 재정렬해서 수정·추가하면 돼.


시드데이터. pnpm -C app db:reset

  테스트 계정(비번 공통 Password123!):

  - admin: admin@medihub.local
  - doctor: doctor1@medihub.local
  - vendor: vendor01@medihub.local



  ----

  개발 중에는 supabase의 Confirm email을 OFF로 두고, 실서비스에서는 Resend로 통일한다.



  이메일 확인을 켜두려면 SMTP 설정이 필요해요. Supabase가 확인 이메일을 보내야 하니까요.

  방법 1: Supabase 기본 이메일 (제한적)
  - 하루 4통까지만 가능 (테스트용)
  - 별도 설정 없이 Confirm email ON만 하면 됨

  방법 2: 커스텀 SMTP 설정 (실서비스용)

  Supabase 대시보드 → Project Settings → Authentication → SMTP Settings:

  (권장) Resend SMTP로 설정:
  - SMTP Host/Port/User/Password: Resend에서 제공하는 값 사용
  - Sender Email: `RESEND_FROM_EMAIL`와 동일하게 맞추기

  추천 SMTP 서비스:
  - Resend - 무료 3,000통/월, 설정 쉬움 (Vercel 배포와 궁합 좋음)
  - SendGrid - 무료 100통/일
  - Gmail - 무료지만 일일 제한 있음
