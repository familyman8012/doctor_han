-- Support Helpdesk: 사용자 티켓 재오픈 RLS 정책 추가
-- PRD 5.3: 사용자는 resolved 상태 티켓을 재오픈(-> open) 가능

-- 기존 정책 삭제 후 재생성 (정책 이름 변경)
drop policy if exists support_tickets_update_policy on public.support_tickets;

-- UPDATE (관리자): 모든 티켓 상태 변경 가능
create policy support_tickets_update_admin_policy
on public.support_tickets
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- UPDATE (사용자): 본인 티켓 재오픈 (resolved -> open)
create policy support_tickets_update_user_reopen_policy
on public.support_tickets
for update
to authenticated
using (
    user_id = auth.uid()
    and status = 'resolved'
)
with check (
    user_id = auth.uid()
    and status = 'open'
);
