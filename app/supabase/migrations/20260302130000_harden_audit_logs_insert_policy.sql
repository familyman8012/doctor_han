-- =============================================================================
-- Migration: Harden audit_logs INSERT policy
-- Description: 사용자 컨텍스트의 직접 INSERT를 차단하고 관리자 INSERT 정책으로 복구
-- =============================================================================

-- 브랜치 통합 과정에서 완화된 정책을 제거한다.
drop policy if exists audit_logs_authenticated_insert on public.audit_logs;
drop policy if exists audit_logs_admin_insert on public.audit_logs;

-- 관리자 사용자만 user-context INSERT 가능하도록 제한한다.
-- 일반 사용자 액션 로그는 서버 service_role 경로로 기록한다.
create policy audit_logs_admin_insert
on public.audit_logs
for insert
to authenticated
with check (public.is_admin() and actor_user_id = auth.uid());
