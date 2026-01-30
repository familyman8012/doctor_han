-- Lead Messages RLS 보안 강화
-- 1) UPDATE 권한을 read_at 컬럼으로 제한
-- 2) admin 역할에 UPDATE 권한 추가

-- 1) 기존 UPDATE 정책 삭제
drop policy if exists lead_messages_update_policy on public.lead_messages;

-- 2) 새 UPDATE 정책: admin 또는 발신자가 아닌 참여자
create policy lead_messages_update_policy
on public.lead_messages
for update
to authenticated
using (
    public.is_admin()
    or (
        sender_id != auth.uid()
        and exists (
            select 1 from public.leads l
            where l.id = lead_id
            and (l.doctor_user_id = auth.uid() or public.is_vendor_owner(l.vendor_id))
        )
    )
)
with check (read_at is not null);

-- 3) authenticated 역할에 대해 UPDATE 권한을 read_at 컬럼으로 제한
revoke update on public.lead_messages from authenticated;
grant update (read_at) on public.lead_messages to authenticated;
