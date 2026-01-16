# Notification (이메일 알림) TSD (Implementation Plan)

## Overview

| 항목    | 내용                                                |
| ------- | --------------------------------------------------- |
| Domain  | notification                                        |
| Feature | 인증 결과 이메일 알림 + 알림 설정 UI                |
| PRD     | `app/doc/domains/notification/prd.md`               |
| TSD     | `app/doc/domains/notification/tsd.md`               |

## Write Set (변경 파일)

| 파일                                                                   | 변경   | 변경 내용 요약                                            |
| ---------------------------------------------------------------------- | ------ | --------------------------------------------------------- |
| `app/supabase/migrations/YYYYMMDDHHMMSS_notification_settings.sql`     | CREATE | notification_settings, notification_deliveries 테이블 생성 |
| `app/src/lib/database.types.ts`                                        | UPDATE | `pnpm db:gen -- --local` 실행으로 자동 갱신               |
| `app/src/lib/schema/notification.ts`                                   | CREATE | Zod 스키마 정의 (설정 조회/수정, 발송 기록 타입)          |
| `app/src/server/notification/resend.ts`                                | CREATE | Resend 클라이언트 초기화                                  |
| `app/src/server/notification/templates.ts`                             | CREATE | 이메일 템플릿 함수 (승인/반려 4종)                        |
| `app/src/server/notification/service.ts`                               | CREATE | 이메일 발송 서비스 (설정 확인 + Resend 호출 + 로그 기록)  |
| `app/src/server/notification/repository.ts`                            | CREATE | notification_settings/deliveries 조회/저장 함수           |
| `app/src/server/notification/mapper.ts`                                | CREATE | Row -> DTO 변환                                           |
| `app/src/app/api/notification-settings/route.ts`                       | CREATE | GET/PATCH 알림 설정 API                                   |
| `app/src/app/api/admin/verifications/[id]/approve/route.ts`            | UPDATE | 승인 후 이메일 발송 로직 추가                             |
| `app/src/app/api/admin/verifications/[id]/reject/route.ts`             | UPDATE | 반려 후 이메일 발송 로직 추가                             |
| `app/src/app/(main)/mypage/layout.tsx`                                 | UPDATE | 알림 설정 메뉴 추가                                       |
| `app/src/app/(main)/mypage/notifications/page.tsx`                     | CREATE | 알림 설정 UI 페이지                                       |
| `app/src/app/(main)/partner/mypage/notifications/page.tsx`             | CREATE | (업체용) 알림 설정 UI 페이지                              |
| `app/package.json`                                                     | UPDATE | resend 패키지 추가                                        |

## Impact Matrix (레이어별 영향)

| 레이어                     | 변경 여부 | 관련 파일(대표)                                                                   | 근거                                                                                                   |
| -------------------------- | --------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| UI (Pages/Components)      | UPDATE    | `app/src/app/(main)/mypage/layout.tsx`, `app/src/app/(main)/mypage/notifications/page.tsx` | PRD R7 알림 설정 UI 요구 - 마이페이지에 토글 섹션 추가 필요                                            |
| API Route                  | UPDATE    | `app/src/app/api/notification-settings/route.ts`, `approve/route.ts`, `reject/route.ts`   | PRD R5/R6 - 알림 설정 API 신규 + 승인/반려 API에 이메일 발송 로직 통합                                  |
| Schema (Zod)               | UPDATE    | `app/src/lib/schema/notification.ts`                                              | PRD R6 - `NotificationSettingsSchema`, `UpdateNotificationSettingsSchema` 신규 정의 필요               |
| Service/Repo               | UPDATE    | `app/src/server/notification/*`                                                   | PRD R1/R4/R5 - Resend 클라이언트, 이메일 템플릿, 발송 서비스, 설정/로그 repository 신규 구현           |
| DB Migration               | UPDATE    | `app/supabase/migrations/YYYYMMDDHHMMSS_notification_settings.sql`                | PRD R3/R4 - notification_settings, notification_deliveries 테이블 신규 생성                            |
| Auth/Guards                | NO CHANGE | `app/src/server/auth/guards.ts`                                                   | 기존 `withAuth` 가드 재사용 (doctor/vendor/admin 모두 알림 설정 가능) - 신규 가드 불필요               |
| RLS/Policy                 | UPDATE    | `app/supabase/migrations/YYYYMMDDHHMMSS_notification_settings.sql`                | PRD R3/R4 - notification_settings: 본인 row만 select/update, notification_deliveries: admin만 select  |
| Types (database.types.ts)  | UPDATE    | `app/src/lib/database.types.ts`                                                   | 마이그레이션 적용 후 `pnpm db:gen -- --local` 실행으로 자동 갱신                                       |

### Impact Matrix Audit (NO CHANGE 검증)

| 레이어       | 검증 근거                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| Auth/Guards  | `app/src/server/auth/guards.ts:100-107` - 기존 `withAuth`가 doctor/vendor/admin 모두 인증만 확인하므로 알림 설정 API에 그대로 사용 가능. 역할별 제한은 RLS가 담당. |

## Requirements Summary

PRD에서 추출한 핵심 요구사항:

1. **R1 이메일 발송 인프라**: Resend SDK 통합, 환경변수 `RESEND_API_KEY`/`RESEND_FROM_EMAIL` 사용
2. **R2 이메일 템플릿**: 한의사/업체 승인/반려 4종 텍스트 템플릿
3. **R3 알림 설정 DB**: `notification_settings` 테이블 + RLS
4. **R4 발송 로그 DB**: `notification_deliveries` 테이블 (운영 가시성)
5. **R5 승인/반려 API 통합**: 인증 상태 변경 시 이메일 자동 발송
6. **R6 알림 설정 API**: GET/PATCH `/api/notification-settings`
7. **R7 알림 설정 UI**: 마이페이지 토글 UI

## Task Chunking Rules (권장)

- 1 Task = 1 VALIDATE + 1 경계(레이어) 원칙
- Phase 1~3(DB/Types/Schema)은 한 번에 검증 가능
- Phase 4(Server Module)는 Resend 설정/템플릿/서비스 분리
- Phase 5(API)는 신규 API + 기존 API 수정 분리
- Phase 6(UI)는 doctor/vendor 마이페이지 분리

## Implementation Plan

### Phase 1: Database Schema (Migration + RLS)

**목표**: notification_settings, notification_deliveries 테이블 생성 및 RLS 정책 적용

**세부 내용**:

1. 마이그레이션 파일 생성: `pnpm db:new -- "notification_settings"`
2. SQL 작성:
   ```sql
   -- Enums
   create type public.notification_type as enum (
     'verification_approved',
     'verification_rejected',
     'lead_received',
     'lead_responded',
     'review_received'
   );

   create type public.notification_channel as enum ('email', 'kakao', 'sms', 'in_app');

   -- notification_settings
   create table public.notification_settings (
     user_id uuid primary key references public.profiles(id) on delete cascade,
     email_enabled boolean not null default true,
     verification_result_enabled boolean not null default true,
     lead_enabled boolean not null default true,
     marketing_enabled boolean not null default false,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   );

   create trigger notification_settings_set_updated_at
   before update on public.notification_settings
   for each row execute function public.set_updated_at();

   -- notification_deliveries
   create table public.notification_deliveries (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references public.profiles(id) on delete cascade,
     type public.notification_type not null,
     channel public.notification_channel not null,
     provider text not null,
     recipient text not null,
     subject text,
     body_preview text,
     provider_response jsonb,
     sent_at timestamptz not null default now(),
     failed_at timestamptz,
     error_message text
   );

   create index notification_deliveries_user_id_idx on public.notification_deliveries(user_id);
   create index notification_deliveries_sent_at_idx on public.notification_deliveries(sent_at);

   -- RLS
   alter table public.notification_settings enable row level security;
   alter table public.notification_deliveries enable row level security;

   -- notification_settings: 본인만 조회/수정
   create policy notification_settings_select_self
   on public.notification_settings
   for select
   to authenticated
   using (user_id = auth.uid());

   create policy notification_settings_insert_self
   on public.notification_settings
   for insert
   to authenticated
   with check (user_id = auth.uid());

   create policy notification_settings_update_self
   on public.notification_settings
   for update
   to authenticated
   using (user_id = auth.uid())
   with check (user_id = auth.uid());

   -- notification_deliveries: admin만 조회
   create policy notification_deliveries_admin_select
   on public.notification_deliveries
   for select
   to authenticated
   using (public.is_admin());

   -- notification_deliveries: 시스템(service_role)에서만 insert
   create policy notification_deliveries_service_insert
   on public.notification_deliveries
   for insert
   to service_role
   with check (true);
   ```

3. 마이그레이션 적용: `pnpm db:reset`

**검증**: `pnpm db:status`, Supabase Studio에서 테이블/RLS 확인

### Phase 2: Types Generation

**목표**: database.types.ts 갱신

**세부 내용**:
1. `pnpm db:gen -- --local` 실행
2. `notification_settings`, `notification_deliveries` 타입 생성 확인

**검증**: `pnpm type-check`

### Phase 3: Zod Schema

**목표**: 알림 설정 API 요청/응답 스키마 정의

**세부 내용**:

파일: `app/src/lib/schema/notification.ts`

```typescript
import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zUuid } from "./common";

// 알림 설정 조회 응답
export const NotificationSettingsViewSchema = z.object({
  userId: zUuid,
  emailEnabled: z.boolean(),
  verificationResultEnabled: z.boolean(),
  leadEnabled: z.boolean(),
  marketingEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type NotificationSettingsView = z.infer<typeof NotificationSettingsViewSchema>;

// 알림 설정 수정 요청
export const UpdateNotificationSettingsBodySchema = z
  .object({
    emailEnabled: z.boolean().optional(),
    verificationResultEnabled: z.boolean().optional(),
    leadEnabled: z.boolean().optional(),
    marketingEnabled: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.emailEnabled !== undefined ||
      v.verificationResultEnabled !== undefined ||
      v.leadEnabled !== undefined ||
      v.marketingEnabled !== undefined,
    { message: "수정할 필드가 없습니다." }
  );

export type UpdateNotificationSettingsBody = z.infer<typeof UpdateNotificationSettingsBodySchema>;

// API 응답
export const NotificationSettingsResponseSchema = z.object({
  code: z.literal(API_SUCCESS_CODE),
  data: z.object({
    settings: NotificationSettingsViewSchema,
  }),
  message: z.string().optional(),
});

export type NotificationSettingsResponse = z.infer<typeof NotificationSettingsResponseSchema>;

// 발송 타입 enum
export const NotificationTypeSchema = z.enum([
  "verification_approved",
  "verification_rejected",
  "lead_received",
  "lead_responded",
  "review_received",
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// 발송 채널 enum
export const NotificationChannelSchema = z.enum(["email", "kakao", "sms", "in_app"]);

export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;
```

**검증**: `pnpm type-check`, `pnpm lint`

### Phase 4: Server Module

**목표**: Resend 클라이언트, 이메일 템플릿, 발송 서비스, repository 구현

#### 4-1. Resend 클라이언트

파일: `app/src/server/notification/resend.ts`

```typescript
import "server-only";

import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("[Notification] RESEND_API_KEY is not set");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@medihub.kr";
```

#### 4-2. 이메일 템플릿

파일: `app/src/server/notification/templates.ts`

```typescript
import "server-only";

export interface VerificationEmailData {
  recipientName: string;
  type: "doctor" | "vendor";
  rejectReason?: string;
}

export function getDoctorApprovedTemplate(data: VerificationEmailData) {
  return {
    subject: "[메디허브] 한의사 인증이 승인되었습니다",
    body: `
안녕하세요, ${data.recipientName}님.

한의사 인증 신청이 승인되었습니다.

이제 메디허브의 모든 기능을 이용하실 수 있습니다.
지금 바로 로그인하여 다양한 의료 관련 업체를 만나보세요.

---
메디허브 드림
문의: support@medihub.kr
    `.trim(),
  };
}

export function getDoctorRejectedTemplate(data: VerificationEmailData) {
  return {
    subject: "[메디허브] 한의사 인증이 반려되었습니다",
    body: `
안녕하세요, ${data.recipientName}님.

한의사 인증 신청이 반려되었습니다.

[반려 사유]
${data.rejectReason || "사유 없음"}

위 사유를 확인하시고, 서류를 수정하여 다시 제출해 주세요.
로그인 후 [마이페이지 > 인증 관리]에서 재신청이 가능합니다.

---
메디허브 드림
문의: support@medihub.kr
    `.trim(),
  };
}

export function getVendorApprovedTemplate(data: VerificationEmailData) {
  return {
    subject: "[메디허브] 업체 인증이 승인되었습니다",
    body: `
안녕하세요, ${data.recipientName}님.

업체 인증 신청이 승인되었습니다.

이제 메디허브에서 한의사 고객들에게 서비스를 제공하실 수 있습니다.
지금 바로 로그인하여 업체 프로필을 완성해 보세요.

---
메디허브 드림
문의: support@medihub.kr
    `.trim(),
  };
}

export function getVendorRejectedTemplate(data: VerificationEmailData) {
  return {
    subject: "[메디허브] 업체 인증이 반려되었습니다",
    body: `
안녕하세요, ${data.recipientName}님.

업체 인증 신청이 반려되었습니다.

[반려 사유]
${data.rejectReason || "사유 없음"}

위 사유를 확인하시고, 서류를 수정하여 다시 제출해 주세요.
로그인 후 [파트너 센터 > 인증 관리]에서 재신청이 가능합니다.

---
메디허브 드림
문의: support@medihub.kr
    `.trim(),
  };
}
```

#### 4-3. Repository

파일: `app/src/server/notification/repository.ts`

```typescript
import "server-only";

import type { Database, Tables } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationSettingsRow = Tables<"notification_settings">;

// 알림 설정 조회 (없으면 null)
export async function fetchNotificationSettings(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<NotificationSettingsRow | null> {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw internalServerError("알림 설정을 조회할 수 없습니다.", {
      message: error.message,
      code: error.code,
    });
  }

  return data;
}

// 알림 설정 upsert (조회 시 없으면 기본값으로 생성)
export async function upsertNotificationSettings(
  supabase: SupabaseClient<Database>,
  userId: string,
  updates?: Partial<Omit<NotificationSettingsRow, "user_id" | "created_at" | "updated_at">>
): Promise<NotificationSettingsRow> {
  const { data, error } = await supabase
    .from("notification_settings")
    .upsert(
      {
        user_id: userId,
        email_enabled: updates?.email_enabled ?? true,
        verification_result_enabled: updates?.verification_result_enabled ?? true,
        lead_enabled: updates?.lead_enabled ?? true,
        marketing_enabled: updates?.marketing_enabled ?? false,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw internalServerError("알림 설정을 저장할 수 없습니다.", {
      message: error.message,
      code: error.code,
    });
  }

  return data;
}

// 발송 로그 기록 (service_role client 필요)
export async function insertNotificationDelivery(
  supabase: SupabaseClient<Database>,
  payload: {
    userId: string;
    type: string;
    channel: string;
    provider: string;
    recipient: string;
    subject?: string;
    bodyPreview?: string;
    providerResponse?: unknown;
    sentAt?: string;
    failedAt?: string;
    errorMessage?: string;
  }
) {
  const { error } = await supabase.from("notification_deliveries").insert({
    user_id: payload.userId,
    type: payload.type as Database["public"]["Enums"]["notification_type"],
    channel: payload.channel as Database["public"]["Enums"]["notification_channel"],
    provider: payload.provider,
    recipient: payload.recipient,
    subject: payload.subject ?? null,
    body_preview: payload.bodyPreview ?? null,
    provider_response: payload.providerResponse ?? null,
    sent_at: payload.sentAt ?? new Date().toISOString(),
    failed_at: payload.failedAt ?? null,
    error_message: payload.errorMessage ?? null,
  });

  if (error) {
    // 로그 기록 실패는 치명적이지 않으므로 경고만 출력
    console.error("[Notification] Failed to insert delivery log", error);
  }
}
```

#### 4-4. Mapper

파일: `app/src/server/notification/mapper.ts`

```typescript
import "server-only";

import type { NotificationSettingsRow } from "./repository";
import type { NotificationSettingsView } from "@/lib/schema/notification";

export function mapNotificationSettingsRow(row: NotificationSettingsRow): NotificationSettingsView {
  return {
    userId: row.user_id,
    emailEnabled: row.email_enabled,
    verificationResultEnabled: row.verification_result_enabled,
    leadEnabled: row.lead_enabled,
    marketingEnabled: row.marketing_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

#### 4-5. Service

파일: `app/src/server/notification/service.ts`

```typescript
import "server-only";

import type { Database } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resend, RESEND_FROM_EMAIL } from "./resend";
import {
  getDoctorApprovedTemplate,
  getDoctorRejectedTemplate,
  getVendorApprovedTemplate,
  getVendorRejectedTemplate,
  type VerificationEmailData,
} from "./templates";
import { fetchNotificationSettings, insertNotificationDelivery } from "./repository";

interface SendVerificationEmailParams {
  userId: string;
  email: string;
  recipientName: string;
  type: "doctor" | "vendor";
  action: "approved" | "rejected";
  rejectReason?: string;
}

/**
 * 인증 결과 이메일 발송
 * - 사용자의 알림 설정 확인
 * - Resend API 호출
 * - 발송 로그 기록
 */
export async function sendVerificationResultEmail(
  supabase: SupabaseClient<Database>,
  params: SendVerificationEmailParams
): Promise<void> {
  const { userId, email, recipientName, type, action, rejectReason } = params;

  // 1. 알림 설정 확인
  const settings = await fetchNotificationSettings(supabase, userId);

  // 설정이 없거나 비활성화된 경우 발송하지 않음
  if (settings && (!settings.email_enabled || !settings.verification_result_enabled)) {
    console.log(`[Notification] Email disabled for user ${userId}`);
    return;
  }

  // 2. 템플릿 선택
  const templateData: VerificationEmailData = {
    recipientName,
    type,
    rejectReason,
  };

  let template: { subject: string; body: string };

  if (type === "doctor") {
    template =
      action === "approved"
        ? getDoctorApprovedTemplate(templateData)
        : getDoctorRejectedTemplate(templateData);
  } else {
    template =
      action === "approved"
        ? getVendorApprovedTemplate(templateData)
        : getVendorRejectedTemplate(templateData);
  }

  // 3. Resend API 호출
  const notificationType = action === "approved" ? "verification_approved" : "verification_rejected";
  const adminSupabase = createSupabaseAdminClient();

  try {
    const result = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: template.subject,
      text: template.body,
    });

    // 4. 성공 로그 기록
    await insertNotificationDelivery(adminSupabase, {
      userId,
      type: notificationType,
      channel: "email",
      provider: "resend",
      recipient: email,
      subject: template.subject,
      bodyPreview: template.body.slice(0, 200),
      providerResponse: result,
      sentAt: new Date().toISOString(),
    });

    console.log(`[Notification] Email sent to ${email}`, result);
  } catch (error) {
    // 5. 실패 로그 기록 (사용자에게는 에러 노출하지 않음)
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await insertNotificationDelivery(adminSupabase, {
      userId,
      type: notificationType,
      channel: "email",
      provider: "resend",
      recipient: email,
      subject: template.subject,
      bodyPreview: template.body.slice(0, 200),
      failedAt: new Date().toISOString(),
      errorMessage,
    });

    console.error(`[Notification] Email failed for ${email}`, error);
    // 에러를 던지지 않음 - 승인/반려 처리는 계속 진행
  }
}
```

**검증**: `pnpm type-check`, `pnpm lint`

### Phase 5: API Layer

#### 5-1. 알림 설정 API (신규)

파일: `app/src/app/api/notification-settings/route.ts`

```typescript
import { UpdateNotificationSettingsBodySchema } from "@/lib/schema/notification";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { mapNotificationSettingsRow } from "@/server/notification/mapper";
import { fetchNotificationSettings, upsertNotificationSettings } from "@/server/notification/repository";

// GET /api/notification-settings
export const GET = withApi(
  withAuth(async (ctx) => {
    let settings = await fetchNotificationSettings(ctx.supabase, ctx.user.id);

    // 설정이 없으면 기본값으로 생성
    if (!settings) {
      settings = await upsertNotificationSettings(ctx.supabase, ctx.user.id);
    }

    return ok({ settings: mapNotificationSettingsRow(settings) });
  })
);

// PATCH /api/notification-settings
export const PATCH = withApi(
  withAuth(async (ctx) => {
    const body = UpdateNotificationSettingsBodySchema.parse(await ctx.req.json());

    const settings = await upsertNotificationSettings(ctx.supabase, ctx.user.id, {
      email_enabled: body.emailEnabled,
      verification_result_enabled: body.verificationResultEnabled,
      lead_enabled: body.leadEnabled,
      marketing_enabled: body.marketingEnabled,
    });

    return ok({ settings: mapNotificationSettingsRow(settings) });
  })
);
```

#### 5-2. 승인 API 수정

파일: `app/src/app/api/admin/verifications/[id]/approve/route.ts` (기존 파일 수정)

**변경 포인트**:
- 승인 처리 후 `sendVerificationResultEmail` 호출 추가
- 사용자 이메일/이름 조회 로직 추가

```typescript
// import 추가
import { sendVerificationResultEmail } from "@/server/notification/service";

// POST 핸들러 내부, 승인 처리 성공 후 (return ok(...) 직전)
// doctor 승인 후:
const { data: profile } = await ctx.supabase
  .from("profiles")
  .select("display_name, email")
  .eq("id", data.user_id)
  .single();

if (profile?.email) {
  await sendVerificationResultEmail(ctx.supabase, {
    userId: data.user_id,
    email: profile.email,
    recipientName: profile.display_name || "회원",
    type: "doctor",
    action: "approved",
  });
}

// vendor 승인 후 동일하게 추가 (type: "vendor")
```

#### 5-3. 반려 API 수정

파일: `app/src/app/api/admin/verifications/[id]/reject/route.ts` (기존 파일 수정)

**변경 포인트**:
- 반려 처리 후 `sendVerificationResultEmail` 호출 추가
- `rejectReason` 포함

```typescript
// import 추가
import { sendVerificationResultEmail } from "@/server/notification/service";

// POST 핸들러 내부, 반려 처리 성공 후 (return ok(...) 직전)
// doctor 반려 후:
const { data: profile } = await ctx.supabase
  .from("profiles")
  .select("display_name, email")
  .eq("id", data.user_id)
  .single();

if (profile?.email) {
  await sendVerificationResultEmail(ctx.supabase, {
    userId: data.user_id,
    email: profile.email,
    recipientName: profile.display_name || "회원",
    type: "doctor",
    action: "rejected",
    rejectReason: body.reason,
  });
}

// vendor 반려 후 동일하게 추가 (type: "vendor")
```

**검증**: `pnpm type-check`, `pnpm lint`, `pnpm test`

### Phase 6: UI Layer

#### 6-1. 마이페이지 레이아웃 수정

파일: `app/src/app/(main)/mypage/layout.tsx`

**변경 포인트**:
- NAV_ITEMS에 알림 설정 메뉴 추가

```typescript
import { Bell } from "lucide-react";

const NAV_ITEMS = [
  { href: "/mypage", label: "프로필", icon: User, exact: true },
  { href: "/mypage/leads", label: "내 문의함", icon: FileText },
  { href: "/mypage/favorites", label: "찜 목록", icon: Heart },
  { href: "/mypage/reviews", label: "내 리뷰", icon: Star },
  { href: "/mypage/notifications", label: "알림 설정", icon: Bell },  // 추가
  { href: "/mypage/settings", label: "계정 설정", icon: Settings },
];
```

#### 6-2. 알림 설정 페이지 (한의사용)

파일: `app/src/app/(main)/mypage/notifications/page.tsx`

```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Mail, Shield, Megaphone, MessageSquare } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { toast } from "sonner";
import type { NotificationSettingsResponse } from "@/lib/schema/notification";

interface ToggleItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleItem({ icon, label, description, checked, onChange, disabled }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#62e3d5]/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="font-medium text-[#0a3b41]">{label}</p>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-[#62e3d5]" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const res = await api.get<NotificationSettingsResponse>("/api/notification-settings");
      return res.data.data.settings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: {
      emailEnabled?: boolean;
      verificationResultEnabled?: boolean;
      leadEnabled?: boolean;
      marketingEnabled?: boolean;
    }) => {
      const res = await api.patch<NotificationSettingsResponse>("/api/notification-settings", updates);
      return res.data.data.settings;
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(["notification-settings"], newSettings);
      toast.success("알림 설정이 변경되었습니다");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">알림 설정을 불러올 수 없습니다.</p>
      </div>
    );
  }

  const handleToggle = (key: keyof typeof data, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0a3b41]">알림 설정</h1>
        <p className="text-gray-500 mt-1">이메일 알림 수신 여부를 관리합니다</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ToggleItem
          icon={<Mail className="w-5 h-5 text-[#62e3d5]" />}
          label="이메일 알림 전체"
          description="모든 이메일 알림 수신 여부를 설정합니다"
          checked={data.emailEnabled}
          onChange={(v) => handleToggle("emailEnabled", v)}
          disabled={updateMutation.isPending}
        />

        <ToggleItem
          icon={<Shield className="w-5 h-5 text-[#62e3d5]" />}
          label="인증 결과 알림"
          description="한의사 인증 승인/반려 시 이메일을 받습니다"
          checked={data.verificationResultEnabled}
          onChange={(v) => handleToggle("verificationResultEnabled", v)}
          disabled={updateMutation.isPending || !data.emailEnabled}
        />

        <ToggleItem
          icon={<MessageSquare className="w-5 h-5 text-[#62e3d5]" />}
          label="리드 관련 알림"
          description="문의 응답 및 진행 상태 알림을 받습니다"
          checked={data.leadEnabled}
          onChange={(v) => handleToggle("leadEnabled", v)}
          disabled={updateMutation.isPending || !data.emailEnabled}
        />

        <ToggleItem
          icon={<Megaphone className="w-5 h-5 text-[#62e3d5]" />}
          label="마케팅 알림"
          description="프로모션 및 이벤트 소식을 받습니다"
          checked={data.marketingEnabled}
          onChange={(v) => handleToggle("marketingEnabled", v)}
          disabled={updateMutation.isPending || !data.emailEnabled}
        />
      </div>

      <p className="text-xs text-gray-400">
        * 이메일 알림 전체를 끄면 하위 알림도 수신하지 않습니다.
      </p>
    </div>
  );
}
```

#### 6-3. (선택) 업체용 알림 설정 페이지

파일: `app/src/app/(main)/partner/mypage/notifications/page.tsx`

- 한의사용과 동일한 구조
- 문구만 "업체 인증" 등으로 변경

**검증**: `pnpm lint`, `pnpm type-check`, 브라우저에서 UI 확인

### Phase 7: Package & Validation

**목표**: resend 패키지 설치 및 전체 검증

**세부 내용**:

1. 패키지 설치:
   ```bash
   cd app
   pnpm add resend
   ```

2. 환경변수 확인:
   - `.env.local`에 `RESEND_API_KEY`, `RESEND_FROM_EMAIL` 설정

3. 전체 검증:
   ```bash
   cd app
   pnpm lint
   pnpm type-check
   pnpm test
   pnpm build
   ```

## Step-by-Step Tasks

| # | Phase | Task | 선행 | 검증 |
|---|-------|------|------|------|
| 1 | 1 | 마이그레이션 파일 생성 및 SQL 작성 | - | `pnpm db:reset` 성공 |
| 2 | 2 | `pnpm db:gen -- --local` 실행 | 1 | `pnpm type-check` |
| 3 | 3 | Zod 스키마 작성 (`notification.ts`) | 2 | `pnpm type-check` |
| 4 | 4-1 | Resend 클라이언트 초기화 | 3 | `pnpm type-check` |
| 5 | 4-2 | 이메일 템플릿 함수 작성 | 4 | `pnpm type-check` |
| 6 | 4-3 | Repository 함수 작성 | 5 | `pnpm type-check` |
| 7 | 4-4 | Mapper 함수 작성 | 6 | `pnpm type-check` |
| 8 | 4-5 | Service 함수 작성 | 7 | `pnpm type-check`, `pnpm lint` |
| 9 | 5-1 | 알림 설정 API 신규 작성 | 8 | `pnpm type-check` |
| 10 | 5-2 | 승인 API 수정 (이메일 발송 추가) | 8 | `pnpm type-check` |
| 11 | 5-3 | 반려 API 수정 (이메일 발송 추가) | 8 | `pnpm type-check` |
| 12 | 6-1 | 마이페이지 레이아웃 수정 | 9 | 브라우저 확인 |
| 13 | 6-2 | 알림 설정 UI 페이지 작성 | 12 | 브라우저 확인 |
| 14 | 7 | resend 패키지 설치 + 전체 검증 | 13 | `pnpm build` 성공 |

## Validation Commands

```bash
cd app

# Phase 1: DB 마이그레이션
pnpm db:new -- "notification_settings"
# SQL 작성 후
pnpm db:reset

# Phase 2: 타입 생성
pnpm db:gen -- --local

# Phase 3-6: 코드 검증
pnpm lint
pnpm type-check
pnpm test

# Phase 7: 빌드 검증
pnpm build
```

## Done When (Completion Criteria)

- [ ] `notification_settings` 테이블이 생성되고 RLS 정책이 적용됨
- [ ] `notification_deliveries` 테이블이 생성되고 admin만 조회 가능
- [ ] `GET /api/notification-settings`가 현재 사용자의 알림 설정을 반환함
- [ ] `PATCH /api/notification-settings`가 알림 설정을 변경함
- [ ] 관리자가 한의사 인증을 승인하면 해당 한의사에게 승인 이메일이 발송됨
- [ ] 관리자가 업체 인증을 반려하면 해당 업체에게 반려 이메일(사유 포함)이 발송됨
- [ ] 사용자가 알림 설정에서 "인증 결과 알림"을 off로 설정하면 이메일이 발송되지 않음
- [ ] 이메일 발송 실패 시 `notification_deliveries`에 에러 로그가 기록됨
- [ ] 마이페이지에 "알림 설정" 메뉴가 표시됨
- [ ] `pnpm lint && pnpm type-check && pnpm test && pnpm build` 모두 성공

## Progress Log (append-only)

| 시각 | 단계 | 상태 | 비고 |
|------|------|------|------|
| - | TSD 작성 | 완료 | PRD 분석 및 구현 계획 수립 |
