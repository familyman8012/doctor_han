-- Add avatar_url to profiles for user/vendor identity UI.

alter table public.profiles
    add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is 'Profile avatar URL (public or signed).';
