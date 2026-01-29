# Exploration Report: 리드 Q&A 메시지

## 0. PENDING Matrix

| Layer | Status | Related Files |
|-------|--------|---------------|
| DB/Migration | PENDING | `supabase/migrations/` (신규 테이블 필요) |
| Schema (Zod) | PENDING | `app/src/lib/schema/lead.ts` (메시지 스키마 추가) |
| API Route | PENDING | `app/src/app/api/leads/[id]/messages/` (신규) |
| Server (Service/Repo) | PENDING | `app/src/server/lead/` (메시지 로직 추가) |
| API Client | PENDING | `app/src/api-client/leads.ts` (메시지 API 추가) |
| UI Pages | PENDING | `app/src/app/(main)/mypage/leads/[id]/`, `app/src/app/(main)/partner/leads/[id]/` |
| UI Components | PENDING | 신규 메시지 컴포넌트 필요 |
| Tests | PENDING | 테스트 작성 필요 |

## 1. 기존 리드 시스템 구조

### 1.1 DB 테이블

#### leads
```sql
create table public.leads (
    id uuid primary key default gen_random_uuid(),
    doctor_user_id uuid not null references public.profiles(id),
    vendor_id uuid not null references public.vendors(id),
    service_name text,
    contact_name text,
    contact_phone text,
    contact_email text,
    preferred_channel text,
    preferred_time text,
    content text,
    status public.lead_status not null default 'submitted',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
```

#### lead_status enum
```
submitted | in_progress | quote_pending | negotiating | contracted | hold | canceled | closed
```

#### lead_status_history
```sql
create table public.lead_status_history (
    id uuid primary key,
    lead_id uuid references leads,
    from_status lead_status,
    to_status lead_status,
    changed_by uuid references profiles,
    created_at timestamptz
);
```

#### lead_attachments
```sql
create table public.lead_attachments (
    id uuid primary key,
    lead_id uuid references leads on delete cascade,
    file_id uuid references files on delete restrict,
    created_by uuid references profiles,
    created_at timestamptz
);
```

### 1.2 기존 API 엔드포인트

| Method | Path | Description | Guard |
|--------|------|-------------|-------|
| GET | /api/leads | 리드 목록 조회 | withAuth |
| POST | /api/leads | 리드 생성 | withApprovedDoctor |
| GET | /api/leads/[id] | 리드 상세 조회 | withAuth |
| PATCH | /api/leads/[id]/status | 상태 변경 | withAuth |

### 1.3 RLS 정책 패턴

```sql
-- 참여자 기반 접근 제어
-- Doctor: doctor_user_id = auth.uid()
-- Vendor: is_vendor_owner(vendor_id)
-- Admin: is_admin()

create policy lead_status_history_select_participants
on public.lead_status_history
for select
using (
    public.is_admin()
    or exists (
        select 1 from public.leads l
        where l.id = lead_id
        and (l.doctor_user_id = auth.uid() or public.is_vendor_owner(l.vendor_id))
    )
);
```

### 1.4 알림 시스템

#### notification_type enum
```
verification_approved | verification_rejected | lead_received | lead_responded | review_received
```

#### notification_channel enum
```
email | kakao | sms | in_app
```

#### 알림 설정 (notification_settings)
- `email_enabled` (default: true)
- `kakao_enabled` (default: false)
- `lead_enabled` (default: true)

#### 통합 메시징 서비스
- `app/src/server/notification/service.ts`
- Email (Resend) + Kakao (Solapi) 병렬 발송
- Exponential backoff 재시도 (최대 3회)
- `notification_deliveries` 테이블에 발송 로그

### 1.5 file_purpose enum
```
doctor_license | vendor_business_license | portfolio | lead_attachment | avatar | review_photo
```
> `lead_attachment` 이미 포함됨

## 2. UI 레이어 현황

### 2.1 리드 상세 페이지 구조

#### 의사 페이지
- 경로: `app/src/app/(main)/mypage/leads/[id]/page.tsx`
- 구성: 브레드크럼 + 상태 배지 + 문의 내용 + 연락처 + 첨부파일 + 상태 이력
- 컴포넌트: `LeadAttachments`, `LeadStatusHistory`

#### 업체 페이지
- 경로: `app/src/app/(main)/partner/leads/[id]/page.tsx`
- 구성: 위와 동일 + `StatusChangeModal` (상태 변경 기능)

### 2.2 탭 컴포넌트 패턴
- 경로: `app/src/components/ui/Tab/Tab.tsx`
- Framer Motion 애니메이션
- Badge로 숫자 라벨 표시 가능

```typescript
interface TabsProps {
    id: string;
    tabs: BaseTabProps[];  // { title, label? }
    activeTabIndex: number;
    onTabChange?: (index: number) => void;
}
```

### 2.3 첨부파일 컴포넌트
- 경로: `app/src/app/(main)/mypage/leads/[id]/components/Attachments.tsx`
- 파일 다운로드: `/api/files/signed-download`
- 파일별 로딩 상태 관리

### 2.4 API 클라이언트
- 경로: `app/src/api-client/leads.ts`
- 메서드: `list`, `create`, `getDetail`, `updateStatus`

## 3. Server 레이어 현황

### 3.1 가드 함수
- 경로: `app/src/server/auth/guards.ts`
- `withAuth`: 기본 인증
- `withApprovedDoctor`: 승인된 의사만
- `withApprovedVendor`: 승인된 업체만

### 3.2 리드 Repository/Mapper
- 경로: `app/src/server/lead/repository.ts`, `mapper.ts`
- `fetchLeadDetail()`: 리드 + 상태이력 + 첨부파일 병렬 조회

### 3.3 에러 처리
- 경로: `app/src/server/api/errors.ts`, `response.ts`, `with-api.ts`
- `ok()`, `created()`, `fail()`
- `badRequest()`, `notFound()`, `forbidden()`, `tooManyRequests()`

## 4. Zod 스키마 현황

### 4.1 리드 스키마
- 경로: `app/src/lib/schema/lead.ts`

```typescript
LeadStatusSchema
LeadAttachmentSchema
LeadStatusHistorySchema
LeadListItemSchema
LeadDetailSchema
LeadCreateBodySchema
LeadListQuerySchema
LeadStatusPatchBodySchema
```

### 4.2 알림 스키마
- 경로: `app/src/lib/schema/notification.ts`

```typescript
NotificationTypeSchema
NotificationChannelSchema
NotificationSettingsSchema
```

## 5. 신규 구현 필요 사항

### 5.1 DB 마이그레이션

#### lead_messages 테이블 (신규)
```sql
create table public.lead_messages (
    id uuid primary key,
    lead_id uuid references leads on delete cascade,
    sender_id uuid references profiles,  -- 발신자 (의사 또는 업체 담당자)
    content text not null,
    read_at timestamptz,  -- 읽음 시간 (null이면 안 읽음)
    created_at timestamptz default now()
);
```

#### lead_message_attachments 테이블 (신규)
```sql
create table public.lead_message_attachments (
    id uuid primary key,
    message_id uuid references lead_messages on delete cascade,
    file_id uuid references files on delete restrict,
    created_at timestamptz default now()
);
```

#### notification_type enum 확장
```sql
alter type public.notification_type add value 'lead_message_received';
```

#### file_purpose enum 확장
```sql
alter type public.file_purpose add value 'lead_message_attachment';
```

### 5.2 RLS 정책 (신규)

```sql
-- lead_messages: 리드 참여자만 조회/생성
create policy lead_messages_select_participants
on public.lead_messages for select
using (
    is_admin() or exists (
        select 1 from leads l
        where l.id = lead_id
        and (l.doctor_user_id = auth.uid() or is_vendor_owner(l.vendor_id))
    )
);

create policy lead_messages_insert_participants
on public.lead_messages for insert
with check (
    sender_id = auth.uid() and exists (
        select 1 from leads l
        where l.id = lead_id
        and (l.doctor_user_id = auth.uid() or is_vendor_owner(l.vendor_id))
    )
);

-- 읽음 표시: 수신자만 업데이트 가능
create policy lead_messages_update_read
on public.lead_messages for update
using (sender_id != auth.uid())  -- 발신자가 아닌 사람만
with check (read_at is not null);  -- read_at만 업데이트 가능하도록
```

### 5.3 API 엔드포인트 (신규)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/leads/[id]/messages | 메시지 목록 조회 (페이지네이션) |
| POST | /api/leads/[id]/messages | 메시지 발송 |
| PATCH | /api/leads/[id]/messages/read | 읽음 표시 (bulk) |

### 5.4 Zod 스키마 (신규)

```typescript
// lead.ts에 추가
LeadMessageSchema
LeadMessageAttachmentSchema
LeadMessageCreateBodySchema
LeadMessagesListQuerySchema
LeadMessagesListResponseSchema
LeadMessageReadPatchBodySchema
```

### 5.5 UI 컴포넌트 (신규)

- `LeadMessagesTab` - 대화 탭 컨테이너
- `MessageList` - 메시지 목록
- `MessageBubble` - 개별 메시지 (발신/수신 구분)
- `MessageInput` - 메시지 입력 + 첨부파일
- `MessageAttachments` - 메시지 첨부파일 목록

## 6. Planner 참고사항

### 6.1 재사용 가능한 패턴
- RLS: `lead_status_history_select_participants` 패턴 그대로 적용
- 첨부파일: `lead_attachments` 패턴 그대로 적용
- 알림: `sendVerificationResult()` 패턴 참조하여 메시지 알림 구현

### 6.2 주의사항
- 읽음 표시는 **수신자만** 업데이트 가능해야 함
- 메시지 삭제 기능은 Non-Goal (PRD 확인)
- 관리자는 열람만 가능 (메시지 작성 불가)

### 6.3 파일 경로
- DB: `app/supabase/migrations/`
- Schema: `app/src/lib/schema/lead.ts`
- API: `app/src/app/api/leads/[id]/messages/`
- Server: `app/src/server/lead/`
- UI (의사): `app/src/app/(main)/mypage/leads/[id]/`
- UI (업체): `app/src/app/(main)/partner/leads/[id]/`
- API Client: `app/src/api-client/leads.ts`
