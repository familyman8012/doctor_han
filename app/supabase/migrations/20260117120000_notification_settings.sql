-- Notification settings and delivery log tables

-- Enums
create type public.notification_type as enum (
	'verification_approved',
	'verification_rejected',
	'lead_received',
	'lead_responded',
	'review_received'
);

create type public.notification_channel as enum ('email', 'kakao', 'sms', 'in_app');

-- notification_settings: 사용자별 알림 설정
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

-- notification_deliveries: 발송 로그
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

-- notification_deliveries: service_role에서만 insert (RLS bypass)
-- service_role은 RLS를 우회하므로 별도 policy 불필요
