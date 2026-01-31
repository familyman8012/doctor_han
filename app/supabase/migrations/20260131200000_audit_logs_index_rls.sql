-- =============================================================================
-- Migration: audit_logs 인덱스 추가 및 RLS 정책 수정
-- Description: 감사 로그 조회 성능 개선을 위한 인덱스 5개 추가,
--              authenticated 사용자도 자신의 로그 삽입 가능하도록 RLS 정책 수정
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 인덱스 추가 (CONCURRENTLY로 잠금 최소화)
-- -----------------------------------------------------------------------------

-- 기간별 조회용 인덱스
create index concurrently if not exists idx_audit_logs_created_at
on public.audit_logs (created_at desc);

-- 액션 유형별 조회용 인덱스
create index concurrently if not exists idx_audit_logs_action
on public.audit_logs (action);

-- 대상 유형별 조회용 인덱스
create index concurrently if not exists idx_audit_logs_target_type
on public.audit_logs (target_type);

-- 행위자별 조회용 인덱스
create index concurrently if not exists idx_audit_logs_actor
on public.audit_logs (actor_user_id);

-- 대상별 조회용 복합 인덱스
create index concurrently if not exists idx_audit_logs_target
on public.audit_logs (target_type, target_id);

-- -----------------------------------------------------------------------------
-- 2. RLS 정책 수정
-- -----------------------------------------------------------------------------

-- 기존 INSERT 정책 삭제 (admin-only)
drop policy if exists audit_logs_admin_insert on public.audit_logs;

-- 새 INSERT 정책 생성 (authenticated 사용자가 자신의 로그 삽입 가능)
create policy audit_logs_authenticated_insert
on public.audit_logs
for insert
to authenticated
with check (actor_user_id = auth.uid());
