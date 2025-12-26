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
- [ ] 계정찾기: 아이디 찾기 / 비밀번호 재설정
- [ ] 소셜 로그인: 카카오/구글(연동 후 자동가입/로그인)
- [ ] 승인/반려 알림(최소): 인앱/이메일 중 1개부터 시작
- [ ] 알림 설정: 수단(카톡/문자/이메일) + 알림 종류 on/off
- [ ] 온보딩: 역할별 첫 방문 퍼널 가이드 + 프로필 완성도(체크리스트)
- [ ] 약관/동의: 이용약관/개인정보/광고성 수신 동의(버전 관리 + 이력 저장 + 철회)
- [ ] SEO 기본: 카테고리/업체 메타/OG 템플릿
- [ ] 리뷰 고도화: 정렬 + 노출 정책 안내(운영 정책/블라인드/스팸 대응 등)
- [ ] 운영 최소: Rate limit / 스팸 방지(리드 남발 방지), 서버/클라 오류 로그 수집

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