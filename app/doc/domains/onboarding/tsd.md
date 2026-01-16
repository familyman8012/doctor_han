# Onboarding & Profile Completion TSD (Implementation Plan)

## Overview

| 항목    | 내용                                                   |
| ------- | ------------------------------------------------------ |
| Domain  | onboarding                                             |
| Feature | 온보딩 상태 관리 + 프로필 완성도 계산                  |
| PRD     | `app/doc/domains/onboarding/prd.md`                    |
| TSD     | `app/doc/domains/onboarding/tsd.md`                    |

## Technical Decisions (PRD Q1-Q7 결정)

| 질문 | 결정 | 근거 |
|------|------|------|
| Q1: 온보딩 상태 저장 | `user_onboarding_steps` 단순화 테이블 (`skipped_at`, `completed_at`만) | "진실의 원천" 단일화 |
| Q2: 프로필 완성도 저장 | 런타임 계산 | MVP 단순화, 사용자 수 적음 |
| Q3: API 엔드포인트 | `GET /api/me` 확장 | 클라이언트 요청 최소화 |
| Q4: api-client 함수 | 기존 `/api/me` 타입만 확장 | Q3 결정에 따름 |
| Q5: 온보딩 UI 형태 | 기존 `/onboarding` 페이지 + 퍼널 안내 모달 | 역할 분리 |
| Q6: 온보딩 완료 조건 | 필수 스텝만 (프로필/인증) | 권장 스텝은 완성도에만 반영 |
| Q7: 100% 도달 가능성 | 조건부 분모 (`waiting`/`not_applicable` 제외) | 사용자 행동으로 100% 달성 가능 |

## Write Set (변경 파일)

| 파일 | 변경 | 변경 내용 요약 |
|------|------|----------------|
| `app/supabase/migrations/2026XXXX_onboarding_steps.sql` | CREATE | `user_onboarding_steps` 테이블 + RLS 정책 |
| `app/src/lib/database.types.ts` | UPDATE | `pnpm db:gen` 자동 생성 (테이블 타입 추가) |
| `app/src/lib/schema/profile.ts` | UPDATE | `OnboardingStateSchema`, `ProfileCompletionSchema` 추가 + `MeDataSchema` 확장 |
| `app/src/server/onboarding/completion.ts` | CREATE | 프로필 완성도 런타임 계산 함수 |
| `app/src/app/api/me/route.ts` | UPDATE | 온보딩 상태/완성도 데이터 응답에 추가 |
| `app/src/stores/auth.ts` | UPDATE | `onboarding`, `profileCompletion` 필드 추가 |
| `app/src/components/widgets/OnboardingModal.tsx` | CREATE | 온보딩 가이드 모달 컴포넌트 |
| `app/src/components/widgets/ProfileCompletionBanner.tsx` | CREATE | 프로필 완성도 배너/체크리스트 컴포넌트 |
| `app/src/app/(main)/mypage/page.tsx` | UPDATE | 프로필 완성도 섹션 추가 (doctor) |
| `app/src/app/(main)/partner/page.tsx` | UPDATE | 프로필 완성도 섹션 추가 (vendor) |
| `app/src/components/providers/AuthProvider.tsx` | UPDATE | 온보딩 모달 표시 로직 추가 |

## Impact Matrix (레이어별 영향)

| 레이어 | 변경 여부 | 관련 파일(대표) | 근거 |
|--------|-----------|-----------------|------|
| UI (Pages/Components) | UPDATE | `app/src/app/(main)/mypage/page.tsx:117-288`, `app/src/app/(main)/partner/page.tsx:146-354` | 프로필 완성도 배너/체크리스트 UI 추가 필요 |
| API Route | UPDATE | `app/src/app/api/me/route.ts:29-115` | 온보딩/완성도 데이터 응답 확장 필요 |
| Schema (Zod) | UPDATE | `app/src/lib/schema/profile.ts:70-77` | `MeDataSchema`에 `onboarding`, `profileCompletion` 필드 추가 필요 |
| Service/Repo | CREATE | `-` | `app/src/server/onboarding/completion.ts` 신규 생성 (완성도 계산 로직) |
| DB Migration | CREATE | `app/supabase/migrations/` | `user_onboarding_steps` 테이블 신규 생성 |
| Auth/Guards | NO CHANGE | `app/src/server/auth/guards.ts:1-138` | 기존 가드 재사용, 온보딩은 인증과 무관 (검증 완료: 별도 권한 체크 불필요) |
| RLS/Policy | CREATE | `app/supabase/migrations/` | `user_onboarding_steps` 테이블 RLS 정책 필요 (본인만 조회/수정) |
| Types (database.types.ts) | UPDATE | `app/src/lib/database.types.ts` | `pnpm db:gen -- --local` 자동 생성 |

## Read Set (참조한 파일)

| 파일 | 라인 | 참조 이유 |
|------|------|-----------|
| `app/src/app/(auth)/onboarding/page.tsx` | 1-220 | 현재 온보딩 페이지 구조 확인 (역할 선택 + 닉네임 입력 후 /verification 이동) |
| `app/src/stores/auth.ts` | 1-93 | 현재 auth 스토어 구조 확인 (`onboardingRequired` 존재, `onboarding`/`profileCompletion` 없음) |
| `app/src/components/providers/AuthProvider.tsx` | 1-67 | 인증 상태 초기화 흐름 확인 (`/api/me` 호출 후 `setAuth`) |
| `app/src/app/(main)/mypage/layout.tsx` | 1-151 | doctor 마이페이지 레이아웃 확인 (프로필 완성도 배너 위치 결정) |
| `app/src/app/(main)/partner/layout.tsx` | 1-142 | vendor 파트너센터 레이아웃 확인 |
| `app/src/app/api/leads/route.ts` | 48-124 | 리드 생성 API 확인 (첫 문의 감지 로직 참조) |
| `app/src/app/api/leads/[id]/status/route.ts` | 9-68 | 리드 상태 변경 API 확인 (첫 응답 감지 로직 참조) |
| `app/src/lib/database.types.ts` | 329-391 | `leads` 테이블 구조 확인 (`doctor_user_id`, `status`) |
| `app/src/lib/database.types.ts` | 697-734 | `vendor_portfolios` 테이블 구조 확인 |
| `app/supabase/migrations/20251218190000_p0_schema.sql` | 231-258 | `leads` 테이블 스키마 + RLS 정책 참조 |

## Requirements Summary

PRD 요구사항 요약 (새로운 요구사항 추가 없음):

1. **R1**: 역할별 온보딩 퍼널 정의
   - doctor: 프로필 작성(필수) -> 면허 인증 제출(필수) -> 첫 문의 생성(권장)
   - vendor: 프로필 작성(필수) -> 포트폴리오 추가(권장) -> 사업자 인증 제출(필수) -> 첫 리드 응답(권장)

2. **R2**: 프로필 완성도 계산 규칙 (기존 DB 필드 기반)

   **Doctor (100점)**
   | 항목 | 점수 | 조건 |
   |------|------|------|
   | 프로필 작성 | 20점 | `profiles` 존재 + `displayName`, `phone` 입력 |
   | 인증 제출 | 40점 | `doctor_verifications` 레코드 존재 |
   | 인증 승인 | 20점 | `doctor_verifications.status = 'approved'` |
   | 첫 문의 생성 | 20점 | `leads.doctor_user_id = 본인` 1건+ |

   **Vendor (100점)**
   | 항목 | 점수 | 조건 |
   |------|------|------|
   | 프로필 작성 | 15점 | `profiles` 존재 + `displayName`, `phone` 입력 |
   | 업체 정보 | 15점 | `vendors` 존재 + `name`, `description`, `regionPrimary` + `vendor_categories` 1건+ |
   | 포트폴리오 | 20점 | `vendor_portfolios` + `vendor_portfolio_assets` 1건+ |
   | 인증 제출 | 30점 | `vendor_verifications` 레코드 존재 |
   | 인증 승인 | 10점 | `vendor_verifications.status = 'approved'` |
   | 첫 리드 응답 | 10점 | `leads.status != 'submitted'` AND vendor 소유 |

3. **R3-R5**: 기술 결정 사항 (상단 테이블 참조)

4. **R6**: 온보딩 UI (기존 `/onboarding` 페이지 + 퍼널 안내 모달 + 프로필 완성도 배너)

5. **R7**: 온보딩 스텝 자동 완료 트리거 (런타임 계산이므로 별도 업데이트 불필요)

   | 스텝 | 트리거 API |
   |------|-----------|
   | 프로필 작성 | `POST /api/profile` |
   | Doctor 인증 제출 | `POST /api/doctor/verification` |
   | Vendor 인증 제출 | `POST /api/vendor/verification` |
   | 포트폴리오 추가 | `POST /api/vendors/me/portfolio` |
   | 첫 문의 생성 | `POST /api/leads` |
   | 첫 리드 응답 | `PATCH /api/leads/[id]/status` |

## Task Chunking Rules

1 Task = 1 VALIDATE + 1 경계(레이어) 원칙:
- DB 마이그레이션은 단독 Task
- Schema/Type은 단독 Task
- API Route는 단독 Task
- UI 컴포넌트는 기능 단위로 분리

## Implementation Plan

### Phase 1: Database (SQL migration + RLS/Policy)

1. `user_onboarding_steps` 테이블 생성 (단순화 버전)
   ```sql
   -- 스텝 boolean 필드 제거: 런타임 계산으로 통일
   -- 테이블은 "사용자 의사 표현"만 저장 (나중에 하기, 완료 인정)
   CREATE TABLE public.user_onboarding_steps (
     user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
     skipped_at timestamptz,          -- "나중에 하기" 클릭 시점
     completed_at timestamptz,        -- 온보딩 완료 처리 시점
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now()
   );
   ```

2. RLS 정책 추가
   ```sql
   ALTER TABLE public.user_onboarding_steps ENABLE ROW LEVEL SECURITY;

   -- 본인만 조회/수정 가능 + admin 조회
   CREATE POLICY user_onboarding_steps_select_self_or_admin
   ON public.user_onboarding_steps FOR SELECT TO authenticated
   USING (user_id = auth.uid() OR public.is_admin());

   CREATE POLICY user_onboarding_steps_insert_self
   ON public.user_onboarding_steps FOR INSERT TO authenticated
   WITH CHECK (user_id = auth.uid());

   CREATE POLICY user_onboarding_steps_update_self
   ON public.user_onboarding_steps FOR UPDATE TO authenticated
   USING (user_id = auth.uid())
   WITH CHECK (user_id = auth.uid());
   ```

3. `updated_at` 트리거 추가

### Phase 2: Types (pnpm db:gen)

1. `pnpm db:reset` 실행 (마이그레이션 적용)
2. `pnpm db:gen -- --local` 실행 (타입 자동 생성)

### Phase 3: Schema (Zod 계약)

1. `ChecklistItemStatus` enum 정의
   ```typescript
   export const ChecklistItemStatusSchema = z.enum([
     'completed',       // 완료됨
     'pending',         // 미완료 (사용자 행동 필요)
     'waiting',         // 대기중 (admin 승인 등, 사용자 행동 불가)
     'not_applicable',  // 해당 없음 (조건 미충족으로 분모에서 제외)
   ]);
   export type ChecklistItemStatus = z.infer<typeof ChecklistItemStatusSchema>;
   ```

2. `OnboardingStateSchema` 정의 (단순화)
   ```typescript
   export const OnboardingStateSchema = z.object({
     requiredStepsCompleted: z.boolean(),  // 필수 스텝 완료 여부 (런타임 계산)
     skippedAt: z.string().nullable(),     // "나중에 하기" 시점
     completedAt: z.string().nullable(),   // 온보딩 완료 시점
   });
   ```

3. `ProfileCompletionItemSchema` 정의
   ```typescript
   export const ProfileCompletionItemSchema = z.object({
     key: z.string(),
     label: z.string(),
     completed: z.boolean(),
     points: z.number(),
     maxPoints: z.number(),
     status: ChecklistItemStatusSchema,
     href: z.string().optional(),  // pending 상태일 때만
   });

   export const ProfileCompletionSchema = z.object({
     score: z.number().min(0).max(100),  // 조건부 분모 기준
     totalPoints: z.number(),            // 획득 점수
     maxPoints: z.number(),              // 분모 (waiting/not_applicable 제외)
     checklist: z.array(ProfileCompletionItemSchema),
   });
   ```

4. `MeDataSchema` 확장
   ```typescript
   export const MeDataSchema = z.object({
     // ... 기존 필드
     onboarding: OnboardingStateSchema.nullable(),
     profileCompletion: ProfileCompletionSchema.nullable(),
   });
   ```

### Phase 4: Server Module (completion calculator)

1. `app/src/server/onboarding/completion.ts` 생성

   ```typescript
   import type { SupabaseClient } from "@supabase/supabase-js";
   import type { Tables } from "@/lib/database.types";
   import type { ChecklistItemStatus, ProfileCompletion, OnboardingState } from "@/lib/schema/profile";

   interface CompletionContext {
     supabase: SupabaseClient;
     userId: string;
     profile: Tables<"profiles">;
   }

   // 조건부 분모 계산 헬퍼
   function calculateScore(checklist: ProfileCompletionItem[]): { score: number; totalPoints: number; maxPoints: number } {
     const applicableItems = checklist.filter(
       item => item.status !== 'waiting' && item.status !== 'not_applicable'
     );
     const maxPoints = applicableItems.reduce((sum, item) => sum + item.maxPoints, 0);
     const totalPoints = applicableItems.filter(i => i.completed).reduce((sum, i) => sum + i.points, 0);
     const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
     return { score, totalPoints, maxPoints };
   }

   // Doctor 완성도 계산
   async function calculateDoctorCompletion(ctx: CompletionContext): Promise<ProfileCompletion> {
     // 1. profiles.displayName, phone 체크 → 20점
     // 2. doctor_verifications 존재 체크 → 40점
     // 3. doctor_verifications.status = 'approved' 체크 → 20점
     //    - 제출됨 + pending → status: 'waiting' (분모 제외)
     // 4. leads WHERE doctor_user_id = userId 1건+ 체크 → 20점
   }

   // Vendor 완성도 계산
   async function calculateVendorCompletion(ctx: CompletionContext): Promise<ProfileCompletion> {
     // 1. profiles.displayName, phone 체크 → 15점
     // 2. vendors + name/description/regionPrimary + vendor_categories 체크 → 15점
     // 3. vendor_portfolios + vendor_portfolio_assets 1건+ 체크 → 20점
     // 4. vendor_verifications 존재 체크 → 30점
     // 5. vendor_verifications.status = 'approved' 체크 → 10점
     //    - 제출됨 + pending → status: 'waiting' (분모 제외)
     // 6. leads WHERE vendor_id IN (본인 vendors) AND status != 'submitted' 체크 → 10점
     //    - 리드 0건 → status: 'not_applicable' (분모 제외)
   }

   // 온보딩 상태 조회 (user_onboarding_steps 테이블)
   async function fetchOnboardingState(supabase: SupabaseClient, userId: string): Promise<OnboardingState | null> {
     const { data } = await supabase
       .from("user_onboarding_steps")
       .select("skipped_at, completed_at")
       .eq("user_id", userId)
       .maybeSingle();

     if (!data) return null;
     return {
       requiredStepsCompleted: Boolean(data.completed_at),
       skippedAt: data.skipped_at,
       completedAt: data.completed_at,
     };
   }

   // 온보딩 row upsert ("나중에 하기" 또는 완료 처리용)
   async function upsertOnboardingStep(
     supabase: SupabaseClient,
     userId: string,
     updates: { skipped_at?: string; completed_at?: string }
   ): Promise<void>
   ```

### Phase 5: API Layer (route.ts + withApi/guards)

1. `GET /api/me` 응답 확장
   - 기존 응답에 `onboarding`, `profileCompletion` 필드 추가
   - `fetchOnboardingState` + `calculateXxxCompletion` 호출

### Phase 6: UI (React Query + 컴포넌트)

1. `app/src/stores/auth.ts` 확장
   - `onboarding`, `profileCompletion` 필드 추가

2. `OnboardingModal.tsx` 생성
   - 역할별 퍼널 스텝 안내
   - "시작하기" / "나중에 하기" 버튼

3. `ProfileCompletionBanner.tsx` 생성
   - 진행바 + 체크리스트
   - 미완료 항목 클릭 시 해당 페이지 이동

4. `AuthProvider.tsx` 수정
   - 온보딩 모달 표시 로직 추가

5. `mypage/page.tsx`, `partner/page.tsx` 수정
   - 프로필 완성도 섹션 추가

### Phase 7: Validate (lint/type-check/test)

```bash
cd app
pnpm lint
pnpm type-check
pnpm test
```

## Step-by-Step Tasks

### Task 1: DB Migration - user_onboarding_steps 테이블 생성
- **파일**: `app/supabase/migrations/20260117XXXXXX_onboarding_steps.sql`
- **작업**:
  1. `user_onboarding_steps` 테이블 DDL 작성
  2. RLS 활성화 및 정책 추가
  3. `updated_at` 트리거 추가
- **검증**: `pnpm db:reset` 성공

### Task 2: Types - database.types.ts 자동 생성
- **파일**: `app/src/lib/database.types.ts`
- **작업**: `pnpm db:gen -- --local` 실행
- **검증**: `user_onboarding_steps` 타입 존재 확인

### Task 3: Schema - Zod 스키마 확장
- **파일**: `app/src/lib/schema/profile.ts`
- **작업**:
  1. `OnboardingStateSchema` 추가
  2. `ProfileCompletionItemSchema`, `ProfileCompletionSchema` 추가
  3. `MeDataSchema` 확장
- **검증**: `pnpm type-check` 성공

### Task 4: Server - 완성도 계산 모듈 생성
- **파일**: `app/src/server/onboarding/completion.ts`
- **작업**:
  1. `fetchOnboardingState` 함수 구현
  2. `calculateDoctorCompletion` 함수 구현
  3. `calculateVendorCompletion` 함수 구현
- **검증**: `pnpm type-check` 성공

### Task 5: API - GET /api/me 확장
- **파일**: `app/src/app/api/me/route.ts`
- **작업**:
  1. `fetchOnboardingState` 호출 추가
  2. 역할에 따라 `calculateXxxCompletion` 호출
  3. 응답에 `onboarding`, `profileCompletion` 추가
- **검증**: `curl /api/me` 응답 확인

### Task 6: Store - auth store 확장
- **파일**: `app/src/stores/auth.ts`
- **작업**:
  1. `AuthState` 타입에 `onboarding`, `profileCompletion` 추가
  2. `setAuth` 함수 업데이트
  3. 편의 셀렉터 추가 (`useOnboarding`, `useProfileCompletion`)
- **검증**: `pnpm type-check` 성공

### Task 7: UI - OnboardingModal 컴포넌트 생성
- **파일**: `app/src/components/widgets/OnboardingModal.tsx`
- **작업**:
  1. 모달 컴포넌트 구현 (역할별 퍼널 안내)
  2. "시작하기" 버튼 (첫 스텝 페이지 이동)
  3. "나중에 하기" 버튼 (닫기)
- **검증**: Storybook 또는 수동 테스트

### Task 8: UI - ProfileCompletionBanner 컴포넌트 생성
- **파일**: `app/src/components/widgets/ProfileCompletionBanner.tsx`
- **작업**:
  1. 진행바 UI 구현
  2. 체크리스트 UI 구현 (완료/미완료 구분)
  3. 미완료 항목 클릭 시 `href`로 이동
- **검증**: Storybook 또는 수동 테스트

### Task 9: UI - AuthProvider 수정 (온보딩 모달 표시 로직)
- **파일**: `app/src/components/providers/AuthProvider.tsx`
- **작업**:
  1. 모달 표시 조건 구현 (통일된 기준):
     ```typescript
     const showOnboardingModal =
       !auth.onboardingRequired &&                     // 프로필 있음
       auth.onboarding &&                              // 온보딩 데이터 있음
       !auth.onboarding.requiredStepsCompleted &&      // 필수 스텝 미완료
       !auth.onboarding.skippedAt &&                   // "나중에 하기" 안 함
       !auth.onboarding.completedAt;                   // 완료 처리 안 함
     ```
  2. "나중에 하기" 클릭 시 `PATCH /api/onboarding` 호출 → `skipped_at` 설정
- **검증**: 신규 가입 후 로그인 시 모달 표시 확인

### Task 10: UI - mypage/page.tsx 수정 (doctor 완성도 섹션)
- **파일**: `app/src/app/(main)/mypage/page.tsx`
- **작업**:
  1. `ProfileCompletionBanner` 컴포넌트 추가
  2. 프로필 카드 상단에 배치
- **검증**: 마이페이지 접속 시 완성도 배너 확인

### Task 11: UI - partner/page.tsx 수정 (vendor 완성도 섹션)
- **파일**: `app/src/app/(main)/partner/page.tsx`
- **작업**:
  1. `ProfileCompletionBanner` 컴포넌트 추가
  2. 프로필 카드 상단에 배치
- **검증**: 파트너센터 접속 시 완성도 배너 확인

### Task 12: 캐시 갱신 추가 (완성도 영향 mutation)
- **작업**: 아래 파일들의 mutation `onSuccess`에 `invalidateQueries(["auth", "me"])` 추가
  1. `app/src/app/(main)/partner/portfolios/components/PortfolioCreateModal.tsx:57`
  2. `app/src/app/(main)/vendors/[id]/inquiry/components/InquiryForm.tsx:91`
  3. `app/src/app/(main)/partner/leads/[id]/page.tsx:66`
- **검증**: 포트폴리오 추가/리드 생성/상태 변경 후 완성도 갱신 확인

### Task 13: Validate - 전체 검증
- **작업**:
  ```bash
  cd app
  pnpm lint
  pnpm type-check
  pnpm test
  ```
- **검증**: 모든 명령 성공

## 캐시 갱신 전체 목록 (React Query)

> `["auth", "me"]`가 `staleTime: Infinity`로 설정되어 있으므로, 완성도에 영향을 주는 mutation 후 수동 invalidate 필요.

| Mutation | 파일 | invalidation | 상태 |
|----------|------|--------------|------|
| `POST /api/profile` | `onboarding/page.tsx:37` | `invalidateQueries(["auth", "me"])` | ✅ 구현됨 |
| `PATCH /api/profile` | `mypage/page.tsx:56` | `setQueryData(["auth", "me"], data)` | ✅ 구현됨 |
| `POST /api/doctor/verification` | `verification/doctor/page.tsx:84` | `invalidateQueries(["auth", "me"])` | ✅ 구현됨 |
| `POST /api/vendor/verification` | `verification/vendor/page.tsx:86` | `invalidateQueries(["auth", "me"])` | ✅ 구현됨 |
| `POST/PATCH /api/vendors/me` | `partner/page.tsx:118` | `setQueryData(["auth", "me"], data)` | ✅ 구현됨 |
| `POST /api/vendors/me/portfolio` | `PortfolioCreateModal.tsx:57` | `invalidateQueries(["auth", "me"])` | ⚠️ Task 12 |
| `POST /api/leads` | `InquiryForm.tsx:91` | `invalidateQueries(["auth", "me"])` | ⚠️ Task 12 |
| `PATCH /api/leads/[id]/status` | `partner/leads/[id]/page.tsx:66` | `invalidateQueries(["auth", "me"])` | ⚠️ Task 12 |

## Validation Commands

```bash
# 1. 마이그레이션 적용
cd app
pnpm db:reset

# 2. 타입 생성
pnpm db:gen -- --local

# 3. 린트 & 타입 체크
pnpm lint
pnpm type-check

# 4. 테스트
pnpm test


# 6. API 수동 테스트 (로컬 서버 실행 후)
curl -X GET http://localhost:3000/api/me -H "Cookie: ..."
```

## Done When (Completion Criteria)

- [ ] `pnpm db:reset` 성공 (마이그레이션 적용됨)
- [ ] `pnpm db:gen -- --local` 성공 (`user_onboarding_steps` 타입 존재)
- [ ] `pnpm lint` 성공
- [ ] `pnpm type-check` 성공
- [ ] `pnpm test` 성공
- [ ] `GET /api/me` 응답에 `onboarding`, `profileCompletion` 필드 포함
- [ ] doctor 마이페이지에 프로필 완성도 배너 표시
- [ ] vendor 파트너센터에 프로필 완성도 배너 표시
- [ ] 신규 가입 후 로그인 시 온보딩 모달 표시
- [ ] 포트폴리오 추가 후 완성도 갱신 확인 (캐시 invalidation)
- [ ] 리드 생성 후 완성도 갱신 확인 (캐시 invalidation)
- [ ] 리드 상태 변경 후 완성도 갱신 확인 (캐시 invalidation)
- [ ] AC-1 ~ AC-12 수동 검증 완료

## Progress Log (append-only)

| 날짜 | 작업 | 상태 |
|------|------|------|
| 2026-01-17 | TSD 초안 작성 | 완료 |
| 2026-01-17 | PRD/TSD 정합성 검토 및 수정 (API 경로, 완성도 기준, Q5 결정) | 완료 |
| 2026-01-17 | PRD/TSD 정합성 보강 (스키마 단순화, 모달 조건 통일, 조건부 분모, 캐시 갱신 목록) | 완료 |
