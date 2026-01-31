-- Drop redundant index on help_categories.slug
-- (the UNIQUE constraint on slug already creates an index)

drop index if exists public.idx_help_categories_slug;

