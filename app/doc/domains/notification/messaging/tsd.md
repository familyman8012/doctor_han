# 통합 메시징 시스템 TSD

> 기반 문서: `app/doc/domains/notification/messaging/prd.md:1`
> 참고 코드: `app/src/server/notification/service.ts:1`, `app/src/lib/schema/notification.ts:1`

## 0. 변경 요약 (파일 단위)

| 파일 | 변경 | 변경 내용 요약 |
| --- | --- | --- |
| `app/src/lib/schema/notification.ts` | UPDATE | kakaoEnabled 필드 추가 |
| `app/supabase/migrations/YYYYMMDDHHMMSS_add_kakao_and_retry.sql` | CREATE | kakao_enabled 컬럼 + retry 컬럼 추가 |
| `app/src/server/notification/solapi.ts` | CREATE | Solapi SDK 클라이언트 |
| `app/src/server/notification/kakao-templates.ts` | CREATE | 카카오 알림톡 템플릿 |
| `app/src/server/notification/service.ts` | UPDATE | 병렬 발송 + 재시도 로직 추가 |
| `app/src/server/notification/repository.ts` | UPDATE | kakao_enabled, retry 컬럼 처리 |
| `app/src/server/notification/mapper.ts` | UPDATE | kakaoEnabled 매핑 추가 |
| `app/src/app/api/notification-settings/route.ts` | UPDATE | kakaoEnabled 필드 지원 |
| `app/src/app/api/admin/verifications/[id]/approve/route.ts` | UPDATE | 카카오 병렬 발송 추가 |
| `app/src/app/api/admin/verifications/[id]/reject/route.ts` | UPDATE | 카카오 병렬 발송 추가 |
| `app/src/app/(main)/mypage/notifications/page.tsx` | UPDATE | 카카오 토글 추가 |
| `app/src/app/(main)/partner/notifications/page.tsx` | UPDATE | 카카오 토글 추가 |

## 0.1 영향 범위 매트릭스 (Impact Matrix)

| 레이어 | 변경 여부 | 관련 파일(대표) | 근거 |
| --- | --- | --- | --- |
| UI (Pages/Components/Stores/Hooks) | UPDATE | `app/src/app/(main)/mypage/notifications/page.tsx:115-149` | ToggleItem 추가 필요, kakaoEnabled 필드 사용 |
| API Route | UPDATE | `app/src/app/api/notification-settings/route.ts:25-32` | kakaoEnabled body 필드 처리 추가 |
| API Client | NO CHANGE | `app/src/api-client/client.ts` | 기존 axios 클라이언트 사용, 스키마 변경만으로 충분 |
| Schema (Zod) | UPDATE | `app/src/lib/schema/notification.ts:4-12` | NotificationSettingsViewSchema에 kakaoEnabled 추가 |
| Service | UPDATE | `app/src/server/notification/service.ts:29-128` | 병렬 발송 + 재시도 로직 추가 |
| Repo/DB (+ Migration) | UPDATE | `app/src/server/notification/repository.ts:29-85`, `app/supabase/migrations/20260117120000_notification_settings.sql:15-23` | kakao_enabled, retry 컬럼 추가 |
| Auth/Security/RLS | NO CHANGE | `app/supabase/migrations/20260117120000_notification_settings.sql:52-70` | 기존 RLS 정책 유지 (본인만 조회/수정) |
| Integrations/Cache | CREATE | `app/src/server/notification/solapi.ts` | Solapi SDK 클라이언트 신규 생성 |
| Config/Middleware/Env | UPDATE | `.env*` | SOLAPI_* 환경변수 주석 해제 필요 |
| Tests | NO CHANGE | - | 테스트 추가는 후속 작업 |

## 0.2 추가로 읽은 파일 (Read Set)

| 파일 | 라인 | 참조 이유 |
| --- | --- | --- |
| `app/src/server/notification/resend.ts` | 1-16 | Solapi 클라이언트 패턴 참조 |
| `app/src/server/notification/templates.ts` | - | 카카오 템플릿 구조 참조 |
| `app/src/app/api/admin/verifications/[id]/approve/route.ts` | 124-144 | 이메일 발송 호출 패턴 참조 |
| `app/src/app/api/admin/verifications/[id]/reject/route.ts` | 116-136 | 이메일 발송 호출 패턴 참조 |

## 0.3 Step-by-Step Implementation Tasks

| ID | Layer | File | Action | Description | Depends On |
|----|-------|------|--------|-------------|------------|
| SCHEMA-1 | Schema | `app/src/lib/schema/notification.ts` | UPDATE | kakaoEnabled 필드 추가 | - |
| SCHEMA-2 | Migration | `app/supabase/migrations/YYYYMMDDHHMMSS_add_kakao_and_retry.sql` | CREATE | kakao_enabled, retry_count, max_retries, status 컬럼 추가 | - |
| BACKEND-1 | Integration | `app/src/server/notification/solapi.ts` | CREATE | Solapi SDK 클라이언트 | - |
| BACKEND-2 | Integration | `app/src/server/notification/kakao-templates.ts` | CREATE | 카카오 알림톡 템플릿 | - |
| BACKEND-3 | Repository | `app/src/server/notification/repository.ts` | UPDATE | kakao_enabled, retry 컬럼 처리 | SCHEMA-2 |
| BACKEND-4 | Mapper | `app/src/server/notification/mapper.ts` | UPDATE | kakaoEnabled 매핑 추가 | SCHEMA-1 |
| BACKEND-5 | Service | `app/src/server/notification/service.ts` | UPDATE | 병렬 발송 + 재시도 로직 | BACKEND-1, BACKEND-2, BACKEND-3 |
| BACKEND-6 | API | `app/src/app/api/notification-settings/route.ts` | UPDATE | kakaoEnabled body 필드 처리 | SCHEMA-1, BACKEND-3, BACKEND-4 |
| BACKEND-7 | API | `app/src/app/api/admin/verifications/[id]/approve/route.ts` | UPDATE | 카카오 병렬 발송 호출 | BACKEND-5 |
| BACKEND-8 | API | `app/src/app/api/admin/verifications/[id]/reject/route.ts` | UPDATE | 카카오 병렬 발송 호출 | BACKEND-5 |
| FRONTEND-1 | UI | `app/src/app/(main)/mypage/notifications/page.tsx` | UPDATE | 카카오 토글 추가 | SCHEMA-1 |
| FRONTEND-2 | UI | `app/src/app/(main)/partner/notifications/page.tsx` | UPDATE | 카카오 토글 추가 | SCHEMA-1 |

## 0.4 Parallelization Strategy

### 실행 모드

| 모드 | 특징 | 권장 상황 |
|------|------|----------|
| **Conservative (기본)** | Backend 완료 후 Frontend 시작 | 대부분의 경우, API 스펙 변경 가능성 있을 때 |

### 실행 단계 (Conservative 기본값)

| Phase | Tasks | Executor | Mode |
|-------|-------|----------|------|
| 1 | SCHEMA-1, SCHEMA-2 | schema-implementer | Both |
| 2 | BACKEND-1, BACKEND-2, BACKEND-3, BACKEND-4 | backend-implementer | Both |
| 3 | BACKEND-5, BACKEND-6, BACKEND-7, BACKEND-8 | backend-implementer | Both |
| 4 | FRONTEND-1, FRONTEND-2 | frontend-implementer | Conservative: Phase 3 완료 후 |
| 5 | Integration | main | Both |

**Conservative 흐름**: Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5

### 파일 소유권 (충돌 방지)

| Pattern | Owner | Others |
|---------|-------|--------|
| `app/src/lib/schema/**` | schema-implementer | READ-ONLY |
| `app/supabase/migrations/**` | schema-implementer | READ-ONLY |
| `app/src/server/notification/**` | backend-implementer | READ-ONLY |
| `app/src/app/api/**` | backend-implementer | READ-ONLY |
| `app/src/app/(main)/**` | frontend-implementer | READ-ONLY |

## 1. 범위

- **포함**
  - Solapi SDK 연동 (카카오 알림톡)
  - notification_settings 테이블에 kakao_enabled 컬럼 추가
  - notification_deliveries 테이블에 retry 관련 컬럼 추가
  - 병렬 발송 로직 (이메일 + 카카오)
  - 즉시 재시도 로직 (최대 3회, exponential backoff)
  - 인증 승인/반려 시 카카오 알림톡 발송
  - 알림 설정 UI에 카카오 토글 추가
- **제외**
  - 리드 알림톡 발송 (2차 릴리스)
  - SMS fallback
  - 마케팅 알림톡
  - 별도 큐 시스템

## 2. 시스템 개요

### 2.1 아키텍처 / 경계

```
┌─────────────────┐     ┌─────────────────┐     ┌────────────────┐
│   API Routes    │ --> │    Service      │ --> │     Repo       │
│  (/api/...)     │     │ (병렬발송/재시도) │     │  (Supabase)    │
└─────────────────┘     └─────────────────┘     └────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────▼─────┐        ┌──────▼──────┐
              │  Resend   │        │   Solapi    │
              │  (Email)  │        │  (Kakao)    │
              └───────────┘        └─────────────┘
```

- UI: `app/src/app/(main)/mypage/notifications/page.tsx`, `app/src/app/(main)/partner/notifications/page.tsx`
- API: `app/src/app/api/notification-settings/route.ts`, `app/src/app/api/admin/verifications/[id]/approve/route.ts`, `app/src/app/api/admin/verifications/[id]/reject/route.ts`
- Schema (Zod 계약): `app/src/lib/schema/notification.ts`
- Service: `app/src/server/notification/service.ts`
- Repo/DB: `app/src/server/notification/repository.ts`, `app/supabase/migrations/`
- Integration: `app/src/server/notification/solapi.ts`, `app/src/server/notification/kakao-templates.ts`

### 2.2 데이터 흐름

1. Admin이 인증 승인/반려 API 호출
2. API -> Service: `sendVerificationResultNotification()` 호출
3. Service: 사용자 알림 설정 조회 (email_enabled, kakao_enabled)
4. Service: 활성화된 채널에 대해 병렬 발송 (`Promise.allSettled`)
5. Service: 각 채널별 실패 시 재시도 (exponential backoff: 2s, 4s, 8s)
6. Repo: 발송 결과 notification_deliveries에 기록

## 3. UI/UX 설계

### 3.1 해결할 문제 (PRD 기반)

- **핵심 문제**: 이메일 알림만으로는 확인율이 낮아 중요 알림을 놓치는 경우 발생
- **핵심 니즈**: 사용자가 이메일/카카오 채널을 각각 ON/OFF 설정할 수 있어야 함
- **성공 기준**: 카카오 알림톡 수신 동의율 측정 가능

### 3.2 정보 구조 (Information Architecture)

**핵심 정보 (반드시 표시):**
- 이메일 알림 전체 ON/OFF
- 카카오 알림톡 전체 ON/OFF (신규)
- 하위 알림 유형별 ON/OFF (인증 결과, 리드, 마케팅)

**부가 정보 (확장 시 표시):**
- 각 토글의 설명 텍스트

**정보 그룹핑:**
- 채널별 그룹핑 (이메일 섹션, 카카오 섹션)

### 3.3 흐름(Flow) 설계

**메인 플로우:**
```
[알림 설정 페이지 진입] -> [현재 설정 조회] -> [토글 클릭] -> [API 호출] -> [성공 토스트]
```

**예외/이탈 루트:**
- API 호출 실패 -> 에러 토스트 (이전 상태 유지)
- 로딩 중 -> 토글 disabled

**단계 최소화:**
- 토글 1회 클릭으로 즉시 저장 (별도 저장 버튼 없음)

### 3.4 레이아웃 및 시각적 위계

**레이아웃 선택 + 근거:**
- 목록 형태: **리스트**
- 근거: 기존 알림 설정 페이지 패턴 유지, 토글 항목이 적어 리스트가 적합

**시각적 위계 (중요도순):**
1. **Primary**: 이메일 알림 전체, 카카오 알림톡 전체 (마스터 토글)
2. **Secondary**: 하위 알림 유형 토글
3. **Information**: 각 토글의 설명 텍스트

**영역 구분 (ASCII 레이아웃):**
```
┌─────────────────────────────────────────────────────────────┐
│  알림 설정                                                   │
│  "이메일 및 카카오 알림 수신 여부를 관리합니다"              │
├─────────────────────────────────────────────────────────────┤
│  [이메일 알림 전체] ─────────────────────────────── [토글]  │
│  [인증 결과 알림]   ─────────────────────────────── [토글]  │
│  [리드 관련 알림]   ─────────────────────────────── [토글]  │
│  [마케팅 알림]      ─────────────────────────────── [토글]  │
├─────────────────────────────────────────────────────────────┤
│  [카카오 알림톡 전체] ───────────────────────────── [토글]  │  <- 신규
│  * 휴대폰 번호가 등록되어 있어야 수신 가능합니다             │
├─────────────────────────────────────────────────────────────┤
│  약관 및 정책                                                │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 컴포넌트 구조

**파일 구조:**
```
mypage/notifications/
└── page.tsx (기존 파일, 카카오 토글 추가)

partner/notifications/
└── page.tsx (기존 파일, 카카오 토글 추가)
```

**변경 내용:**
- ToggleableKey 타입에 `kakaoEnabled` 추가
- 이메일 토글 그룹과 카카오 토글 사이에 구분선 또는 간격 추가
- 카카오 토글 아이템 추가 (MessageCircle 아이콘 사용)
- 카카오 토글 하단에 안내 문구 추가

### 3.6 상태 및 피드백

| 상태 | UI 표현 |
|------|---------|
| 초기 (로딩) | Spinner 표시 |
| 데이터 로드 완료 | 토글 목록 표시 |
| 토글 변경 중 | 토글 disabled |
| 변경 성공 | "알림 설정이 변경되었습니다" 토스트 |
| 변경 실패 | 에러 토스트 (기존 상태 유지) |

**UX 편의 기능:**
- 이메일 전체 OFF 시 하위 이메일 토글 disabled (기존 동작 유지)
- 카카오 전체 토글은 독립적 (이메일과 연동 없음)

### 3.7 상태 관리

- **서버 상태**: React Query 사용
  - 쿼리 키: `["notification-settings"]`
  - mutation: `updateMutation`
- **클라이언트 상태**: 불필요 (서버 상태만 사용)
- **URL 상태**: 불필요 (단일 페이지)

### 3.8 API Client

- 기존 `api.get()`, `api.patch()` 사용
- 스키마 변경으로 kakaoEnabled 필드 자동 지원

## 4. 데이터 모델

### 4.1 notification_settings (기존 테이블 변경)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| kakao_enabled | boolean | NOT NULL DEFAULT false | 카카오 알림톡 수신 여부 |

- 마이그레이션: `app/supabase/migrations/YYYYMMDDHHMMSS_add_kakao_and_retry.sql`
- 롤백(down) 전략: `ALTER TABLE public.notification_settings DROP COLUMN kakao_enabled;`

### 4.2 notification_deliveries (기존 테이블 변경)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| retry_count | integer | NOT NULL DEFAULT 0 | 현재 재시도 횟수 |
| max_retries | integer | NOT NULL DEFAULT 3 | 최대 재시도 횟수 |
| status | text | NOT NULL DEFAULT 'pending' | pending, sent, failed |

- 인덱스: `notification_deliveries_status_idx` on `status`
- 롤백(down) 전략: 컬럼 DROP

## 5. API 설계

| 메서드/경로 | 권한 | 요청 스키마 | 응답 스키마 | 비고 |
| --- | --- | --- | --- | --- |
| `GET /api/notification-settings` | authenticated | - | `NotificationSettingsViewSchema` | kakaoEnabled 필드 추가 |
| `PATCH /api/notification-settings` | authenticated | `UpdateNotificationSettingsBodySchema` | `NotificationSettingsViewSchema` | kakaoEnabled 필드 추가 |

### 스키마 변경

**NotificationSettingsViewSchema 변경:**
- 추가 필드: `kakaoEnabled: z.boolean()`

**UpdateNotificationSettingsBodySchema 변경:**
- 추가 필드: `kakaoEnabled: z.boolean().optional()`
- refine 조건에 `kakaoEnabled` 추가

### 에러 응답

- 400: Zod validation 실패
- 401: 미인증
- 500: DB 오류

## 6. 서비스/도메인 계층

### 6.1 solapi.ts (`app/src/server/notification/solapi.ts`) - CREATE

- Solapi SDK 클라이언트 초기화
- 환경변수: `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER_PHONE`, `SOLAPI_KAKAO_PFID`

### 6.2 kakao-templates.ts (`app/src/server/notification/kakao-templates.ts`) - CREATE

- `getKakaoVerificationApprovedTemplate(params)`: 인증 승인 알림톡 템플릿
- `getKakaoVerificationRejectedTemplate(params)`: 인증 반려 알림톡 템플릿 (반려 사유 포함)
- 각 함수는 `{ templateId: string, variables: Record<string, string> }` 반환

### 6.3 service.ts (`app/src/server/notification/service.ts`) - UPDATE

**신규 함수:**

- `sendVerificationResultNotification(params)` -> `Promise<SendNotificationResult>`
  - 입력: `{ userId, email, phone, recipientName, type, action, rejectReason? }`
  - 동작:
    1. 알림 설정 조회 (email_enabled, kakao_enabled)
    2. 활성화된 채널에 대해 `Promise.allSettled`로 병렬 발송
    3. 각 채널 결과 반환
  - 반환: `{ email: { success, error? }, kakao: { success, error? } }`

- `sendByChannel(channel, params)` -> `Promise<void>`
  - 입력: channel ('email' | 'kakao'), params
  - 동작: 채널별 발송 로직 실행

- `retryWithBackoff(fn, maxRetries, baseDelay)` -> `Promise<T>`
  - 입력: 실행 함수, 최대 재시도 횟수, 기본 딜레이
  - 동작: 실패 시 exponential backoff (2s, 4s, 8s)로 재시도
  - 재시도 횟수: 최대 3회

- `sendKakaoAlimtalk(params)` -> `Promise<SendResult>`
  - 입력: `{ phone, templateId, variables }`
  - 동작: Solapi API 호출
  - 타임아웃: 10초

**기존 함수 변경:**

- `sendVerificationResultEmail`: 내부 로직 변경 없음, `sendVerificationResultNotification`에서 호출

### 6.4 repository.ts (`app/src/server/notification/repository.ts`) - UPDATE

**변경:**

- `fetchNotificationSettings`: 반환 타입에 `kakao_enabled` 포함 (DB 스키마 변경으로 자동 반영)
- `upsertNotificationSettings`: `kakao_enabled` 필드 처리 추가
- `insertNotificationDelivery`: `retry_count`, `max_retries`, `status` 필드 처리 추가

### 6.5 mapper.ts (`app/src/server/notification/mapper.ts`) - UPDATE

**변경:**

- `mapNotificationSettingsRow`: `kakaoEnabled: row.kakao_enabled` 추가

## 7. 테스트 전략

| 구분 | 시나리오 | 도구 |
| --- | --- | --- |
| 단위 | 재시도 로직 (retryWithBackoff) | Vitest |
| 단위 | 병렬 발송 로직 (Promise.allSettled 결과 처리) | Vitest |
| 통합 | 알림 설정 API (kakaoEnabled CRUD) | Supertest |

### 검증 명령

```bash
pnpm lint
pnpm type-check
pnpm db:gen
```

## 8. 운영/배포

- 마이그레이션 적용 순서: 마이그레이션 -> 서버 코드 -> 프런트 코드
- 환경변수 설정: SOLAPI_* 환경변수 주석 해제 필요
- 롤백 절차:
  1. 프런트 코드 롤백 (카카오 토글 제거)
  2. 서버 코드 롤백 (카카오 발송 로직 제거)
  3. 마이그레이션 롤백 (kakao_enabled 컬럼 DROP)
- 기능 플래그: 불필요 (환경변수로 Solapi 비활성화 가능)

## 9. 백로그

- [ ] 리드 생성/응답 시 카카오 알림톡 발송 (2차)
- [ ] 알림 발송 대시보드 (어드민)
- [ ] SMS fallback (필요시)
- [ ] 알림톡 템플릿 Solapi 콘솔에서 생성 및 검수

---

## Progress Log (append-only)

### 2026-01-29 schema-implementer

**완료 태스크**: SCHEMA-1, SCHEMA-2
**생성/수정 파일**:
- `app/src/lib/schema/notification.ts` (UPDATE)
- `app/supabase/migrations/20260129141452_add_kakao_and_retry.sql` (CREATE)

**검증 결과**: type-check FAIL (예상됨 - mapper.ts에서 kakaoEnabled 누락, BACKEND-4에서 수정 예정)
**다음**: backend-implementer (BACKEND-1~8), frontend-implementer (FRONTEND-1~2) 실행 가능

### 2026-01-29 backend-implementer

**완료 태스크**: BACKEND-1, BACKEND-2, BACKEND-3, BACKEND-4, BACKEND-5, BACKEND-6, BACKEND-7, BACKEND-8
**생성/수정 파일**:
- `app/src/server/notification/solapi.ts` (CREATE) - Solapi SDK 클라이언트
- `app/src/server/notification/kakao-templates.ts` (CREATE) - 카카오 알림톡 템플릿 6종
- `app/src/server/notification/repository.ts` (UPDATE) - kakao_enabled, retry 컬럼 처리, updateDeliveryStatus 함수 추가
- `app/src/server/notification/mapper.ts` (UPDATE) - kakaoEnabled 매핑 추가
- `app/src/server/notification/service.ts` (UPDATE) - sendKakaoAlimtalk, retryWithBackoff, sendVerificationResult 함수 추가
- `app/src/app/api/notification-settings/route.ts` (UPDATE) - kakaoEnabled 필드 처리 추가
- `app/src/app/api/admin/verifications/[id]/approve/route.ts` (UPDATE) - sendVerificationResult로 병렬 발송
- `app/src/app/api/admin/verifications/[id]/reject/route.ts` (UPDATE) - sendVerificationResult로 병렬 발송
- `app/src/lib/database.types.ts` (UPDATE) - kakao_enabled, retry_count, max_retries, status 컬럼 타입 추가
- `package.json` (UPDATE) - solapi 패키지 추가

**검증 결과**: type-check PASS
**다음**: frontend-implementer (FRONTEND-1~2) 실행 가능
