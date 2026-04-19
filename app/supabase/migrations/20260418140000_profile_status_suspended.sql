-- profile_status enum에 'suspended' 추가 + 상태 변경 메타데이터 컬럼 추가
-- 관리자가 유저를 임시정지/영구정지/탈퇴 처리할 수 있도록 지원

-- 1. enum 에 suspended 추가 (기존 active/inactive/banned 유지)
alter type public.profile_status add value if not exists 'suspended';

-- 2. 상태 변경 메타데이터 컬럼
alter table public.profiles
  add column if not exists suspended_until timestamptz,
  add column if not exists status_reason text,
  add column if not exists status_changed_by uuid references public.profiles(id) on delete set null,
  add column if not exists status_changed_at timestamptz;

-- 3. 임시정지 자동 해제용 인덱스 (suspended_until이 있는 행만)
create index if not exists idx_profiles_suspended_until
  on public.profiles (suspended_until)
  where suspended_until is not null;
