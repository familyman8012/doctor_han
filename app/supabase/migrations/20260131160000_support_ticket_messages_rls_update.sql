-- Support Helpdesk: support_ticket_messages RLS/권한 보강
-- 1) 관리자 INSERT 시 sender_id 위조 방지
-- 2) UPDATE 권한을 read_at 컬럼으로 제한 (메시지 수정/삭제 불가 보장)

-- 1) 관리자 INSERT 정책 보강: sender_id는 반드시 본인(auth.uid())
drop policy if exists support_ticket_messages_insert_admin_policy on public.support_ticket_messages;

create policy support_ticket_messages_insert_admin_policy
on public.support_ticket_messages
for insert
to authenticated
with check (
    public.is_admin()
    and is_admin = true
    and sender_id = auth.uid()
);

-- 2) UPDATE 권한을 read_at 컬럼으로 제한
revoke update on public.support_ticket_messages from authenticated;
grant update (read_at) on public.support_ticket_messages to authenticated;

