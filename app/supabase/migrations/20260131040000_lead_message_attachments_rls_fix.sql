-- Lead Messages: attachments INSERT 정책 보강
-- - 메시지 발신자만 첨부 생성 가능
-- - 파일 소유자/목적(lead_message_attachment) 검증

drop policy if exists lead_message_attachments_insert_policy on public.lead_message_attachments;

create policy lead_message_attachments_insert_policy
on public.lead_message_attachments
for insert
to authenticated
with check (
    exists (
        select 1
        from public.lead_messages m
        join public.files f on f.id = file_id
        where m.id = message_id
            and m.sender_id = auth.uid()
            and f.owner_user_id = auth.uid()
            and f.purpose = 'lead_message_attachment'::public.file_purpose
    )
);

