-- Help Center (FAQ/Notice/Guide) Schema
-- Creates help_article_type enum, help_categories, help_articles tables
-- with RLS policies for public read and admin full access

-- ============================================
-- Enums
-- ============================================

create type public.help_article_type as enum ('faq', 'notice', 'guide');

-- ============================================
-- Tables
-- ============================================

-- Help Categories (for FAQ grouping)
create table public.help_categories (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	slug text not null,
	display_order integer not null default 0,
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (slug)
);

create index idx_help_categories_slug on public.help_categories(slug);

create trigger help_categories_set_updated_at
before update on public.help_categories
for each row execute function public.set_updated_at();

-- Help Articles (FAQ, Notice, Guide)
create table public.help_articles (
	id uuid primary key default gen_random_uuid(),
	type public.help_article_type not null,
	category_id uuid references public.help_categories(id) on delete set null,
	title text not null,
	content text not null,
	is_published boolean not null default false,
	is_pinned boolean not null default false,
	display_order integer not null default 0,
	created_by uuid not null references public.profiles(id) on delete restrict,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index idx_help_articles_type on public.help_articles(type);
create index idx_help_articles_category_id on public.help_articles(category_id);
create index idx_help_articles_is_published on public.help_articles(is_published);
create index idx_help_articles_type_published on public.help_articles(type, is_published);

create trigger help_articles_set_updated_at
before update on public.help_articles
for each row execute function public.set_updated_at();

-- ============================================
-- RLS Enable
-- ============================================

alter table public.help_categories enable row level security;
alter table public.help_articles enable row level security;

-- ============================================
-- RLS Policies - help_categories
-- ============================================

-- Public read: is_active = true
create policy help_categories_select_public
on public.help_categories
for select
to anon, authenticated
using (is_active = true);

-- Admin full access
create policy help_categories_admin_all
on public.help_categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================
-- RLS Policies - help_articles
-- ============================================

-- Public read: is_published = true
create policy help_articles_select_public
on public.help_articles
for select
to anon, authenticated
using (is_published = true);

-- Admin full access
create policy help_articles_admin_all
on public.help_articles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================
-- Seed Data - Initial Categories
-- ============================================

insert into public.help_categories (name, slug, display_order, is_active)
values
	('가입/로그인', 'auth', 1, true),
	('문의/리드', 'lead', 2, true),
	('업체/서비스', 'vendor', 3, true),
	('결제/정산', 'payment', 4, true),
	('기타', 'etc', 5, true);
