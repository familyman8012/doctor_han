-- review_reports: 리뷰 신고 테이블

-- Enum 타입
create type public.review_report_reason as enum (
    'spam',           -- 스팸/광고
    'inappropriate',  -- 부적절한 내용
    'false_info',     -- 허위 정보
    'privacy',        -- 개인정보 노출
    'other'           -- 기타
);

create type public.review_report_status as enum (
    'pending',        -- 검토 대기
    'reviewed',       -- 검토 완료
    'dismissed'       -- 기각
);

-- 테이블
create table public.review_reports (
    id uuid primary key default gen_random_uuid(),
    review_id uuid not null references public.reviews(id) on delete cascade,
    reporter_user_id uuid not null references public.profiles(id) on delete cascade,
    reason public.review_report_reason not null,
    detail text,
    status public.review_report_status not null default 'pending',
    reviewed_by uuid references public.profiles(id) on delete set null,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (review_id, reporter_user_id)
);

-- 인덱스
create index review_reports_review_id_idx on public.review_reports(review_id);
create index review_reports_status_idx on public.review_reports(status);

-- Trigger
create trigger review_reports_set_updated_at
before update on public.review_reports
for each row execute function public.set_updated_at();

-- RLS
alter table public.review_reports enable row level security;

create policy review_reports_insert_authenticated on public.review_reports
for insert to authenticated
with check (reporter_user_id = auth.uid());

create policy review_reports_select_own on public.review_reports
for select to authenticated
using (reporter_user_id = auth.uid());

create policy review_reports_admin_all on public.review_reports
for all to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');
