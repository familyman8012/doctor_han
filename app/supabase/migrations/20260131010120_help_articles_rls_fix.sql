-- Fix RLS policy for help_articles to exclude articles with inactive categories
-- Also add CHECK constraint for display_order >= 0

-- Drop and recreate the public read policy
drop policy if exists help_articles_select_public on public.help_articles;

create policy help_articles_select_public
on public.help_articles
for select
to anon, authenticated
using (
    is_published = true
    and (
        category_id is null
        or exists (
            select 1 from public.help_categories c
            where c.id = category_id and c.is_active = true
        )
    )
);

-- Add CHECK constraint for display_order >= 0
alter table public.help_categories
add constraint help_categories_display_order_check
check (display_order >= 0);

alter table public.help_articles
add constraint help_articles_display_order_check
check (display_order >= 0);
