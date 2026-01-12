# Medihub - Product Requirements Document

## 1. Executive Summary

**Medihub(메디허브)**는 한의사와 의료 관련 업체를 연결하는 B2B 매칭 플랫폼입니다. "의료계의 크몽"을 표방하며, 의료기관 개원 및 운영에 필요한 다양한 업체(원외탕전, 의료기기, 인테리어, 간판, 전자차트, 마케팅, 세무/노무 등)를 한 곳에서 검색, 비교, 문의할 수 있는 통합 서비스를 제공합니다.

**핵심 가치**: 파편화된 의료 B2B 정보를 표준화하고, 신뢰할 수 있는 업체 매칭 환경을 구축하여 의료인과 의료산업의 동반 성장을 지원합니다.

**MVP 목표**: 회원가입/로그인, 업체 검색/상세, 문의(리드) 생성/관리, 찜, 리뷰, 관리자 승인 기능을 갖춘 최소 기능 제품 출시.

---

## 2. Mission & Vision

### Mission
> 의료인과 의료산업을 가장 빠르고 정확하게 연결하는 표준 플랫폼

### Vision
- **동반 성장**: 의료인과 산업이 함께 발전하는 선순환
- **신뢰**: 의료인과 산업 모두가 안심할 수 있는 기반
- **지속 가능성**: 오늘의 성과가 내일로 이어지는 건강한 구조

### Core Principles
1. **정보 표준화** - 업체별 가격, 스펙, 포트폴리오, AS 정책을 표준화
2. **신뢰 기반** - 실제 이용자 리뷰를 통한 신뢰성 확보
3. **단순한 UX** - 복잡한 비교/문의 과정을 직관적으로 간소화
4. **데이터 기반** - 축적된 데이터로 더 나은 추천과 인사이트 제공

---

## 3. Target Users

### Primary Persona 1: 한의사 (Doctor)
- **Who**: 개원 준비 중이거나 운영 중인 한의사
- **Pain Points**:
  - 인테리어, 의료기기 업체 정보 파편화
  - 신뢰할 수 있는 정보 부재 (광고성 블로그만 노출)
  - "쪽지 주세요", "지인 소개" 방식의 비효율적 정보 수집
- **Goals**:
  - 빠르고 효율적인 업체 비교/검색
  - 실제 사용자 리뷰 기반 신뢰할 수 있는 선택
  - 간편한 견적 문의

### Primary Persona 2: 업체 (Vendor)
- **Who**: 의료기관에 서비스/제품을 제공하는 B2B 업체
- **Pain Points**:
  - 잠재 고객(의료인) 접근 어려움
  - 마케팅 채널 부족
  - 신뢰 구축의 어려움
- **Goals**:
  - 검증된 의료인 고객 확보
  - 포트폴리오/서비스 노출
  - 효율적인 리드 관리

---

## 4. MVP Scope

### In Scope (MVP)

#### 회원/인증
- [x] 일반 회원가입 (이메일/비번)
- [x] 한의사 프로필 입력 + 면허증 업로드 (검수 대기)
- [x] 사업자 회원가입 + 사업자등록증 업로드 (검수 대기)
- [x] 로그인/로그아웃
- [ ] 비밀번호 재설정 (P1)
- [ ] 소셜 로그인 (P1)

#### 업체 검색/리스트/상세
- [x] 카테고리 트리 (대/중/소)
- [x] 키워드 검색
- [x] 필터 (가격/평점)
- [x] 정렬 (최신/평점순)
- [x] 업체 리스트 (카드 형태)
- [x] 업체 상세 (포트폴리오/가격/FAQ/리뷰)
- [x] 찜 기능

#### 리드/문의
- [x] 문의 생성 폼 (필수 입력 + 첨부)
- [x] 한의사 "내 문의함" (상태/취소)
- [x] 업체 "받은 리드함" (상태 관리/응답)
- [ ] Q&A 스레드 (P2)

#### 리뷰/평점
- [x] 리뷰 작성 (별점 + 내용)
- [x] 리뷰 조회
- [ ] 리뷰 사진 업로드

#### 관리자 (MVP)
- [x] 인증 승인/반려 큐
- [x] 사용자/업체 목록
- [x] 카테고리 CRUD

### Out of Scope (Post-MVP)

#### P1 (계정/신뢰/전환 개선)
- [ ] 비밀번호 재설정
- [ ] 소셜 로그인 (카카오/구글)
- [ ] 알림 (이메일)
- [ ] 온보딩/프로필 완성도
- [ ] 약관/동의
- [ ] SEO 기본
- [ ] 리뷰 고도화 (정렬/신고)
- [ ] Rate limit / 스팸 방지

#### P2 (알림/메시징/고객지원)
- [ ] 통합 메시징 (카카오 알림톡/이메일)
- [ ] 리드 Q&A 스레드
- [ ] 리드 상태 자동화
- [ ] 신고/제재
- [ ] FAQ/공지
- [ ] 고객지원 (헬프데스크)

#### P3 (수익화)
- [ ] TossPayments 결제 연동
- [ ] 티어/요금제
- [ ] 크레딧/정산
- [ ] 광고/우선노출

#### P4 (데이터/성장)
- [ ] 관리자 대시보드/통계
- [ ] GA4/Tag Manager
- [ ] 지도/주소 연동

#### Future
- [ ] 임상 케이스 DB
- [ ] AI 진료 보조

---

## 5. Core Features

### 5.1 회원 관리

**Purpose**: 사용자 가입, 인증, 권한 관리

**User Roles**:
| Role | Description | Permissions |
|------|-------------|-------------|
| admin | 플랫폼 관리자 | 모든 권한, 승인/제재 |
| doctor | 한의사 회원 | 업체 검색, 문의, 리뷰 작성 |
| vendor | 업체 회원 | 프로필 관리, 리드 응답 |
| guest | 비회원 | 업체 목록 조회만 |

**한의사 인증 플로우**:
1. 회원가입 (이메일/비번/기본정보)
2. 면허증 업로드 + 면허번호 입력
3. 상태: `pending` → 관리자 검수
4. 승인: `approved` → 전체 기능 사용 가능
5. 반려: `rejected` + 사유 안내

**업체 인증 플로우**:
1. 사업자 회원가입
2. 사업자등록증 업로드 + 담당자 정보
3. 상태: `pending` → 관리자 검수
4. 승인 후 프로필 공개

### 5.2 업체 검색 & 상세

**카테고리 트리**:
```
원외탕전
의료기기
  ├── 혈액검사기
  ├── 비만관리기
  └── ...
인테리어
간판
전자차트
마케팅
세무/노무
홈페이지
```

**업체 리스트 카드**:
- 썸네일
- 업체명
- 1줄 소개
- 별점 + 후기 수
- 가격대
- 빠른응답 배지

**업체 상세 페이지**:
- 카테고리 트리
- 업체 기본 정보
- 서비스 설명 (상세페이지)
- 가격 정보
- 포트폴리오
- 리뷰 목록
- 문의하기 버튼
- FAQ

### 5.3 리드/문의

**문의 생성 필드**:
- 서비스명
- 이름, 연락처, 이메일
- 소속, 직책
- 선호 연락 채널
- 연락 시간대
- 문의 내용
- 첨부 파일

**리드 상태**:
```
submitted → contacted → in_progress → quote_sent → negotiating → contracted → on_hold → closed → cancelled
```

**한의사 "내 문의함"**:
- 문의 목록 + 상태
- 상세 보기
- 취소

**업체 "받은 리드함"**:
- 받은 문의 목록
- 상태 변경
- 메모
- 견적 제출

### 5.4 리뷰/평점

**리뷰 작성**:
- 별점 (1-5)
- 내용
- (선택) 사진

**리뷰 조회**:
- 업체 상세 페이지에서 조회
- 평균 평점 표시
- 정렬: 최신순 / 평점순

### 5.5 관리자

**승인 큐**:
- 대기 중인 한의사/업체 인증 목록
- 승인/반려 + 사유

**사용자 관리**:
- 회원 목록 (검색/필터)
- 상태 변경

**카테고리 관리**:
- CRUD (생성/조회/수정/삭제)
- 대/중/소 트리 구조

---

## 6. Technical Architecture

### High-Level Architecture
```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐
│                 │ ◄───────────────► │                 │
│  Next.js App    │                    │  API Routes     │
│  (Frontend)     │                    │  (BFF)          │
│  Port 3000      │                    │                 │
└─────────────────┘                    └────────┬────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │    Supabase     │
                                       │  (PostgreSQL)   │
                                       │  (Auth/Storage) │
                                       └─────────────────┘
```

### Database Schema (핵심 테이블)

```sql
-- Source of truth: 실제 컬럼/제약/정책은 마이그레이션 SQL을 따른다.
-- app/supabase/migrations/**.sql

profiles
doctor_verifications
vendor_verifications
categories
vendors
vendor_categories
vendor_portfolios
vendor_portfolio_assets
leads
lead_status_history
lead_attachments
reviews
favorites
recent_views
files
audit_logs
```

### API Design

**Auth/Me**:
- `GET /api/me` - 내 정보
- `POST /api/profile` - 프로필 생성
- `PATCH /api/profile` - 프로필 수정

**Verification**:
- `GET/POST /api/doctor/verification` - 한의사 인증
- `GET/POST /api/vendor/verification` - 업체 인증

**Vendor**:
- `GET /api/vendors` - 업체 리스트
- `GET /api/vendors/:id` - 업체 상세
- `GET/POST/PATCH /api/vendors/me` - 내 업체 관리

**Lead**:
- `POST /api/leads` - 문의 생성
- `GET /api/leads` - 문의 목록
- `GET /api/leads/:id` - 문의 상세
- `PATCH /api/leads/:id/status` - 상태 변경

**Review/Favorite**:
- `POST /api/favorites/toggle` - 찜 토글
- `GET /api/favorites` - 찜 목록
- `POST /api/reviews` - 리뷰 작성
- `GET /api/vendors/:id/reviews` - 업체 리뷰

**Admin**:
- `GET /api/admin/verifications` - 승인 큐
- `POST /api/admin/verifications/:id/approve` - 승인
- `POST /api/admin/verifications/:id/reject` - 반려
- `GET /api/admin/users` - 사용자 목록
- `GET /api/admin/vendors` - 업체 목록
- `POST/PATCH/DELETE /api/admin/categories` - 카테고리 관리

---

## 7. Success Criteria

### MVP Success Definition

MVP는 다음을 수행할 수 있을 때 성공:
1. 한의사가 회원가입하고 면허 인증을 받을 수 있다
2. 업체가 회원가입하고 프로필을 등록할 수 있다
3. 한의사가 업체를 검색하고 상세 정보를 볼 수 있다
4. 한의사가 업체에 문의를 보낼 수 있다
5. 업체가 문의를 받고 응답할 수 있다
6. 관리자가 가입 승인/반려를 처리할 수 있다

### Functional Requirements
- ✅ 회원가입/로그인/로그아웃
- ✅ 한의사/업체 인증 프로세스
- ✅ 업체 검색/필터/정렬
- ✅ 업체 상세 조회
- ✅ 문의 생성 및 관리
- ✅ 리뷰 작성/조회
- ✅ 찜 기능
- ✅ 관리자 승인/반려

### Quality Indicators
- 페이지 로드 2초 이내
- 모바일 반응형 지원
- 데이터 손실 없음

---

## 8. Implementation Phases

### Phase 0: 환경 설정 ✅
- Supabase 프로젝트 설정
- Next.js 프로젝트 구조
- 기본 인증 설정

### Phase 1: 인증/회원 ✅
- 회원가입/로그인
- 프로필 관리
- 한의사/업체 인증 제출

### Phase 2: 업체 기능 ✅
- 카테고리 트리
- 업체 리스트/상세
- 검색/필터/정렬
- 찜 기능

### Phase 3: 리드 기능 ✅
- 문의 생성
- 문의함 (한의사/업체)
- 상태 관리

### Phase 4: 리뷰/관리자 ✅
- 리뷰 작성/조회
- 관리자 승인 큐
- 사용자/카테고리 관리

### Phase 5: 안정화 (진행 중)
- 버그 수정
- 성능 최적화
- 모바일 최적화

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **데이터 보안** | 개인정보 유출 | RLS 철저히 적용, 서버사이드 검증 |
| **스팸/어뷰징** | 서비스 품질 저하 | Rate limit, 신고 기능, 인증 필수화 |
| **느린 검색** | UX 저하 | 인덱스 최적화, 캐싱 |
| **업체 품질** | 신뢰도 하락 | 인증 절차, 리뷰 시스템, 운영 모니터링 |

---

## 10. Appendix

### 시드 카테고리
- 원외탕전
- 의료기기
- 인테리어
- 간판
- 전자차트
- 마케팅
- 세무/노무
- 홈페이지
- 기타

### 리드 상태 전이
```
submitted (신청완료)
  ↓
contacted (연락완료)
  ↓
in_progress (진행중)
  ↓
quote_sent (견적전송)
  ↓
negotiating (협의중)
  ↓
contracted (계약완료) | on_hold (보류) | closed (종료) | cancelled (취소)
```

### Key Dependencies
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hook Form Documentation](https://react-hook-form.com/)
