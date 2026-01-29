# Exploration: 통합 메시징 (카카오 알림톡 + 이메일 병렬 발송)

## 탐색 일시
2026-01-29

## 기능 개요
- Solapi 연동으로 카카오 알림톡/SMS 발송 추가
- 이메일 + 카카오 병렬 발송 (사용자별 ON/OFF)
- 즉시 재시도 로직 (최대 3회, exponential backoff)
- 인증 결과 + 리드 알림에 적용

---

## 1. 레이어별 관련 파일

### 1.1 UI Layer

| 파일 | 역할 | 상태 |
|------|------|------|
| `app/src/app/(main)/mypage/notifications/page.tsx` | 일반 사용자 알림 설정 페이지 | PENDING - kakao_enabled 토글 추가 필요 |
| `app/src/app/(main)/partner/notifications/page.tsx` | 파트너 알림 설정 페이지 | PENDING - kakao_enabled 토글 추가 필요 |
| `app/src/components/ui/Toggle/Toggle.tsx` | 토글 컴포넌트 | NO CHANGE |

### 1.2 API Layer

| 파일 | 역할 | 상태 |
|------|------|------|
| `app/src/app/api/notification-settings/route.ts` | 알림 설정 GET/PATCH | PENDING - kakao_enabled 필드 추가 |
| `app/src/app/api/admin/verifications/[id]/approve/route.ts` | 인증 승인 + 이메일 발송 | PENDING - 카카오 병렬 발송 추가 |
| `app/src/app/api/admin/verifications/[id]/reject/route.ts` | 인증 반려 + 이메일 발송 | PENDING - 카카오 병렬 발송 추가 |
| `app/src/app/api/leads/route.ts` | 리드 생성 | PENDING - 업체에 알림 발송 추가 |

### 1.3 Server Layer

| 파일 | 역할 | 상태 |
|------|------|------|
| `app/src/server/notification/service.ts` | 알림 발송 서비스 (sendVerificationResultEmail) | PENDING - 병렬 발송 + 재시도 로직 추가 |
| `app/src/server/notification/repository.ts` | DB 접근 (fetch, insert, upsert) | PENDING - kakao_enabled 처리 |
| `app/src/server/notification/mapper.ts` | DB row → DTO 변환 | PENDING - kakao_enabled 매핑 |
| `app/src/server/notification/resend.ts` | Resend SDK 클라이언트 | NO CHANGE |
| `app/src/server/notification/templates.ts` | 이메일 템플릿 | NO CHANGE |
| `app/src/server/notification/solapi.ts` | Solapi SDK 클라이언트 | CREATE - 신규 생성 |
| `app/src/server/notification/kakao-templates.ts` | 카카오 알림톡 템플릿 | CREATE - 신규 생성 |

### 1.4 Schema Layer

| 파일 | 역할 | 상태 |
|------|------|------|
| `app/src/lib/schema/notification.ts` | Zod 스키마 (DTO, enum) | PENDING - kakaoEnabled 필드 추가 |

### 1.5 DB Layer

| 파일 | 역할 | 상태 |
|------|------|------|
| `app/supabase/migrations/20260117120000_notification_settings.sql` | 기존 마이그레이션 | NO CHANGE (참조용) |
| `app/supabase/migrations/YYYYMMDDHHMMSS_add_kakao_and_retry.sql` | 신규 마이그레이션 | CREATE |

---

## 2. PENDING Matrix

| Layer | Status | Files |
|-------|--------|-------|
| SCHEMA | PENDING | `notification.ts` |
| DB | PENDING | 신규 마이그레이션 |
| BACKEND | PENDING | `service.ts`, `repository.ts`, `mapper.ts`, API routes |
| FRONTEND | PENDING | `mypage/notifications`, `partner/notifications` |

---

## 3. 현재 구현 상태

### 3.1 이미 구현된 것

**이메일 발송 (Resend)**:
- `sendVerificationResultEmail()` 함수
- 인증 승인/반려 시 자동 이메일 발송
- `notification_deliveries` 테이블에 발송 로그 기록
- 사용자별 알림 설정 (`email_enabled`, `verification_result_enabled`)

**DB 구조**:
- `notification_settings` 테이블 (email_enabled, lead_enabled 등)
- `notification_deliveries` 테이블 (발송 로그)
- `notification_type` enum: verification_approved, verification_rejected, lead_received, lead_responded, review_received
- `notification_channel` enum: email, **kakao**, **sms**, in_app (이미 정의됨!)

**환경 변수**:
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Solapi: `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER_PHONE`, `SOLAPI_KAKAO_PFID` (주석 처리됨)

### 3.2 미구현 사항

- 카카오 알림톡 발송 (Solapi SDK 연동)
- 채널별 사용자 설정 (`kakao_enabled` 컬럼)
- 병렬 발송 로직 (이메일 + 카카오 동시)
- 재시도 로직 (exponential backoff)
- 리드 생성/응답 시 알림 발송

---

## 4. 기존 패턴 분석

### 4.1 이메일 발송 패턴 (참조용)

```typescript
// service.ts - sendVerificationResultEmail
export async function sendVerificationResultEmail(params: {
  userId: string;
  email: string;
  type: 'doctor' | 'vendor';
  action: 'approved' | 'rejected';
  data: { ... };
}) {
  const adminSupabase = createAdminClient();

  // 1. 알림 설정 확인
  const settings = await fetchNotificationSettings(adminSupabase, userId);
  if (!settings?.email_enabled || !settings?.verification_result_enabled) {
    return { success: true }; // 의도적 스킵
  }

  // 2. 템플릿 선택
  const template = getTemplate(type, action, data);

  // 3. 발송
  try {
    const result = await resend.emails.send({ ... });

    // 4. 성공 로그
    await insertNotificationDelivery(adminSupabase, {
      userId,
      type: `verification_${action}`,
      channel: 'email',
      provider: 'resend',
      sentAt: new Date().toISOString(),
      providerResponse: result,
    });

    return { success: true };
  } catch (error) {
    // 5. 실패 로그
    await insertNotificationDelivery(adminSupabase, {
      ...
      failedAt: new Date().toISOString(),
      errorMessage: error.message,
    });

    return { success: false, error: error.message };
  }
}
```

### 4.2 UI 패턴 (알림 설정 페이지)

```tsx
// ToggleItem 컴포넌트 패턴
<ToggleItem
  icon={<Mail className="w-5 h-5 text-[#62e3d5]" />}
  label="이메일 알림 전체"
  description="모든 이메일 알림 수신 여부를 설정합니다"
  checked={data.emailEnabled}
  onChange={(v) => handleToggle("emailEnabled", v)}
  disabled={updateMutation.isPending}
/>

// 폭포식 비활성화 패턴
<ToggleItem
  ...
  disabled={!data.emailEnabled || updateMutation.isPending}
/>
```

### 4.3 외부 서비스 연동 패턴

```typescript
// resend.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@medihub.kr';
```

---

## 5. 구현 계획 (Planner 참고용)

### 5.1 DB 마이그레이션

```sql
-- notification_settings 확장
ALTER TABLE public.notification_settings
ADD COLUMN kakao_enabled boolean NOT NULL DEFAULT false;

-- notification_deliveries 재시도 지원
ALTER TABLE public.notification_deliveries
ADD COLUMN retry_count integer NOT NULL DEFAULT 0,
ADD COLUMN max_retries integer NOT NULL DEFAULT 3,
ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- 인덱스
CREATE INDEX notification_deliveries_status_idx
  ON public.notification_deliveries(status);
```

### 5.2 Solapi SDK 연동

```typescript
// solapi.ts (신규)
import { SolapiMessageService } from 'solapi';

export const solapiClient = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

export const SOLAPI_SENDER_PHONE = process.env.SOLAPI_SENDER_PHONE!;
export const SOLAPI_KAKAO_PFID = process.env.SOLAPI_KAKAO_PFID!;
```

### 5.3 병렬 발송 + 재시도 로직

```typescript
// service.ts - sendNotification (신규)
export async function sendNotification(params: {
  userId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  data: NotificationData;
}) {
  const results = await Promise.allSettled(
    channels.map(channel => sendByChannel(channel, params))
  );

  // 각 채널별 재시도 처리
  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      await retryWithBackoff(channels[index], params);
    }
  }
}

async function retryWithBackoff(channel, params, attempt = 1) {
  if (attempt > 3) return; // 최대 3회

  const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
  await sleep(delay);

  try {
    await sendByChannel(channel, params);
  } catch {
    await retryWithBackoff(channel, params, attempt + 1);
  }
}
```

---

## 6. 주요 발견 사항

1. **Enum 이미 정의됨**: `notification_channel`에 'kakao', 'sms'가 이미 포함되어 있어 enum 수정 불필요

2. **Admin 클라이언트 패턴**: 알림 설정 조회/로그 기록 시 `createAdminClient()`로 RLS 우회

3. **Best-effort 로깅**: 발송 실패해도 메인 로직 성공 반환 (사용자에게 에러 노출 안 함)

4. **Rate Limiting 시스템 존재**: `app/src/server/rate-limit/` - 필요시 알림에도 적용 가능

5. **리드 알림 미구현**: 리드 생성/응답 시 알림 발송 코드 없음 (추가 필요)
