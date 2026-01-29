-- Lead Messages: 의사-업체 간 1:1 대화 기능

-- 1) Enum 확장: notification_type에 lead_message_received 추가
alter type public.notification_type add value if not exists 'lead_message_received';

-- 2) Enum 확장: file_purpose에 lead_message_attachment 추가
alter type public.file_purpose add value if not exists 'lead_message_attachment';

-- 3) lead_messages 테이블
create table public.lead_messages (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references public.leads(id) on delete cascade,
    sender_id uuid not null references public.profiles(id) on delete restrict,
    content text not null,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

-- 인덱스
create index idx_lead_messages_lead_id_created_at on public.lead_messages(lead_id, created_at asc);
create index idx_lead_messages_sender_id on public.lead_messages(sender_id);

-- 4) lead_message_attachments 테이블
create table public.lead_message_attachments (
    id uuid primary key default gen_random_uuid(),
    message_id uuid not null references public.lead_messages(id) on delete cascade,
    file_id uuid not null references public.files(id) on delete restrict,
    created_at timestamptz not null default now()
);

-- 인덱스
create index idx_lead_message_attachments_message_id on public.lead_message_attachments(message_id);

-- 5) RLS 활성화
alter table public.lead_messages enable row level security;
alter table public.lead_message_attachments enable row level security;

-- 6) lead_messages RLS 정책

-- SELECT: 관리자 또는 리드 참여자
create policy lead_messages_select_policy
on public.lead_messages
for select
to authenticated
using (
    public.is_admin()
    or exists (
        select 1 from public.leads l
        where l.id = lead_id
        and (l.doctor_user_id = auth.uid() or public.is_vendor_owner(l.vendor_id))
    )
);

-- INSERT: 리드 참여자이고 본인이 발신자
create policy lead_messages_insert_policy
on public.lead_messages
for insert
to authenticated
with check (
    sender_id = auth.uid()
    and exists (
        select 1 from public.leads l
        where l.id = lead_id
        and (l.doctor_user_id = auth.uid() or public.is_vendor_owner(l.vendor_id))
    )
);

-- UPDATE: 발신자가 아닌 참여자만 (읽음 표시용)
create policy lead_messages_update_policy
on public.lead_messages
for update
to authenticated
using (
    sender_id != auth.uid()
    and exists (
        select 1 from public.leads l
        where l.id = lead_id
        and (l.doctor_user_id = auth.uid() or public.is_vendor_owner(l.vendor_id))
    )
)
with check (read_at is not null);

-- 7) lead_message_attachments RLS 정책

-- SELECT: lead_messages와 동일 조건 (메시지 조회 가능한 사람)
create policy lead_message_attachments_select_policy
on public.lead_message_attachments
for select
to authenticated
using (
    exists (
        select 1 from public.lead_messages m
        join public.leads l on l.id = m.lead_id
        where m.id = message_id
        and (public.is_admin() or l.doctor_user_id = auth.uid() or public.is_vendor_owner(l.vendor_id))
    )
);

-- INSERT: 메시지 발신자만 (메시지 작성 시 함께 생성)
create policy lead_message_attachments_insert_policy
on public.lead_message_attachments
for insert
to authenticated
with check (
    exists (
        select 1 from public.lead_messages m
        where m.id = message_id
        and m.sender_id = auth.uid()
    )
);
