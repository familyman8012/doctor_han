# PRD: Onboarding & Profile Completion

> Status: Ready | Last updated: 2026-01-17 | Owner: spec-writer
> SSOT: 이 문서 + TODO(구현 후 코드 경로 링크)

## 1) 배경/문제

- 신규 사용자(doctor/vendor)가 가입 후 다음 행동(프로필 작성/인증 제출/첫 문의)을 어디서 시작해야 할지 명확한 가이드가 없음
- 현재 `GET /api/me` 응답에 `onboardingRequired` 필드가 존재하지만, 프로필 생성 필요 여부만 표시할 뿐 역할별 온보딩 퍼널이 정의되지 않음
- 프로필 완성도를 확인할 방법이 없어, 사용자가 누락된 정보를 인지하지 못하고 인증 반려/리드 응답 지연으로 이어짐
- 완성도가 낮은 프로필은 매칭 품질 저하 및 플랫폼 신뢰도 하락을 유발함

## 2) 목표(Goals)

- G1: 역할별(doctor/vendor) 온보딩 퍼널을 정의하고, 신규 사용자가 핵심 행동(인증/프로필/첫 리드)에 도달하도록 유도
- G2: 프로필 완성도를 계산하고, 사용자에게 체크리스트 형태로 누락 항목을 시각화
- G3: 온보딩 상태를 저장하여, 중단된 퍼널을 재개할 수 있도록 지원
- G4: 프로필 완성도 기준을 역할별로 명확히 정의하고, 완성도에 따라 UI 배너/알림으로 행동 유도

## 3) 비범위(Non-goals)

- NG1: 온보딩 퍼널 A/B 테스트/최적화(P2+)
- NG2: 프로필 완성도 기반 검색 노출 우선순위/리드 매칭 가중치(P2+)
- NG3: 온보딩 중 이탈 시 이메일/푸시 리타게팅(P2+)
- NG4: Admin이 온보딩 현황을 대시보드로 확인하는 기능(P2+)
- NG5: 역할 변경(doctor ↔ vendor) 시 온보딩 상태 마이그레이션(YAGNI)

## 4) 사용자/역할

- `doctor`: 한의사 - 인증 제출 → 업체 탐색/찜 → 첫 문의
- `vendor`: 업체 - 프로필/포트폴리오 작성 → 인증 제출 → 리드 응답
- `guest`: 비회원 - 온보딩 대상 아님(기존 업체 목록 조회만)
- `admin`: 관리자 - 온보딩 대상 아님

## 5) 사용자 시나리오

### UC-1: 한의사(doctor) 온보딩
1. 한의사가 가입(이메일/소셜) 완료 후 로그인
2. 시스템이 프로필 미생성 상태(`onboardingRequired: true`)를 감지
3. 온보딩 모달/페이지 표시: "프로필 작성 → 면허 인증 제출 → 업체 탐색" 퍼널 안내
4. 한의사가 프로필 기본 정보(이름/전화번호/주소) 입력
5. 온보딩 상태 업데이트: `profile_created: true`
6. 면허 인증 서류 업로드 안내 배너 표시
7. 한의사가 면허 이미지 업로드 및 제출
8. 온보딩 상태 업데이트: `verification_submitted: true`
9. 업체 목록 탐색 및 첫 찜/문의 유도 배너 표시
10. 한의사가 첫 문의 생성
11. 온보딩 상태 업데이트: `first_lead_created: true`
12. 온보딩 완료 처리, 이후 배너 숨김

### UC-2: 업체(vendor) 온보딩
1. 업체가 가입 완료 후 로그인
2. 시스템이 프로필 미생성 상태 감지
3. 온보딩 모달/페이지 표시: "프로필 작성 → 포트폴리오 추가 → 사업자 인증 제출 → 리드 응답" 퍼널 안내
4. 업체가 프로필 기본 정보(업체명/카테고리/연락처/주소) 입력
5. 온보딩 상태 업데이트: `profile_created: true`
6. 포트폴리오 이미지/소개 추가 안내 배너 표시
7. 업체가 포트폴리오 이미지 1개 이상 업로드
8. 온보딩 상태 업데이트: `portfolio_added: true`
9. 사업자등록증 인증 제출 안내 배너 표시
10. 업체가 사업자등록증 이미지 업로드 및 제출
11. 온보딩 상태 업데이트: `verification_submitted: true`
12. 첫 리드 응답 유도 배너 표시(리드 수신 시)
13. 업체가 첫 리드에 응답
14. 온보딩 상태 업데이트: `first_lead_responded: true`
15. 온보딩 완료 처리

### UC-3: 프로필 완성도 확인
1. 사용자(doctor/vendor)가 마이페이지 진입
2. 상단에 프로필 완성도 진행바(예: 75%) + 체크리스트 표시
   - doctor 예시: "✅ 프로필 작성 완료 / ✅ 면허 인증 제출 완료 / ❌ 첫 문의 미생성"
   - vendor 예시: "✅ 프로필 작성 완료 / ✅ 포트폴리오 추가 완료 / ❌ 사업자 인증 미제출 / ❌ 리드 응답 미생성"
3. 사용자가 체크리스트 항목 클릭 시 해당 페이지로 이동(예: 인증 제출 페이지)
4. 누락 항목 완료 시 프로필 완성도 업데이트 및 체크리스트 갱신

## 6) 요구사항(Functional)

### R1: 온보딩 퍼널 정의(역할별)

#### doctor 퍼널
1. 프로필 작성(필수): `profile_created`
2. 면허 인증 제출(필수): `verification_submitted`
3. 첫 문의 생성(권장): `first_lead_created`

#### vendor 퍼널
1. 프로필 작성(필수): `profile_created`
2. 포트폴리오 추가(권장): `portfolio_added` (이미지 1개 이상)
3. 사업자 인증 제출(필수): `verification_submitted`
4. 첫 리드 응답(권장): `first_lead_responded`

### R2: 프로필 완성도 계산 규칙

#### 체크리스트 아이템 status enum

```typescript
type ChecklistItemStatus =
  | 'completed'       // 완료됨
  | 'pending'         // 미완료 (사용자 행동 필요)
  | 'waiting'         // 대기중 (admin 승인 등, 사용자 행동 불가)
  | 'not_applicable'; // 해당 없음 (조건 미충족으로 분모에서 제외)
```

#### 조건부 분모 규칙

> 100% 도달이 사용자 행동만으로 불가능한 항목은 분모에서 제외하여 100% 달성 가능하게 함.

- `waiting` 상태 항목: 분모에서 제외 (예: 인증 제출 후 승인 대기중)
- `not_applicable` 상태 항목: 분모에서 제외 (예: vendor 리드 0건이면 "첫 리드 응답" 항목 제외)

```typescript
// 완성도 계산
const applicableItems = checklist.filter(item =>
  item.status !== 'waiting' && item.status !== 'not_applicable'
);
const maxPoints = applicableItems.reduce((sum, item) => sum + item.maxPoints, 0);
const earnedPoints = applicableItems.filter(i => i.completed).reduce((sum, i) => sum + i.points, 0);
const score = Math.round((earnedPoints / maxPoints) * 100);
```

#### doctor 완성도 체크리스트

| key | label | points | 조건 | status 로직 |
|-----|-------|--------|------|-------------|
| `profile_created` | 프로필 작성 | 20점 | `profiles` 존재 + `displayName`, `phone` 입력 | completed/pending |
| `verification_submitted` | 면허 인증 제출 | 40점 | `doctor_verifications` 존재 | completed/pending |
| `verification_approved` | 면허 인증 승인 | 20점 | `status = 'approved'` | completed/**waiting**(pending 상태)/pending(미제출) |
| `first_lead_created` | 첫 문의 생성 | 20점 | `leads.doctor_user_id = 본인` 1건+ | completed/pending |

- **총점: 100점** (조건부 분모 적용 시 달라질 수 있음)

#### vendor 완성도 체크리스트

| key | label | points | 조건 | status 로직 |
|-----|-------|--------|------|-------------|
| `profile_created` | 프로필 작성 | 15점 | `profiles` 존재 + `displayName`, `phone` 입력 | completed/pending |
| `vendor_info_added` | 업체 정보 추가 | 15점 | `vendors` + `name`, `description`, `regionPrimary` + `vendor_categories` 1건+ | completed/pending |
| `portfolio_added` | 포트폴리오 추가 | 20점 | `vendor_portfolios` + `vendor_portfolio_assets` 1건+ | completed/pending |
| `verification_submitted` | 사업자 인증 제출 | 30점 | `vendor_verifications` 존재 | completed/pending |
| `verification_approved` | 사업자 인증 승인 | 10점 | `status = 'approved'` | completed/**waiting**(pending 상태)/pending(미제출) |
| `first_lead_responded` | 첫 리드 응답 | 10점 | vendor 소유 `leads` + `status != 'submitted'` | completed/pending/**not_applicable**(리드 0건) |

- **총점: 100점** (조건부 분모 적용 시 달라질 수 있음)

### R3: 온보딩 상태 저장 방식 ✅ 결정 완료

**결정: 단순화된 `user_onboarding_steps` 테이블**

> 스텝 완료 여부는 런타임 계산(R4)으로 통일. 테이블은 "사용자 의사 표현"만 저장.

```sql
CREATE TABLE user_onboarding_steps (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  skipped_at timestamptz,          -- "나중에 하기" 클릭 시점
  completed_at timestamptz,        -- 온보딩 완료 처리 시점
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

- 선택 이유:
  - 스텝 boolean 필드 제거로 "진실의 원천" 단일화 (런타임 계산만 사용)
  - 테이블 write path 불필요 (사용자 의사 표현만 저장)
  - `skipped_at`: "나중에 하기" 클릭 시 현재 시간 저장
  - `completed_at`: 필수 스텝 모두 완료 시 자동 설정

### R4: 프로필 완성도 저장 방식 ✅ 결정 완료

**결정: 옵션 A - 런타임 계산 (저장 없음)**

- `GET /api/me` 호출 시 매번 완성도 계산
- 선택 이유: MVP 구현 단순화, 사용자 수 적음, 항상 최신 상태 반영

### R5: API 계약 ✅ 결정 완료

**결정: 옵션 A - `GET /api/me` 확장**

기존 응답에 `onboarding`, `profileCompletion` 필드 추가:

```typescript
{
  user: {...},
  profile: {...},
  doctorVerification: {...} | null,
  vendorVerification: {...} | null,
  onboardingRequired: false,  // 프로필 미생성 여부 (기존 유지)
  // ✅ 신규 추가
  onboarding: {
    requiredStepsCompleted: boolean,  // 필수 스텝 완료 여부 (런타임 계산)
    skippedAt: string | null,         // "나중에 하기" 시점
    completedAt: string | null        // 온보딩 완료 시점
  } | null,  // 프로필 미생성 시 null
  profileCompletion: {
    score: 75,                        // 조건부 분모 기준 점수 (0-100)
    totalPoints: 60,                  // 획득 점수
    maxPoints: 80,                    // 분모 (waiting/not_applicable 제외)
    checklist: [
      { key: 'profile_created', label: '프로필 작성', completed: true, points: 20, maxPoints: 20, status: 'completed', href: '/mypage' },
      { key: 'verification_submitted', label: '면허 인증 제출', completed: true, points: 40, maxPoints: 40, status: 'completed', href: '/verification/doctor' },
      { key: 'verification_approved', label: '면허 인증 승인', completed: false, points: 0, maxPoints: 20, status: 'waiting' },
      { key: 'first_lead_created', label: '첫 문의 생성', completed: false, points: 0, maxPoints: 20, status: 'pending', href: '/vendors' }
    ]
  } | null
}
```

**모달 표시 조건 (통일)**:
```typescript
const showOnboardingModal =
  !auth.onboardingRequired &&                     // 프로필 있음
  auth.onboarding &&                              // 온보딩 데이터 있음
  !auth.onboarding.requiredStepsCompleted &&      // 필수 스텝 미완료
  !auth.onboarding.skippedAt &&                   // "나중에 하기" 안 함
  !auth.onboarding.completedAt;                   // 완료 처리 안 함
```

- 선택 이유: 기존 API 활용, 클라이언트 요청 횟수 최소화

### R6: 온보딩 UI (프론트엔드)

#### 첫 방문 가이드(모달/페이지)
- 위치: 로그인 직후, `onboardingRequired: true`일 때 자동 표시
- 구성:
  - 역할별 퍼널 스텝 안내(doctor: 3단계, vendor: 4단계)
  - 각 스텝별 간단한 설명 + 아이콘
  - "시작하기" 버튼(첫 스텝 페이지로 이동)
  - "나중에 하기" 버튼(닫기, 다음 로그인 시 다시 표시)

#### 프로필 완성도 배너
- 위치: 마이페이지 상단 또는 전역 헤더(완성도 < 100%일 때만)
- 구성:
  - 진행바(예: "프로필 완성도 75%")
  - 체크리스트 토글(펼치기/접기)
  - 각 항목: 완료 여부 아이콘 + 레이블 + 이동 버튼(미완료 항목만)
- 데이터 페칭: React Query(`useQuery`)로 `/api/me` 호출

#### 마이페이지 체크리스트
- 위치: 마이페이지 > "프로필 완성도" 섹션
- 구성: 배너와 동일, 항상 표시(완성도 100%여도)
- 완료 항목: 체크 아이콘 + 그레이아웃 텍스트
- 미완료 항목: 알림 아이콘 + 강조 텍스트 + "완료하기" 버튼

### R7: 온보딩 스텝 자동 완료 트리거

> 완성도는 런타임 계산이므로 별도 업데이트 불필요. 아래는 완성도 계산 시 참조하는 API들.

| 스텝 | 트리거 API | 판단 기준 |
|------|-----------|-----------|
| 프로필 작성 | `POST /api/profile` | `profiles` 레코드 + `displayName`, `phone` 존재 |
| Doctor 인증 제출 | `POST /api/doctor/verification` | `doctor_verifications` 레코드 존재 |
| Vendor 인증 제출 | `POST /api/vendor/verification` | `vendor_verifications` 레코드 존재 |
| 포트폴리오 추가 | `POST /api/vendors/me/portfolio` | `vendor_portfolios` + `vendor_portfolio_assets` 존재 |
| 첫 문의 생성 | `POST /api/leads` | `leads.doctor_user_id = 본인` 1건+ |
| 첫 리드 응답 | `PATCH /api/leads/[id]/status` | `leads.status != 'submitted'` AND vendor 소유 |

### R8: api-client 함수 ✅ 결정 완료

**결정: 기존 `/api/me` 응답 타입만 확장**

- `GET /api/me` 확장 결정에 따라 api-client 변경 최소화
- `MeDataSchema`에 `onboarding`, `profileCompletion` 필드 추가

## 7) 정책/제약(Constraints)

- Server Action 금지 - 온보딩/완성도 조회/업데이트는 `src/app/api/**/route.ts` + React Query로 처리
- 브라우저에서 Supabase(DB) 직접 호출 금지(예외: Auth/Storage)
- React Query 커스텀 훅 래핑 금지 - 컴포넌트에서 직접 `useQuery/useMutation` 사용
- 중앙 에러 핸들러 외 onError 금지 - 백엔드에서 사용자 메시지 내려보내고, 전역 핸들러가 토스트로 표시
- 온보딩 퍼널은 "권장 순서"이지 "강제"가 아님(사용자가 원하는 순서로 진행 가능)
- 프로필 완성도는 검색 노출/매칭에 영향 없음(MVP, NG2 참조)

## 8) Acceptance Criteria (검증 가능한 문장)

- [ ] AC-1: 신규 한의사가 가입 후 로그인하면, 필수 스텝 미완료 시 온보딩 가이드 모달이 표시된다.
- [ ] AC-2: 신규 업체가 가입 후 로그인하면, 필수 스텝 미완료 시 온보딩 가이드 모달이 표시된다.
- [ ] AC-3: 한의사가 프로필 작성 후, 프로필 완성도 체크리스트에 "프로필 작성" 항목이 `completed`로 표시된다.
- [ ] AC-4: 업체가 포트폴리오 이미지를 1개 이상 추가하면, 프로필 완성도 체크리스트에 "포트폴리오 추가" 항목이 `completed`로 표시된다.
- [ ] AC-5: 한의사 마이페이지에 프로필 완성도 진행바(0~100%)와 체크리스트가 표시된다.
- [ ] AC-6: 업체 파트너센터에 프로필 완성도 진행바(0~100%)와 체크리스트가 표시된다.
- [ ] AC-7: 완성도 체크리스트에서 `pending` 상태 항목 클릭 시 해당 페이지로 이동한다.
- [ ] AC-8: 한의사가 모든 퍼널을 완료하면 완성도가 100%로 표시되고, 온보딩 모달이 더 이상 표시되지 않는다.
- [ ] AC-9: 업체가 모든 퍼널을 완료하면 완성도가 100%로 표시되고, 온보딩 모달이 더 이상 표시되지 않는다.
- [ ] AC-10: `GET /api/me` 호출 시 `onboarding`, `profileCompletion` 필드가 응답에 포함된다.
- [ ] AC-11: 인증 제출 후 승인 대기 중이면 "인증 승인" 항목이 `waiting` 상태로 표시되고 분모에서 제외된다.
- [ ] AC-12: vendor에게 리드가 0건이면 "첫 리드 응답" 항목이 표시되지 않는다(`not_applicable`).

## 9) 리스크/오픈 이슈

### 리스크

- R1: 온보딩 퍼널이 복잡하거나 길면 사용자 이탈 가능성 증가
  - 완화: 퍼널을 최소(doctor 3단계, vendor 4단계)로 유지, "나중에 하기" 옵션 제공
- R2: 프로필 완성도 계산 로직이 복잡해질수록 성능/유지보수 비용 증가
  - 완화: MVP는 런타임 계산(조인 최소화), P1+에서 캐싱/저장 검토
- R3: 온보딩 상태와 실제 데이터가 불일치할 가능성(예: 인증 제출 후 삭제)
  - 완화: 런타임 계산 방식 선택 시 자동 해결, 저장 방식 선택 시 트리거/이벤트로 동기화

### 기술 결정 완료 ✅

| 질문 | 결정 | 근거 |
|------|------|------|
| Q1: 온보딩 상태 저장 | `user_onboarding_steps` 단순화 테이블 (`skipped_at`, `completed_at`만) | "진실의 원천" 단일화, write path 불필요 |
| Q2: 프로필 완성도 저장 | 런타임 계산 (저장 없음) | MVP 단순화, 항상 최신 상태 |
| Q3: API 엔드포인트 | `GET /api/me` 확장 | 클라이언트 요청 최소화 |
| Q4: api-client 함수 | 기존 타입 확장만 | Q3 결정에 따름 |
| Q5: 온보딩 UI 형태 | 기존 `/onboarding` 페이지 + 퍼널 안내 모달 | 역할 분리 (첫 프로필 생성 vs 안내) |
| Q6: 온보딩 완료 조건 | 필수 스텝만 (프로필/인증) | 권장 스텝은 완성도에만 반영 |
| Q7: 100% 도달 가능성 | 조건부 분모 (`waiting`/`not_applicable` 제외) | 사용자 행동으로 100% 달성 가능하게 |

### 캐시 갱신 목록 (React Query)

> `["auth", "me"]`가 `staleTime: Infinity`로 설정되어 있으므로, 완성도에 영향을 주는 mutation 후 수동 invalidate 필요.

| Mutation | 파일 | invalidation |
|----------|------|--------------|
| `POST /api/profile` | `onboarding/page.tsx` | `invalidateQueries(["auth", "me"])` |
| `PATCH /api/profile` | `mypage/page.tsx` | `setQueryData(["auth", "me"], data)` |
| `POST /api/doctor/verification` | `verification/doctor/page.tsx` | `invalidateQueries(["auth", "me"])` |
| `POST /api/vendor/verification` | `verification/vendor/page.tsx` | `invalidateQueries(["auth", "me"])` |
| `POST/PATCH /api/vendors/me` | `partner/page.tsx` | `setQueryData(["auth", "me"], data)` |
| `POST /api/vendors/me/portfolio` | `PortfolioCreateModal.tsx` | **추가 필요**: `invalidateQueries(["auth", "me"])` |
| `POST /api/leads` | `InquiryForm.tsx` | **추가 필요**: `invalidateQueries(["auth", "me"])` |
| `PATCH /api/leads/[id]/status` | `partner/leads/[id]/page.tsx` | **추가 필요**: `invalidateQueries(["auth", "me"])` |

### 체크리스트 href 매핑 (실제 라우트)

| key | role | href |
|-----|------|------|
| `profile_created` | doctor | `/mypage` |
| `verification_submitted` | doctor | `/verification/doctor` |
| `verification_approved` | doctor | `/verification/doctor` |
| `first_lead_created` | doctor | `/vendors` |
| `profile_created` | vendor | `/partner` |
| `vendor_info_added` | vendor | `/partner` |
| `portfolio_added` | vendor | `/partner/portfolios` |
| `verification_submitted` | vendor | `/verification/vendor` |
| `verification_approved` | vendor | `/verification/vendor` |
| `first_lead_responded` | vendor | `/partner/leads` |

## 10) 구현 파일 목록

### 생성 (CREATE)
| 파일 | 용도 |
|------|------|
| `app/supabase/migrations/20260117XXXXXX_onboarding_steps.sql` | 테이블 DDL + RLS |
| `app/src/server/onboarding/completion.ts` | 완성도 계산 로직 |
| `app/src/components/widgets/OnboardingModal.tsx` | 퍼널 안내 모달 |
| `app/src/components/widgets/ProfileCompletionBanner.tsx` | 완성도 배너 |

### 수정 (UPDATE)
| 파일 | 변경 내용 |
|------|-----------|
| `app/src/lib/schema/profile.ts` | `OnboardingStateSchema`, `ProfileCompletionSchema` 추가 |
| `app/src/app/api/me/route.ts` | 응답에 `onboarding`, `profileCompletion` 추가 |
| `app/src/stores/auth.ts` | 상태 필드 추가 |
| `app/src/components/providers/AuthProvider.tsx` | 모달 표시 로직 |
| `app/src/app/(main)/mypage/page.tsx` | 완성도 배너 추가 (doctor) |
| `app/src/app/(main)/partner/page.tsx` | 완성도 배너 추가 (vendor) |
