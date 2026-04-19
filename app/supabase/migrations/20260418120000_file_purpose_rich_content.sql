-- file_purpose enum에 'rich_content' 추가
-- WYSIWYG 에디터에서 본문 중간에 삽입되는 이미지 파일 용도

do $$
begin
    if not exists (
        select 1
        from pg_enum e
        join pg_type t on t.oid = e.enumtypid
        where t.typname = 'file_purpose' and e.enumlabel = 'rich_content'
    ) then
        alter type public.file_purpose add value 'rich_content';
    end if;
end$$;
