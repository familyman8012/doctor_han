# Medihub(가칭) 구현 TODO

목표: `app/doc/business.md`의 “의료계의 크몽”을 `app/doc/test.csv`의 기능 목록(MVP 포함) 형태로 구현한다.

## 구현 원칙(고정)
- Frontend는 **Supabase(DB) 직접 호출 금지**. 모든 데이터 통신은 `src/app/api/**/route.ts`(BFF) + React Query로 통일.
- 예외: Auth(`supabase.auth.*`)는 허용. Storage는 “서버 Signed URL 발급 → 클라 업/다운로드”만 허용.
- 스키마 변경은 Supabase CLI 마이그레이션으로 관리: `app/supabase/migrations`.
- DB 명령은 pnpm 스크립트로 통일: `pnpm db:*` (Supabase CLI 래퍼).

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
- [ ] 공통(정책/설계)
  - [ ] 온보딩 퍼널 정의: doctor(인증 제출 → 업체 탐색/찜 → 첫 문의) / vendor(프로필/포트폴리오 → 인증 제출 → 리드 응답)
  - [ ] 프로필 완성도 규칙 정의(역할별 체크리스트)
- [ ] Backend (API/DB)
  - [x] 기존: `GET /api/me`에 `onboardingRequired` 존재(프로필 생성 필요 여부)
  - [ ] 온보딩 상태 저장 방식 결정: `profiles` 컬럼(jsonb) vs `user_onboarding_steps` 테이블
  - [ ] 완성도 계산/저장 방식 결정(저장 vs 런타임 계산)
  - [ ] (택1) 엔드포인트 설계
    - [ ] `GET /api/me` 확장으로 체크리스트/완성도 포함 또는
    - [ ] `GET /api/onboarding`, `PATCH /api/onboarding` 신설
  - [ ] api-client: 온보딩 조회/저장 함수 추가
- [ ] Frontend (UI)
  - [ ] 역할별 첫 방문 가이드(퍼널) UI
  - [ ] 프로필 완성도 UI(배너/체크리스트)
- [ ] 완료 기준(AC): 신규 유저가 다음 행동(인증/프로필/첫 리드)에 도달하는 길이 명확해짐

### 5-5. 약관/동의(버전 관리 + 이력 저장 + 철회)
- [ ] 공통(정책/문서)
  - [x] (MVP) 이용약관/개인정보처리방침은 정적 페이지(HTML/MD)로 제공하고, 푸터에 링크만 노출
  - [x] (MVP) 필수 동의 저장 최소화: `profiles`에 “동의 시각 + 문서 버전(예: `YYYY-MM-DD`)”만 저장
  - [x] (MVP) 마케팅 수신동의는 선택으로 두고, 실제 마케팅 발송 시작할 때 `opt_in_at`/`opt_out_at`만 관리
  - [ ] 문서 버전 규칙 확정: `YYYY-MM-DD` (문서 변경 시 버전 bump)
- [ ] Backend (API/DB)
  - [ ] DB(필수 동의 최소): `profiles.terms_version`, `profiles.terms_agreed_at`, `profiles.privacy_version`, `profiles.privacy_agreed_at`
  - [ ] DB(선택 동의): `profiles.marketing_opt_in_at`, `profiles.marketing_opt_out_at`
  - [ ] DTO/Mapper: `ProfileViewSchema`, `MeResponse`에 동의 상태 포함
  - [ ] 엔드포인트(수정): `POST /api/profile`에서 필수 동의(버전/시각) 저장
  - [ ] 엔드포인트(추가/택1): 마케팅 수신 동의 토글/철회
    - [ ] `PATCH /api/profile`로 처리 또는
    - [ ] `PATCH /api/consents/marketing` 신설
  - [ ] api-client: 동의 조회/변경 함수 추가
  - [ ] (P2+ 필요 시) 동의 이력 고도화(append-only + 철회 이력)
    - [ ] 약관 모델 설계: 이용약관/개인정보/광고성 수신(필수/선택, 버전, 시행일)
    - [ ] DB: `terms_versions`, `user_consents`(append-only, 철회 시 `revoked_at` 기록)
- [ ] Frontend (UI)
  - [ ] 정적 문서 페이지 작성: 이용약관/개인정보처리방침
  - [ ] 푸터 링크 추가: 이용약관/개인정보처리방침
  - [ ] 가입/최초 로그인 동의 UI: 필수(이용약관/개인정보) 체크박스 + 선택(마케팅 수신 동의)
  - [ ] 가입/최초 로그인 시 약관 동의 플로우(필수 미동의 시 사용 제한)
  - [ ] 마이페이지: 약관 링크 + (마케팅 시작 후) 수신 동의 토글/철회
  - [ ] (P2+ 필요 시) 마이페이지: 동의 이력 노출 + 광고성 수신 철회 이력
- [ ] 완료 기준(AC): 약관은 푸터 링크로 접근 가능, 필수 동의는 버전+시각이 저장됨(마케팅은 선택/철회 가능)

### 5-6. SEO 기본(카테고리/업체 메타 + OG 템플릿)
- [x] Backend (API/DB)
  - [x] 없음(API/DB 작업 없음)
- [ ] Frontend (UI/SEO)
  - [ ] 카테고리/업체 페이지 `generateMetadata` 정리(title/description/canonical/OG)
  - [ ] OG 템플릿: 기본 OG 이미지 + (선택) 동적 OG 이미지 라우트
  - [ ] sitemap/robots: 최소 `sitemap.xml`, `robots.txt` 제공
- [ ] 완료 기준(AC): 공유/검색 결과에서 기본 메타/OG가 정상 노출

### 5-7. 리뷰 고도화(정렬 + 노출 정책 + 운영 대응)
- [ ] 공통(정책/운영)
  - [ ] 노출 정책 문서화: 정렬/블라인드/스팸 대응 기준(운영 정책) + UI 링크 문구 확정
- [ ] Backend (API/DB)
  - [ ] 엔드포인트(수정): `GET /api/vendors/:id/reviews`에 `sort=recent|rating_high|rating_low` 지원
  - [ ] DB(선택): 리뷰 신고 저장용 `review_reports` 테이블 + RLS
  - [ ] 엔드포인트(추가): `POST /api/reviews/:id/report` (신고 접수)
  - [ ] 엔드포인트(추가, admin): `POST /api/admin/reviews/:id/hide`, `POST /api/admin/reviews/:id/unhide`
  - [ ] 운영 이력: 신고/블라인드/복구는 `audit_logs`에 기록(사유 포함)
  - [ ] api-client: 리뷰 정렬/신고/블라인드 관련 함수 추가
- [ ] Frontend (UI)
  - [ ] 리뷰 정렬 UI
  - [ ] 노출 정책 안내: 리뷰 작성/노출 기준, 블라인드/스팸 대응 정책 페이지(링크 노출)
  - [ ] 리뷰 신고 UI
- [ ] 완료 기준(AC): 리뷰 정렬이 가능하고, 운영 정책이 UI에 명확히 안내됨

### 5-8. 운영 최소(Rate limit / 스팸 방지 / 오류 로그)
- [ ] 공통(정책/외부 설정)
  - [x] 정책: P1에서는 “유저 기준 제한(일/시간) + 쿨다운”으로 시작
    - 참고: IP 기반/짧은 윈도우(초당/분당) + 서버리스 인스턴스 공통 적용은 공유 저장소 필요 → Redis(Upstash/Vercel KV)로 P2+ 또는 어뷰징 심해지면 도입
  - [ ] (선택) Sentry 프로젝트 생성 + DSN 발급(서버/클라)
  - [ ] (필요 시) 캡차 공급자 선정(예: Cloudflare Turnstile) + site/secret 키 발급
- [ ] Backend (API/DB/Infra)
  - [ ] 유저 기준 Rate limit(기본): 주요 엔드포인트에 일/시간 단위 제한 + 쿨다운
    - [ ] 적용 대상: `POST /api/leads`, `POST /api/reviews`, `POST /api/files/signed-upload`, `POST /api/doctor/verification`, `POST /api/vendor/verification`
  - [ ] 리드 스팸 방지(서버): doctor별 일/주 단위 발송 제한 + 동일 업체 반복 문의 쿨다운 + 차단 로그
  - [ ] 차단/제한 로그: 차단 발생 시 `audit_logs` 또는 별도 `abuse_logs`에 기록
  - [ ] 오류 로그 수집(서버): API 에러/리퀘스트 로그를 Sentry 등으로 수집(최소 설정)
  - [ ] (P2+ 또는 필요 시) IP 기반 짧은 윈도우 + 서버리스 공통 레이트리밋: Upstash/Vercel KV(=Redis)로 적용
- [ ] Frontend
  - [ ] 캡차(조건부/스텝업): 매 요청마다 노출하지 않고 “어뷰징 징후”일 때만 노출(기본 off)
    - [ ] 예) 로그인 연속 실패 N회 이후(로그인 폼 단계)
    - [ ] 예) 비번 재설정 요청 과다(이메일/시간 기준, `/auth/reset-password`)
    - [ ] 예) 리드 생성 과다/차단 발생 시(리드 생성 폼 단계)
  - [ ] 오류 로그 수집(클라): React 에러/리퀘스트 로그를 Sentry 등으로 수집(최소 설정)
- [ ] 완료 기준(AC): 리드 남발/비정상 트래픽을 1차 방어하고, 장애 원인 추적이 가능

## 6) P2 — 알림/메시징/고객지원/운영 고도화
- [ ] 통합 메시징: 카카오 알림톡/이메일(SMTP) 발송 + 실패 재시도 + 로그
- [ ] 리드 Q&A 스레드: 리드별 대화, 읽음 표시, 첨부, 관리자 가시성
- [ ] 리드 상태 자동화: 타임아웃/리마인드/만료 전 안내, 종료 사유 수집
- [ ] 신고/제재: 신고 접수 → 임시 블라인드 → 심사 → 제재 단계 → 이력 관리
- [ ] FAQ/공지: 헬프센터 문서 CRUD + 검색(로그 기반 추천은 후순위)
- [ ] 고객지원(헬프데스크): 1:1 문의 티켓 + SLA + FAQ 연동
- [ ] 감사 로그/변경 기록: 가입/수정/삭제/다운로드/승인, 요금/제재/환불 변경 로그

## 7) P3 — 수익화(결제/정산/광고) / TossPayments
- [ ] 수익모델 확정: 정액형(티어) → 광고/우선노출 → 리드 과금(CPL) 순서로 확장
- [ ] TossPayments 결제 연동: 결제 생성/승인, 웹훅 처리, 결제 상태 동기화
- [ ] 티어/요금제: 기간/예산/옵션별 단가, 자동 과금, 영수증/세금계산서 발행 범위 결정
- [ ] 크레딧/정산: 크레딧 잔액, 충전/차감/환불 내역, 월별 청구/입금/미수 리포트
- [ ] 환불/보상: SLA/무응답/허위 리드 기준, 자동 환불/크레딧 반환, 예외 심사 큐
- [ ] 광고/우선노출: 슬롯 관리(위치별), 표시 정책(광고/유기 혼합, AD 표기), UTM 추적
- [ ] 데이터 내보내기: 결제/정산/리드 CSV Export

## 8) P4 — 데이터/성장(통계/외부연동)
- [ ] 관리자 대시보드/통계 고도화: DAU/MAU, 신규회원, 리드/응답률/SLA, 퍼널/이탈, 광고 성과
- [ ] 분석/태그: GA4/Tag Manager 이벤트 설계(가입/문의/결제) + 전환 목표
- [ ] UTM 규칙: 캠페인별 UTM 자동 생성/검수
- [ ] 지도/주소: 카카오/네이버 지도, 주소 검색/자동완성, 좌표 저장, 길찾기 링크
- [ ] 외부 쇼핑몰 통합검색(필요 시)
- [ ] 백업 포인트: 정책/카테고리 설정 스냅샷 백업/복원
- [ ] 챗봇/실시간 채팅상담(AI 상담)(필요 시)

## 9) Future — 임상 케이스 DB
- [ ] 케이스 업로드 템플릿(증상/진단/치료/경과/부작용 메타데이터)
- [ ] 유사도 검색/태그 검색
- [ ] 통계/인사이트 리포트


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
