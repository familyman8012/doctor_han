-- Review: enable doctor CRUD + photos + visibility toggle

-- 1) files.purpose: add review_photo
do $$
begin
    if not exists (
        select 1
        from pg_type t
        join pg_namespace n on n.oid = t.typnamespace
        join pg_enum e on e.enumtypid = t.oid
        where n.nspname = 'public'
            and t.typname = 'file_purpose'
            and e.enumlabel = 'review_photo'
    ) then
        alter type public.file_purpose add value 'review_photo';
    end if;
end $$;

-- 2) reviews: store photo file ids (ordered)
alter table public.reviews
    add column if not exists photo_file_ids uuid[] not null default '{}'::uuid[];

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'reviews_photo_file_ids_max'
    ) then
        alter table public.reviews
            add constraint reviews_photo_file_ids_max
            check (coalesce(array_length(photo_file_ids, 1), 0) <= 10);
    end if;
end $$;

create index if not exists reviews_photo_file_ids_gin_idx on public.reviews using gin (photo_file_ids);

-- 3) RLS: allow approved doctor to update/delete own reviews
do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
            and tablename = 'reviews'
            and policyname = 'reviews_update_doctor_own'
    ) then
        create policy reviews_update_doctor_own
        on public.reviews
        for update
        to authenticated
        using (
            doctor_user_id = auth.uid()
            and public.current_profile_role() = 'doctor'
            and public.is_approved_doctor()
        )
        with check (
            doctor_user_id = auth.uid()
            and public.current_profile_role() = 'doctor'
            and public.is_approved_doctor()
        );
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
            and tablename = 'reviews'
            and policyname = 'reviews_delete_doctor_own'
    ) then
        create policy reviews_delete_doctor_own
        on public.reviews
        for delete
        to authenticated
        using (
            doctor_user_id = auth.uid()
            and public.current_profile_role() = 'doctor'
            and public.is_approved_doctor()
        );
    end if;
end $$;

