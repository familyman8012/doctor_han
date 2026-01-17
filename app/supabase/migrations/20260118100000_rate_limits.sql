-- Rate limit 카운터 테이블
create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,           -- 'lead_create', 'review_create', 'file_upload', 'verification_submit'
  target_id uuid,                 -- 동일 업체 쿨다운용 (vendor_id)
  window_start timestamptz not null,
  request_count int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, action, target_id, window_start)
);

create index rate_limits_user_action_idx on public.rate_limits(user_id, action);
create index rate_limits_window_idx on public.rate_limits(window_start);

create trigger rate_limits_set_updated_at
before update on public.rate_limits
for each row execute function public.set_updated_at();

-- RLS: 본인 기록만 조회 가능 (삽입/수정은 서버에서 service_role로)
alter table public.rate_limits enable row level security;

create policy "rate_limits_select_own"
  on public.rate_limits
  for select
  using (auth.uid() = user_id);
