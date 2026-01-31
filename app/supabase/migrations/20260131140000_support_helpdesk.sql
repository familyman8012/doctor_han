-- Support Helpdesk: 1:1 고객지원 티켓 시스템
-- support_tickets, support_ticket_messages, support_ticket_status_history 테이블 생성
-- TSD 참조: app/doc/domains/support/helpdesk/tsd.md

-- ===========================
-- Enum Types
-- ===========================

-- 티켓 상태
create type public.support_ticket_status as enum (
    'open',        -- 접수됨
    'in_progress', -- 처리중
    'resolved',    -- 해결됨
    'closed'       -- 종료됨
);

-- notification_type에 support 관련 타입 추가
alter type public.notification_type add value if not exists 'support_ticket_created';
alter type public.notification_type add value if not exists 'support_ticket_response';
alter type public.notification_type add value if not exists 'support_ticket_resolved';

-- ===========================
-- Tables
-- ===========================

-- support_tickets: 지원 티켓
create table public.support_tickets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    category_id uuid not null references public.help_categories(id) on delete restrict,
    title text not null,
    content text not null,
    status public.support_ticket_status not null default 'open',
    first_response_at timestamptz,
    resolved_at timestamptz,
    sla_first_response_due timestamptz not null,
    sla_resolution_due timestamptz not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- support_ticket_messages: 티켓 메시지 스레드
create table public.support_ticket_messages (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references public.support_tickets(id) on delete cascade,
    sender_id uuid not null references public.profiles(id) on delete restrict,
    content text not null,
    is_admin boolean not null default false,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

-- support_ticket_status_history: 상태 변경 이력
create table public.support_ticket_status_history (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references public.support_tickets(id) on delete cascade,
    from_status public.support_ticket_status,
    to_status public.support_ticket_status not null,
    changed_by uuid not null references public.profiles(id) on delete restrict,
    note text,
    created_at timestamptz not null default now()
);

-- ===========================
-- Indexes
-- ===========================

-- support_tickets 인덱스
create index idx_support_tickets_user_id on public.support_tickets(user_id);
create index idx_support_tickets_status on public.support_tickets(status);
create index idx_support_tickets_category_id on public.support_tickets(category_id);
create index idx_support_tickets_sla_first_response_due on public.support_tickets(sla_first_response_due) where status = 'open';
create index idx_support_tickets_sla_resolution_due on public.support_tickets(sla_resolution_due) where status in ('open', 'in_progress');

-- support_ticket_messages 인덱스
create index idx_support_ticket_messages_ticket_id_created_at on public.support_ticket_messages(ticket_id, created_at asc);
create index idx_support_ticket_messages_sender_id on public.support_ticket_messages(sender_id);

-- support_ticket_status_history 인덱스
create index idx_support_ticket_status_history_ticket_id on public.support_ticket_status_history(ticket_id);

-- ===========================
-- Triggers (updated_at)
-- ===========================

create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

-- ===========================
-- RLS Enable
-- ===========================

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.support_ticket_status_history enable row level security;

-- ===========================
-- RLS Policies - support_tickets
-- ===========================

-- SELECT: 본인 티켓 또는 관리자
create policy support_tickets_select_policy
on public.support_tickets
for select
to authenticated
using (
    user_id = auth.uid()
    or public.is_admin()
);

-- INSERT: 본인만 티켓 생성
create policy support_tickets_insert_policy
on public.support_tickets
for insert
to authenticated
with check (
    user_id = auth.uid()
);

-- UPDATE: 관리자만 상태 변경 가능
create policy support_tickets_update_policy
on public.support_tickets
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ===========================
-- RLS Policies - support_ticket_messages
-- ===========================

-- SELECT: 티켓 접근 권한이 있는 사용자
create policy support_ticket_messages_select_policy
on public.support_ticket_messages
for select
to authenticated
using (
    exists (
        select 1 from public.support_tickets t
        where t.id = ticket_id
        and (t.user_id = auth.uid() or public.is_admin())
    )
);

-- INSERT (사용자): 본인 티켓에만 메시지 작성, is_admin = false
create policy support_ticket_messages_insert_user_policy
on public.support_ticket_messages
for insert
to authenticated
with check (
    sender_id = auth.uid()
    and is_admin = false
    and exists (
        select 1 from public.support_tickets t
        where t.id = ticket_id
        and t.user_id = auth.uid()
    )
);

-- INSERT (관리자): 모든 티켓에 메시지 작성, is_admin = true
create policy support_ticket_messages_insert_admin_policy
on public.support_ticket_messages
for insert
to authenticated
with check (
    public.is_admin()
    and is_admin = true
);

-- UPDATE: 읽음 표시용 (본인이 받은 메시지만, 즉 발신자가 아닌 경우)
create policy support_ticket_messages_update_policy
on public.support_ticket_messages
for update
to authenticated
using (
    sender_id != auth.uid()
    and exists (
        select 1 from public.support_tickets t
        where t.id = ticket_id
        and (t.user_id = auth.uid() or public.is_admin())
    )
)
with check (read_at is not null);

-- ===========================
-- RLS Policies - support_ticket_status_history
-- ===========================

-- SELECT: 관리자만
create policy support_ticket_status_history_select_policy
on public.support_ticket_status_history
for select
to authenticated
using (public.is_admin());

-- INSERT: 관리자만 (시스템/관리자에서 상태 이력 기록)
create policy support_ticket_status_history_insert_policy
on public.support_ticket_status_history
for insert
to authenticated
with check (public.is_admin());
