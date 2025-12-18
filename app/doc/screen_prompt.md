# Medihub 화면 프롬프트 모음 (Web Design AI용)

목표: `app/doc/business.md`의 “의료계의 크몽/다나와” 컨셉을 `app/doc/test.csv` 기능 목록 기준으로 **웹 화면(스크린) 단위로 분해**하고, 각 화면을 “프롬프트만으로 UI를 생성”하는 도구에 바로 넣을 수 있게 정리한다.

---

## 1) 사용법

1. 아래의 `BASE PROMPT`를 먼저 복사해서 붙여넣는다.
2. 원하는 화면의 `SCREEN PROMPT`를 **바로 이어서** 붙여넣는다.
3. 출력은 “디자인(Figma 프레임/레이아웃) 또는 코드(React+Tailwind)” 중 도구가 지원하는 형태로 받는다.

---

## 2) BASE PROMPT (항상 포함)

```text
You are a senior product designer and UX writer.

Design high-fidelity, modern, responsive web UI screens for a Korean B2B marketplace called “메디허브 (Medihub)”.

Product concept
- “의료계의 크몽 + 다나와”: doctors can search/filter/compare vendors and send inquiries (leads).
- Roles: Guest, 한의사(Doctor user), 업체(Vendor/Partner), Admin.
- Tone: trustworthy, clinical, professional, fast. Avoid “salesy” vibes.

Visual style
- Clean SaaS layout, generous whitespace, subtle borders, soft shadows, rounded corners (10–14px).
- Colors: neutral base + one primary accent (blue/teal). Use consistent semantic colors for status badges.
- Typography: Korean-friendly sans. Clear hierarchy (H1/H2/body), legible numbers for metrics.
- Accessibility: WCAG AA contrast, keyboard focus states, form error messaging.

Layout & components
- Desktop: max content width ~1200px, 12-column grid.
- Mobile: stack sections, keep primary CTA sticky when appropriate.
- Marketplace pages: top header (logo, global search, category entry, auth/user menu).
- Dashboard pages (Doctor/Vendor/Admin): left sidebar + top bar + main content.
- Use common UI patterns: cards, tables, filter chips, stepper, file uploader, tabs, toasts, modals, empty/loading/skeleton states.

Localization
- All UI copy in Korean (labels, helper text, CTAs, empty states, errors).
- KR formats: date `YYYY.MM.DD`, currency `₩` with thousands separators.

Output format (do your best)
1) Screen title + user role + primary goal
2) Layout breakdown (sections + components)
3) Detailed UI copy (Korean)
4) Data requirements (fields needed)
5) Interaction notes (validation, sorting, filters, pagination)
6) States: loading / empty / error / success

If the tool supports code output:
- Prefer React + Tailwind CSS (utility classes), componentized structure, and semantic HTML.
```

---

## 2-1) 화면 목차(빠른 이동)

- P0(MVP): 홈/로그인/회원가입/인증상태/검색·리스트·상세/문의/찜/리뷰/파트너센터 리드/관리자 승인·카테고리·목록
- P1: 계정찾기/본인인증 UI/소셜 로그인 UI/온보딩/알림 설정/업체 비교/외부 쇼핑몰 통합검색
- P2: 리드 대화/인앱 알림 센터/헬프센터/신고/메시징(알림톡·이메일) 관리자 콘솔
- P3: 광고/결제·크레딧/정산/환불/배지 정책/리드 SLA 모니터링(관리자)
- P4: 업체 통계/SEO 템플릿/CSV Export/설정 백업·복원

---

## 3) P0 (MVP) — 핵심 화면

### P0-01. 홈 / 탐색 (Landing + Marketplace Entry)
- 대상: Guest / Doctor / Vendor
- 목적: 카테고리 진입 + 검색 시작 + 주요 신뢰 요소(리뷰/인증) 노출

```text
Design the Medihub home screen.

Must include
- Top header: logo “메디허브”, global search bar (placeholder: “업체/서비스를 검색하세요”), category dropdown entry, login/signup or user menu.
- Hero section: 1-line value prop (“병의원 개원·운영 업체를 빠르고 믿을 수 있게 찾으세요”) + big search.
- Category quick grid (대분류): 원외탕전 / 의료기기 / 인테리어 / 간판 / 전자차트 / 마케팅 / 세무·노무 / 홈페이지.
- “추천 업체” / “빠른응답 업체” sections with vendor cards (thumbnail, 업체명, 1줄소개, 별점, 후기수, 가격대, 배지).
- Trust strip: “실제 의료인 리뷰”, “인증된 업체/한의사”, “표준화된 비교”.

States
- Logged-out vs logged-in header.
- Empty 추천 데이터 시: “관심 카테고리를 선택하면 추천이 좋아져요” CTA.

Copy in Korean, modern medical SaaS style.
```

### P0-02. 로그인
- 대상: Guest
- 목적: 이메일/휴대폰 + 비밀번호 로그인(소셜/본인인증은 P1+로 분리 가능)

```text
Design a login page for Medihub.

Fields
- 아이디(이메일 또는 휴대폰 번호)
- 비밀번호

Must include
- Primary CTA: “로그인”
- Secondary links: “아이디 찾기”, “비밀번호 재설정”
- Optional: “회원가입” CTA
- Error UI: wrong password, unverified account (검수 대기/반려 상태)

Nice to have (P1+ placeholder UI)
- Social login buttons (네이버/카카오/구글) shown but can be disabled with “준비중” tag.

Include keyboard-friendly form, helper text, and concise error messaging in Korean.
```

### P0-03. 회원가입 역할 선택
- 대상: Guest
- 목적: 한의사/업체 가입 분기

```text
Design a signup role selection page.

Must include
- Two large selectable cards:
  1) “한의사로 가입” (subtitle: “업체 검색/문의/리뷰 작성”)
  2) “업체로 가입” (subtitle: “리드 수신/견적/프로필·포트폴리오 관리”)
- Each card shows key benefits + required 인증 안내 (면허증/사업자등록증).
- CTA buttons: “한의사 회원가입”, “업체 회원가입”
- Link back to login.

Add a short note: “가입 후 서류 인증 검수가 필요합니다.”
```

### P0-04. 한의사 회원가입 (일반)
- 대상: Guest → Doctor
- 필수 입력(요구사항): 아이디(이메일/휴대폰), 비밀번호/확인, 이름, 닉네임, 면허번호, 면허증 업로드
- 선택 입력: 프로필사진

```text
Design a multi-step doctor signup screen (stepper UI).

Step 1: 계정 정보
- 아이디(이메일 또는 휴대폰)
- 비밀번호 / 비밀번호 확인

Step 2: 기본 프로필
- 이름, 닉네임, 면허번호
- 생년월일(YYYY.MM.DD), 병원명
- (Optional) 관심 카테고리 선택(추천 정렬용): 체크박스/칩

Step 3: 서류 업로드
- “한의사 면허증 업로드” (drag & drop + file picker)
- “사업자등록증 업로드” (병·의원 사업자등록증)
- (Optional) 프로필 사진 업로드
- 안내문: “관리자 검수 후 이용 가능” / 예상 소요시간

Validation
- Inline errors, password rules, file type/size hints.

Success
- 가입 완료 → “인증 검수 대기” 화면으로 이동.

All copy in Korean, friendly but professional.
```

### P0-05. 업체 회원가입 (일반)
- 대상: Guest → Vendor
- 필수 입력(요구사항): 아이디(이메일/휴대폰), 비밀번호/확인, 사업자기본정보/담당자정보
- 인증 필수: 사업자등록증 업로드, 제공 서비스 카테고리, 가격대/지역 범위

```text
Design a multi-step vendor signup screen (stepper UI) for Medihub Partner.

Step 1: 계정 정보
- 아이디(이메일 또는 휴대폰)
- 비밀번호 / 비밀번호 확인

Step 2: 업체 기본정보
- 업체명, 사업자번호, 대표/담당자명, 연락처, 이메일
- 서비스 제공 범위(지역) 입력 (예: 시/도 선택 + 상세 지역)

Step 3: 서비스/가격
- 제공 서비스 카테고리 선택(대/중/소)
- 가격대: “구간형(예: 100만~300만)” 또는 “견적형(상담 후)” 선택

Step 4: 서류 업로드
- 사업자등록증 업로드
- (Optional) 포트폴리오 샘플 업로드/링크
- 안내문: “관리자 승인 후 업체 노출/리드 수신 가능”

Success
- 가입 완료 → “승인 대기” 화면 이동.

Include clear helper text and validations in Korean.
```

### P0-06. 인증 상태(대기/반려/승인) 안내
- 대상: Doctor / Vendor
- 목적: 검수 상태를 명확히 보여주고 재제출 동선을 제공

```text
Design an “인증 상태” page that can be reused for both Doctor and Vendor.

Must include
- Status header: “검수 대기중 / 승인 완료 / 반려됨”
- Timeline or step indicator (제출 → 검수 → 완료)
- If rejected: show “반려 사유” box + “서류 재제출” CTA
- If pending: show expected time + support contact/FAQ link
- If approved: show “서비스 시작하기” CTA (role-based destination)

Add a compact document checklist component:
- 제출 완료/미완료 표시, 파일 재업로드 버튼.
```

### P0-07. 카테고리/검색 결과 (업체 리스트)
- 대상: Doctor (주 사용자), Guest(일부 열람)
- 요구사항: 카테고리 트리, 필터(평점/예산/빠른응답/인증), 정렬(인기/추천/최신/응답순)

```text
Design a vendor search results screen.

Layout
- Header with global search + selected category breadcrumb (대/중/소).
- Left filter panel (desktop) / bottom sheet (mobile):
  - 평점(별점 슬라이더 or 체크)
  - 예산 구간(₩)
  - 응답 속도(“빠른응답” 토글)
  - 인증 뱃지(“인증 업체” 토글)
- Sort dropdown: 인기순 / 추천순 / 최신순 / 응답순

Results
- Vendor card list (grid or list):
  - 썸네일, 업체명, 1줄소개, 별점, 후기 수, 가격대, 배지(빠른응답/인증/AD)
  - CTA: “상세보기”, “문의하기”
- Include sponsored block: “스폰서드(AD)” clearly labeled.
- Pagination or infinite scroll + result count.

States
- Loading skeletons
- Empty results with suggestions (“필터를 줄여보세요”, “다른 키워드로 검색”)
```

### P0-08. 업체 상세
- 대상: Doctor
- 요구사항: 찜/공유, 서비스설명, 업체정보, 가격정보, 포트폴리오, 리뷰, FAQ, 문의하기 이동

```text
Design a vendor detail page.

Top section
- Thumbnail/gallery, vendor name, 1줄소개
- Badges: 빠른응답, 인증, 세금계산서(예시), AD(해당 시)
- Rating summary: 별점, 후기 수
- Actions: “찜”, “공유”, primary CTA “문의하기”

Content sections (tabs or anchored sections)
1) 서비스 소개: 상세 설명, 제공 범위, 진행 프로세스
2) 가격 정보: 구간형 표 + “견적형” 안내
3) 포트폴리오: 이미지/영상 링크, 프로젝트 규모/지역
4) 리뷰: 목록(작성자/작성일/금액/작업일/내용), 정렬, 신고 버튼
5) FAQ

Right rail (desktop)
- Quick inquiry teaser with key fields and CTA
- “응답률/평균 응답시간” metric mini-cards (if data exists)

States
- Unverified doctor: show gated CTA (“인증 후 문의 가능”) + 안내.
```

### P0-09. 문의(리드) 생성 폼
- 대상: Doctor
- 요구사항 필드: 서비스명, 이름, 연락처, 이메일, 소속, 직책, 선호 연락채널, 연락시간대, 문의내용 (+첨부)

```text
Design an inquiry (lead) creation form.

Must include
- Vendor summary card at top (업체명/카테고리/가격대)
- Form fields:
  - 서비스명(프리필), 이름, 연락처, 이메일
  - 소속(병원명 등), 직책
  - 선호 연락채널(전화/문자/카카오톡/이메일)
  - 연락 가능 시간대(드롭다운)
  - 문의내용(텍스트영역)
  - 파일 첨부(옵션): 참고자료/요청서 업로드
- Consent note: “문의가 전송되면 업체에 연락처가 전달됩니다.”
- Primary CTA: “문의 보내기”

Success state
- “문의가 접수되었습니다” + 예상 응답 시간 + “내 문의함 보기” CTA
```

### P0-10. 한의사: 내 문의함(리드 박스) 목록
- 대상: Doctor
- 요구사항: 상태(신청완료/진행중/취소/견적 대기/협의 중/계약/보류/종료), 메모, 파일, 체크리스트

```text
Design the doctor’s “내 문의함” page.

Layout
- Dashboard-style with tabs or filters by status.
- List/table cards with:
  - 업체명, 서비스명, 현재 상태 배지
  - 최근 업데이트일, 업체 응답 상태(미응답/응답)
  - Quick actions: “상세보기”, “문의 취소”(가능 상태에서), “재문의”

Detail preview
- Expandable row or side panel showing memo, attached files, checklist progress.

States
- Empty: “아직 문의가 없어요. 업체를 찾아 문의해보세요.” CTA to search.
```

### P0-11. 한의사: 문의 상세 (상태/타임라인/첨부/체크리스트)
- 대상: Doctor

```text
Design the doctor’s lead detail page.

Must include
- Header: 업체명 + 서비스명 + status badge
- Timeline: 신청 → 견적 대기/협의 → 계약/종료 (상태 이력)
- Inquiry content section (doctor submission)
- Vendor response section (quote summary if provided)
- Attachments block (upload/download)
- Checklist (custom items with 체크)
- Memo area (private notes)
- Actions:
  - “상태 변경 요청”(옵션) or “문의 취소”
  - “재문의”

Include clear empty states for “아직 업체 답변이 없습니다”.
```

### P0-12. 업체(파트너): 받은 리드함 목록
- 대상: Vendor
- 요구사항: 상태 관리, 견적 제출, 질문/답변, 체크리스트, SLA 알림(후순위 가능)

```text
Design the vendor partner “받은 리드함” list page.

Layout
- Left sidebar Partner Center navigation.
- KPI cards top: 신규 리드, 미응답, 응답률, 평균 응답시간.
- Main table with columns:
  - 리드 ID, 문의 서비스명, 고객명(한의사), 연락 선호채널, 상태, 접수일, SLA 타이머(옵션)
- Row actions: “상세보기”, “빠른 응답”, “상태 변경”

Add filters:
- 상태(신규/응답/완료), 기간, 카테고리.
```

### P0-13. 업체(파트너): 리드 상세 + 견적/응답
- 대상: Vendor

```text
Design the vendor’s lead detail screen.

Must include
- Doctor inquiry info: 요청 내용, 연락처, 선호 채널/시간
- Internal status manager: 상태 드롭다운 + 변경 기록
- Quote submission:
  - 견적 금액, 간단 코멘트
  - 견적서 PDF 업로드/다운로드
- Checklist + internal memo
- Compliance note: 개인정보/연락처 사용 안내

States
- Before responding: prominent “견적 제출/첫 답변 보내기” CTA.
```

### P0-14. 한의사: 찜(즐겨찾기) 업체 목록
- 대상: Doctor

```text
Design the doctor’s favorites page.

Must include
- Grid/list of favorited vendor cards
- Quick filters: 카테고리, 평점, 빠른응답
- Empty state: “찜한 업체가 없습니다. 마음에 드는 업체를 저장해보세요.”
```

### P0-15. 리뷰 작성/관리 (MVP: 작성 + 조회)
- 대상: Doctor

```text
Design a review creation modal/page for a vendor.

Fields
- 별점(1~5)
- 작업 금액(₩)
- 작업일(날짜)
- 내용(텍스트)

Must include
- Context summary: 업체명/서비스명
- Guidelines: “구체적으로 작성하면 다른 의료인에게 도움이 됩니다.”
- Submit success state + “업체 상세로 돌아가기”

Also design a simple “내 리뷰” list section (optional) with edit/delete as disabled placeholders.
```

### P0-16. 관리자 로그인
- 대상: Admin

```text
Design an admin login page (minimal, secure feel).

Fields
- 이메일, 비밀번호

Add security notes:
- “관리자 전용”
- Optional 2FA placeholder
```

### P0-17. 관리자: 인증 승인/반려 큐
- 대상: Admin
- 요구사항: 한의사/업체 인증 검수, 승인/반려, 반려 사유 템플릿(후순위)

```text
Design the admin verification queue screen.

Must include
- Tabs: “한의사 인증”, “업체 인증”
- Table with: 신청일, 이름/업체명, 제출 서류(미리보기), 상태(pending/approved/rejected)
- Detail drawer:
  - 제출 데이터(면허번호/생년월일/병원명 or 사업자번호/담당자/카테고리/지역/가격대)
  - 업로드 문서 미리보기
  - Actions: “승인”, “반려”
  - 반려 사유 입력(템플릿 선택 + 직접 입력)
- Audit note: “결정은 감사 로그에 기록됩니다.”
```

### P0-18. 관리자: 카테고리 CRUD
- 대상: Admin

```text
Design an admin category management screen for a 3-level category tree (대/중/소).

Must include
- Tree view with expand/collapse
- Create/edit/delete actions
- Fields: 카테고리명, 상위카테고리, 정렬순서
- Safety UI: delete confirmation, “하위 카테고리 존재” 경고
```

### P0-19. 한의사: 마이페이지 대시보드
- 대상: Doctor
- 요구사항: 진행 중 리드 수, 대기중 견적 수, 최근 응답, 즐겨찾기 업체, 알림 설정

```text
Design the doctor’s My Page dashboard.

Must include
- Summary widgets:
  - 진행 중 리드 수
  - 견적 대기 중
  - 최근 응답(최근 7일)
  - 즐겨찾기 업체 수
- “최근 문의” 리스트 (업체명/서비스명/상태/최근 업데이트)
- Quick settings card: 알림 설정 바로가기
- Profile completion (optional P1-ready): “프로필 완성도 80%” + missing items checklist

Use a calm, data-forward layout with clear hierarchy.
```

### P0-20. 한의사: 내 프로필(수정) + 인증 정보
- 대상: Doctor

```text
Design a doctor profile edit page.

Sections
1) 계정 정보: 아이디(읽기전용), 비밀번호 변경(별도 모달), 연락처
2) 기본 프로필: 이름, 닉네임, 병원명, 프로필 사진
3) 인증 정보: 면허번호, 생년월일, 제출 서류(면허증/사업자등록증) + 상태(대기/승인/반려)

Must include
- Inline validation + “저장” CTA
- If documents change: show “재검수 필요” warning
```

### P0-21. 업체(파트너): 프로필 관리(기본정보/서비스 소개/가격)
- 대상: Vendor
- 요구사항: 업체 기본 정보, 서비스 소개, 가격 정책(구간/견적형), 서비스 제공 범위

```text
Design a vendor partner “프로필 관리” screen.

Must include
- Sections (tabbed):
  1) 업체 기본 정보: 업체명/사업자번호/담당자/연락처/이메일, 가입일/승인일(읽기)
  2) 서비스 소개: 서비스 범위, 강점, 진행 프로세스
  3) 제공 범위: 지역 설정(시/도 + 상세)
  4) 가격 정책: 구간형(테이블) vs 견적형(설명) 선택 + 대표 가격대 표시(리스트 카드용)
  5) 카테고리 선택(대/중/소)

Add preview panel (optional): “업체 리스트 카드 미리보기”.
```

### P0-22. 업체(파트너): 포트폴리오 관리
- 대상: Vendor
- 요구사항: 이미지/링크 등록, 전·후 사진/동영상 링크, 프로젝트 규모/지역, 리뷰 연결

```text
Design a portfolio management screen for vendors.

Must include
- Portfolio list with thumbnails + key metadata (프로젝트명/규모/지역/작성일)
- “포트폴리오 추가” CTA
- Add/Edit form:
  - 제목, 설명, 프로젝트 규모, 지역, 작업 기간
  - 이미지 업로드(전/후 구분), 동영상 링크, 외부 링크
  - (Optional) 연결된 리뷰 선택
- Empty state with examples of 좋은 포트폴리오 작성 가이드.
```

### P0-23. 업체(파트너): 리뷰 관리(받은 리뷰/대응)
- 대상: Vendor

```text
Design a vendor review management screen.

Must include
- List of received reviews with: 별점, 코멘트, 작성일, (가능하면) 서비스/금액
- Actions:
  - “답글 작성”(public reply) UI
  - “허위 리뷰 신고/이의제기” flow entry
- Small insights widget: 평균 평점, 최근 30일 리뷰 수
```

### P0-24. 관리자: 사용자/업체 목록(최소 운영)
- 대상: Admin

```text
Design a basic admin directory for users and vendors.

Must include
- Tabs: 사용자(한의사) / 업체
- Search + filters: 상태(활성/정지), 인증 상태(대기/승인/반려)
- Table columns:
  - 사용자: 이름/닉네임/아이디/면허번호/인증상태/가입일
  - 업체: 업체명/사업자번호/담당자/카테고리/인증상태/가입일
- Row actions: 상세 보기, 상태 변경(정지/해제)
```

---

## 4) P1 (전환/신뢰 개선) — 확장 화면

### P1-01. 아이디 찾기

```text
Design an “아이디 찾기” page.

Flow
- 이름 + 휴대폰 본인인증(placeholder) → 가입된 아이디(이메일/휴대폰) 안내

Must include
- Clear privacy messaging (마스킹 처리: j***@domain.com)
- CTA: “로그인하기”, “비밀번호 재설정”
```

### P1-02. 비밀번호 재설정

```text
Design a “비밀번호 재설정” flow.

Step 1
- 아이디 입력 + 휴대폰 인증(placeholder)

Step 2
- 새 비밀번호 / 새 비밀번호 확인
- Password rules + strength hint

Success state
- “비밀번호가 변경되었습니다” + 로그인 CTA
```

### P1-03. 휴대폰 본인인증(모듈 연동 전 UI)

```text
Design a phone verification step UI (PASS/통신사 인증 모듈 연동 전).

Must include
- 안내: “본인확인을 위해 휴대폰 인증이 필요합니다.”
- CTA: “휴대폰 인증 시작”
- After success: show verified badge + result summary (이름/통신사/인증시간)
```

### P1-04. 소셜 로그인/가입 버튼 패턴

```text
Design a consistent social auth component for Naver/Kakao/Google.

Must include
- Button styles per provider + icon
- Copy: “네이버로 계속하기”, “카카오로 계속하기”, “Google로 계속하기”
- Fallback: “또는 이메일로 계속하기”
- Error states: canceled login, missing email, duplicated account 안내
```

### P1-05. 온보딩: 관심 카테고리 선택(추천 기반)

```text
Design a first-time onboarding screen for doctors to select 관심 카테고리.

Must include
- Multi-select chips with categories
- “나중에 할게요” link
- Note: “선택한 관심사는 추천 정렬에 반영됩니다.”
```

### P1-06. 알림 설정(채널/유형)

```text
Design a notification settings page.

Must include
- Channels toggles: 카카오 알림톡 / 이메일 / 웹 알림
- Notification types: 가입/비번재설정/리드 알림/상태변경/환불/결제
- Save action + success toast
```

### P1-07. 업체 비교(다나와식 비교)

```text
Design a “업체 비교” screen for 2~4 vendors.

Must include
- Compare table: 가격대, 응답률/응답시간, AS 정책(placeholder), 포트폴리오 수, 평점/리뷰수, 제공 지역, 배지
- Sticky header with vendor cards
- CTA per vendor: “문의하기”

Include an “add vendor to compare” search within the screen.
```

### P1-08. 소모품/외부 쇼핑몰 통합검색(베타)

```text
Design a “소모품 통합검색(베타)” screen.

Must include
- Search bar + category chips
- Results aggregated by shop (cards with shop name + product list preview)
- Product rows: 이미지, 상품명, 가격, 배송, 링크(외부)
- Disclaimer: “외부 쇼핑몰로 이동합니다.”
```

---

## 5) P2 (메시징/고객지원/운영) — 확장 화면

### P2-01. 리드 Q&A 스레드(대화)

```text
Design a lead-based chat/Q&A thread UI.

Must include
- Message timeline with read receipts
- File attachments (upload/download)
- System messages for status changes (“견적이 제출되었습니다”)
- Admin visibility note (optional)

Integrate this as a tab inside lead detail (Doctor + Vendor).
```

### P2-02. 알림 센터(인앱) + 읽음 처리

```text
Design an in-app notification center.

Must include
- Notification list with categories:
  - 리드 수신/답변/상태변경
  - 승인/반려
  - 결제/환불(해당 시)
- Each item: icon, title, short preview, timestamp, unread indicator
- Actions: “모두 읽음”, 개별 읽음, 필터(미읽음만)
- Deep links to the relevant screen (lead detail, verification, billing)

States
- Empty: “새 알림이 없습니다.”
```

### P2-03. 헬프센터(FAQ/공지)

```text
Design a Help Center screen.

Must include
- Search bar
- Categories: FAQ / 공지 / 이용가이드
- Article list with tags
- Article detail page layout (breadcrumb, last updated, related articles)
```

### P2-04. 신고/제재 플로우(리뷰/업체)

```text
Design a report flow modal.

Must include
- Reason selection (허위/욕설/광고/기타)
- Evidence attachment (optional)
- Confirmation + “접수되었습니다” state
```

### P2-05. 관리자: 통합 메시징(알림톡/이메일) 템플릿/로그

```text
Design an admin messaging console.

Must include
- Channels settings:
  - 카카오 알림톡(템플릿 관리), 이메일(SMTP 설정)
- Scenarios matrix:
  - 가입, 비밀번호 재설정, 리드 알림, SLA 임박/위반, 환불, 결제
  - 각 시나리오별 활성/비활성 토글 + 템플릿 선택
- Delivery logs:
  - 발송일시, 채널, 수신자, 시나리오, 성공/실패, 재시도 횟수
- Audit log note: 설정 변경 기록이 남아야 함
```

### P2-06. 관리자: 리뷰 관리(품질/신고/블라인드/복구)

```text
Design an admin review moderation screen.

Must include
- Review table with: 업체, 작성자(마스킹), 별점, 작성일, 신고 수, 현재 상태(노출/블라인드/삭제)
- Filters: 신고됨만, 금칙어 탐지, 평점 조작 의심(placeholder)
- Actions:
  - “임시 블라인드”, “복구”, “삭제”, “제재”
  - Decision reason input + templated reasons
- Detail drawer: review content + report history + related lead (if any)

Include a clear “moderation policy” sidebar note.
```

### P2-07. 관리자: 신고 처리/제재 이력

```text
Design an admin report handling workflow.

Must include
- Pipeline stages: 접수 → 임시 블라인드 → 심사 → 제재/기각
- Case detail view:
  - 신고 사유/증거, 관련 대상(업체/리뷰/메시지)
  - 조치 선택(경고/정지/영구정지 등) + 기간 설정
  - 이력/감사 로그 자동 기록 안내
```

### P2-08. 관리자: FAQ/공지(헬프센터) 문서 관리

```text
Design an admin CMS-like screen for Help Center documents.

Must include
- Document list with: 유형(FAQ/공지/가이드), 제목, 공개여부, 최종수정일
- CRUD: 생성/수정/삭제, 미리보기, 게시 예약(placeholder)
- Search + tags
- Optional: “검색 로그 기반 추천”은 placeholder로 표시
```

---

## 6) P3 (수익화/광고/정산) — 확장 화면

### P3-01. 업체: 광고/우선노출 신청(캠페인)

```text
Design a vendor “광고/우선노출” campaign application screen.

Must include
- Slot selection (카테고리 상단 스폰서드 등)
- 기간/예산 입력
- 예상 노출/리드(placeholder) + 비용 요약
- UTM 설정(advanced accordion)
- Submit + status tracking (심사중/승인/반려)
```

### P3-02. 업체: 크레딧 충전/결제 내역

```text
Design a billing screen for vendors.

Must include
- Current credit balance
- Top-up options (preset amounts) + payment method placeholder
- Payment history table
- Tax invoice download UI (세금계산서)
```

### P3-03. 관리자: 광고 슬롯/캠페인 관리

```text
Design admin screens for ad slot and campaign management.

Slots
- 위치별 슬롯 수, 고정/랜덤/로테이션, 회전 간격

Campaigns
- 기간/예산, 카테고리 타깃, 신규회원 타깃
- Policy: 광고/유기 혼합 비율, AD 표기

Include audit logs and safe publish controls.
```

### P3-04. 관리자: 요금제/과금/정산 리포트

```text
Design an admin billing & settlement console.

Must include
- 요금제(정액형/CPC/CPM/CPL) 단가/한도 설정
- 월별 청구/입금/미수 리포트 + CSV export
- Lead 과금(실시간 리드 수/예정 금액)
```

### P3-05. 환불/보상(정책 엔진 + 심사 큐)

```text
Design refund/compensation screens.

Policy engine
- Rules for “무응답/허위 리드” (time, verification failure, etc.)
- Auto refund (credit return) settings

Review queue
- Exception cases with decision logging
- Templates for notification messages
```

### P3-06. 관리자: 배지/라벨 정책 관리

```text
Design an admin screen to manage badges/labels.

Badges examples
- 빠른응답, 세금계산서, 프라임

Must include
- Badge list with color, icon, eligibility rules (조건식/설명)
- Rule editor (simple for MVP): manual toggle + notes
- Preview on vendor card
- Safe rollout: “적용 시작일”, “일괄 적용/해제” confirmation
```

### P3-07. 관리자: 리드 모니터링(SLA) + 대화 열람

```text
Design an admin lead monitoring dashboard for SLA tracking.

Must include
- Funnel stages: 접수 → 응답 → 견적 → 계약
- SLA timers and “임박/위반” filter
- Ability to open a lead detail in read-only mode:
  - status history, messages thread, attachments, logs
- Automation panel (read-only summary): 환불/패널티 규칙 적용 여부
```

---

## 7) P4 (데이터/마케팅/외부연동) — 확장 화면

### P4-01. 통계/리포트(업체)

```text
Design a vendor analytics dashboard.

Must include
- Metrics: 노출수, 클릭수, 리드수, 리뷰수/평점, CTR, 전환율
- Date range picker + day/week/month comparison
- ROI calculation (CPC/CPL 기준)
- Campaign breakdown + CSV/PDF export
```

### P4-02. SEO/메타/OG 템플릿 관리(관리자)

```text
Design an admin SEO settings page.

Must include
- Templates for category/vendor pages: title, description, OG image
- Preview card (검색 결과/카톡 공유 미리보기 느낌)
- Safe publishing + versioning (optional)
```

### P4-03. CSV Export + 설정 백업/복원(관리자)

```text
Design admin utilities screens.

CSV Export
- Entities: 회원/업체/리드/정산/캠페인
- Filters, export history, download links

Backup points
- Create snapshot of settings (categories/policies)
- Restore flow with warnings and diff preview
```
