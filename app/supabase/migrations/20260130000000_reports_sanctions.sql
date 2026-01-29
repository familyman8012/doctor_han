-- reports & sanctions: 통합 신고 및 제재 시스템

-- ===========================
-- Enum Types
-- ===========================

-- 신고 대상 유형
create type public.report_target_type as enum (
    'review',   -- 리뷰
    'vendor',   -- 업체
    'profile'   -- 사용자
);

-- 신고 사유
create type public.report_reason as enum (
    'spam',           -- 스팸/광고
    'inappropriate',  -- 부적절한 내용
    'false_info',     -- 허위 정보
    'privacy',        -- 개인정보 노출
    'other'           -- 기타
);

-- 신고 상태
create type public.report_status as enum (
    'pending',    -- 접수 (대기)
    'reviewing',  -- 심사 중
    'resolved',   -- 처리 완료
    'dismissed'   -- 기각
);

-- 제재 유형
create type public.sanction_type as enum (
    'warning',        -- 경고
    'suspension',     -- 일시정지
    'permanent_ban'   -- 영구정지
);

-- 제재 상태
create type public.sanction_status as enum (
    'active',   -- 활성
    'expired',  -- 만료
    'revoked'   -- 해제
);

-- ===========================
-- Tables
-- ===========================

-- 신고 테이블
create table public.reports (
    id uuid primary key default gen_random_uuid(),
    target_type public.report_target_type not null,
    target_id uuid not null,
    reporter_user_id uuid not null references public.profiles(id) on delete cascade,
    reason public.report_reason not null,
    detail text,
    status public.report_status not null default 'pending',
    reviewed_by uuid references public.profiles(id) on delete set null,
    reviewed_at timestamptz,
    resolved_by uuid references public.profiles(id) on delete set null,
    resolved_at timestamptz,
    resolution_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- 동일 대상에 대해 같은 사용자가 중복 신고 방지
    unique (target_type, target_id, reporter_user_id)
);

-- 제재 테이블
create table public.sanctions (
    id uuid primary key default gen_random_uuid(),
    target_type public.report_target_type not null,
    target_id uuid not null,
    report_id uuid references public.reports(id) on delete set null,
    sanction_type public.sanction_type not null,
    status public.sanction_status not null default 'active',
    reason text not null,
    duration_days integer,
    starts_at timestamptz not null default now(),
    ends_at timestamptz,
    created_by uuid not null references public.profiles(id) on delete cascade,
    revoked_by uuid references public.profiles(id) on delete set null,
    revoked_at timestamptz,
    revoke_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ===========================
-- Indexes
-- ===========================

-- reports 인덱스
create index idx_reports_target on public.reports(target_type, target_id);
create index idx_reports_status on public.reports(status);
create index idx_reports_reporter on public.reports(reporter_user_id);

-- sanctions 인덱스
create index idx_sanctions_target on public.sanctions(target_type, target_id);
create index idx_sanctions_status on public.sanctions(status);
create index idx_sanctions_ends_at on public.sanctions(ends_at) where status = 'active';

-- ===========================
-- Triggers (updated_at)
-- ===========================

create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create trigger sanctions_set_updated_at
before update on public.sanctions
for each row execute function public.set_updated_at();

-- ===========================
-- RLS Policies
-- ===========================

alter table public.reports enable row level security;
alter table public.sanctions enable row level security;

-- reports: 일반 사용자는 본인 신고만 INSERT
create policy reports_insert_own on public.reports
for insert to authenticated
with check (reporter_user_id = auth.uid());

-- reports: 일반 사용자는 본인 신고만 SELECT
create policy reports_select_own on public.reports
for select to authenticated
using (reporter_user_id = auth.uid());

-- reports: 관리자는 전체 CRUD
create policy reports_admin_all on public.reports
for all to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

-- sanctions: 관리자만 전체 CRUD
create policy sanctions_admin_all on public.sanctions
for all to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');
