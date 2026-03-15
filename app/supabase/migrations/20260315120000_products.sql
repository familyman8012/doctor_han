-- Products: 상품 중심 아키텍처 (크몽 모델)
-- 의료기기, 간판, 전자차트, 마케팅, 세무/노무, 홈페이지 카테고리에 적용
-- 원외탕전, 인테리어는 기존 업체 중심 유지

-- ==============================
-- 1. Enum
-- ==============================

create type public.product_status as enum (
  'draft',
  'pending_review',
  'active',
  'inactive',
  'rejected'
);

-- ==============================
-- 2. categories.listing_type
-- ==============================

alter table public.categories
  add column listing_type text not null default 'vendor'
  constraint categories_listing_type_check check (listing_type in ('vendor', 'product'));

update public.categories
  set listing_type = 'product'
  where slug in ('medical-devices', 'signage', 'emr', 'marketing', 'tax-labor', 'website')
    and depth = 1;

-- 하위 카테고리도 부모 따라감
update public.categories c
  set listing_type = 'product'
  from public.categories p
  where c.parent_id = p.id
    and p.listing_type = 'product';

-- ==============================
-- 3. products 테이블
-- ==============================

create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null constraint products_title_nonempty check (length(trim(title)) > 0),
  summary text,
  description text,
  price_type text not null default 'fixed'
    constraint products_price_type_check check (price_type in ('fixed', 'range', 'negotiable', 'contact')),
  price_min integer,
  price_max integer,
  price_unit text,
  rating_avg numeric(3,2) not null default 0,
  review_count integer not null default 0,
  view_count integer not null default 0,
  inquiry_count integer not null default 0,
  sort_order integer not null default 0,
  status public.product_status not null default 'draft',
  rejection_reason text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_price_range_valid
    check (price_min is null or price_max is null or price_min <= price_max)
);

create index products_vendor_id_idx on public.products(vendor_id);
create index products_category_id_idx on public.products(category_id);
create index products_status_idx on public.products(status);
create index products_category_status_idx on public.products(category_id, status);
create index products_vendor_status_idx on public.products(vendor_id, status);
create index products_published_at_idx on public.products(published_at desc nulls last);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ==============================
-- 4. product_images 테이블
-- ==============================

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  file_id uuid references public.files(id) on delete set null,
  url text,
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint product_images_source_check
    check (file_id is not null or url is not null)
);

create index product_images_product_id_idx on public.product_images(product_id);

-- ==============================
-- 5. product_faqs 테이블
-- ==============================

create table public.product_faqs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  question text not null constraint product_faqs_question_nonempty check (length(trim(question)) > 0),
  answer text not null constraint product_faqs_answer_nonempty check (length(trim(answer)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_faqs_product_id_idx on public.product_faqs(product_id);

create trigger product_faqs_set_updated_at
  before update on public.product_faqs
  for each row execute function public.set_updated_at();

-- ==============================
-- 6. product_favorites 테이블
-- ==============================

create table public.product_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index product_favorites_product_id_idx on public.product_favorites(product_id);

-- ==============================
-- 7. product_recent_views 테이블
-- ==============================

create table public.product_recent_views (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  view_count integer not null default 1,
  last_viewed_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index product_recent_views_last_viewed_at_idx on public.product_recent_views(last_viewed_at desc);

-- ==============================
-- 8. leads.product_id (nullable)
-- ==============================

alter table public.leads
  add column product_id uuid references public.products(id) on delete set null;

create index leads_product_id_idx on public.leads(product_id);

-- ==============================
-- 9. reviews.product_id (nullable)
-- ==============================

alter table public.reviews
  add column product_id uuid references public.products(id) on delete set null;

create index reviews_product_id_idx on public.reviews(product_id);

-- ==============================
-- 10. Product rating aggregation
-- ==============================

create or replace function public.refresh_product_rating(target_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  avg_r numeric;
  cnt integer;
begin
  select
    round(avg(r.rating)::numeric, 2),
    count(*)
  into avg_r, cnt
  from public.reviews r
  where r.product_id = target_product_id
    and r.status = 'published';

  update public.products
  set
    rating_avg = coalesce(avg_r, 0),
    review_count = cnt,
    updated_at = now()
  where id = target_product_id;
end;
$$;

create or replace function public.tg_refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  pid = coalesce(new.product_id, old.product_id);
  if pid is not null then
    perform public.refresh_product_rating(pid);
  end if;
  return null;
end;
$$;

create trigger reviews_refresh_product_rating
  after insert or update or delete on public.reviews
  for each row execute function public.tg_refresh_product_rating();

-- ==============================
-- 11. Helper functions
-- ==============================

create or replace function public.is_product_owner(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.products p
    join public.vendors v on v.id = p.vendor_id
    where p.id = p_product_id
      and v.owner_user_id = auth.uid()
  );
$$;

grant execute on function public.is_product_owner(uuid) to anon, authenticated;
grant execute on function public.refresh_product_rating(uuid) to authenticated;

-- ==============================
-- 12. file_purpose 확장
-- ==============================

alter type public.file_purpose add value if not exists 'product_image';

-- ==============================
-- 13. RLS: products
-- ==============================

alter table public.products enable row level security;

create policy products_select_active
on public.products
for select
to anon, authenticated
using (status = 'active');

create policy products_select_owner
on public.products
for select
to authenticated
using (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id
      and v.owner_user_id = auth.uid()
  )
);

create policy products_admin_select
on public.products
for select
to authenticated
using (public.is_admin());

create policy products_insert_owner
on public.products
for insert
to authenticated
with check (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id
      and v.owner_user_id = auth.uid()
  )
  and public.current_profile_role() = 'vendor'
);

create policy products_update_owner
on public.products
for update
to authenticated
using (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id
      and v.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id
      and v.owner_user_id = auth.uid()
  )
);

create policy products_delete_owner
on public.products
for delete
to authenticated
using (
  exists (
    select 1 from public.vendors v
    where v.id = vendor_id
      and v.owner_user_id = auth.uid()
  )
);

create policy products_admin_all
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ==============================
-- 14. RLS: product_images
-- ==============================

alter table public.product_images enable row level security;

create policy product_images_select_public
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and p.status = 'active'
  )
);

create policy product_images_select_owner
on public.product_images
for select
to authenticated
using (public.is_product_owner(product_id));

create policy product_images_owner_all
on public.product_images
for all
to authenticated
using (public.is_product_owner(product_id) or public.is_admin())
with check (public.is_product_owner(product_id) or public.is_admin());

-- ==============================
-- 15. RLS: product_faqs
-- ==============================

alter table public.product_faqs enable row level security;

create policy product_faqs_select_public
on public.product_faqs
for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and p.status = 'active'
  )
);

create policy product_faqs_select_owner
on public.product_faqs
for select
to authenticated
using (public.is_product_owner(product_id));

create policy product_faqs_owner_all
on public.product_faqs
for all
to authenticated
using (public.is_product_owner(product_id) or public.is_admin())
with check (public.is_product_owner(product_id) or public.is_admin());

-- ==============================
-- 16. RLS: product_favorites
-- ==============================

alter table public.product_favorites enable row level security;

create policy product_favorites_select_own
on public.product_favorites
for select
to authenticated
using (user_id = auth.uid());

create policy product_favorites_insert_own
on public.product_favorites
for insert
to authenticated
with check (user_id = auth.uid());

create policy product_favorites_delete_own
on public.product_favorites
for delete
to authenticated
using (user_id = auth.uid());

-- ==============================
-- 17. RLS: product_recent_views
-- ==============================

alter table public.product_recent_views enable row level security;

create policy product_recent_views_select_own
on public.product_recent_views
for select
to authenticated
using (user_id = auth.uid());

create policy product_recent_views_upsert_own
on public.product_recent_views
for insert
to authenticated
with check (user_id = auth.uid());

create policy product_recent_views_update_own
on public.product_recent_views
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy product_recent_views_delete_own
on public.product_recent_views
for delete
to authenticated
using (user_id = auth.uid());

-- ==============================
-- 18. Grants
-- ==============================

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;
grant select on public.product_faqs to anon, authenticated;
grant insert, update, delete on public.product_faqs to authenticated;
grant select, insert, delete on public.product_favorites to authenticated;
grant select, insert, update, delete on public.product_recent_views to authenticated;
