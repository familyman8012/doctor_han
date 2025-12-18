-- P0 schema for Medihub

-- Extensions
create extension if not exists pgcrypto with schema extensions;

-- Enums
create type public.profile_role as enum ('doctor', 'vendor', 'admin');
create type public.profile_status as enum ('active', 'inactive', 'banned');
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.vendor_status as enum ('draft', 'active', 'inactive', 'banned');
create type public.lead_status as enum (
	'submitted',
	'in_progress',
	'quote_pending',
	'negotiating',
	'contracted',
	'hold',
	'canceled',
	'closed'
);
create type public.file_purpose as enum (
	'doctor_license',
	'vendor_business_license',
	'portfolio',
	'lead_attachment',
	'avatar'
);
create type public.review_status as enum ('published', 'hidden');

-- Helper functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create or replace function public.prevent_lead_identity_change()
returns trigger
language plpgsql
as $$
begin
	if new.doctor_user_id <> old.doctor_user_id then
		raise exception 'doctor_user_id is immutable';
	end if;
	if new.vendor_id <> old.vendor_id then
		raise exception 'vendor_id is immutable';
	end if;
	return new;
end;
$$;

create or replace function public.prevent_review_identity_change()
returns trigger
language plpgsql
as $$
begin
	if new.doctor_user_id <> old.doctor_user_id then
		raise exception 'doctor_user_id is immutable';
	end if;
	if new.vendor_id <> old.vendor_id then
		raise exception 'vendor_id is immutable';
	end if;
	return new;
end;
$$;

-- Tables
create table public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	role public.profile_role not null,
	status public.profile_status not null default 'active',
	display_name text,
	phone text,
	email text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.files (
	id uuid primary key default gen_random_uuid(),
	owner_user_id uuid not null references public.profiles(id) on delete cascade,
	bucket text not null,
	path text not null,
	purpose public.file_purpose not null,
	mime_type text,
	size_bytes bigint,
	created_at timestamptz not null default now(),
	unique (bucket, path)
);

create table public.audit_logs (
	id uuid primary key default gen_random_uuid(),
	actor_user_id uuid not null references public.profiles(id) on delete restrict,
	action text not null,
	target_type text not null,
	target_id uuid,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now()
);

create table public.doctor_verifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	license_no text not null,
	full_name text not null,
	birth_date date,
	clinic_name text,
	license_file_id uuid references public.files(id) on delete set null,
	status public.verification_status not null default 'pending',
	reviewed_by uuid references public.profiles(id) on delete set null,
	reviewed_at timestamptz,
	reject_reason text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (user_id)
);

create trigger doctor_verifications_set_updated_at
before update on public.doctor_verifications
for each row execute function public.set_updated_at();

create table public.vendor_verifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	business_no text not null,
	company_name text not null,
	contact_name text,
	contact_phone text,
	contact_email text,
	business_license_file_id uuid references public.files(id) on delete set null,
	status public.verification_status not null default 'pending',
	reviewed_by uuid references public.profiles(id) on delete set null,
	reviewed_at timestamptz,
	reject_reason text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (user_id)
);

create trigger vendor_verifications_set_updated_at
before update on public.vendor_verifications
for each row execute function public.set_updated_at();

create table public.categories (
	id uuid primary key default gen_random_uuid(),
	parent_id uuid references public.categories(id) on delete set null,
	depth smallint not null default 1,
	name text not null,
	slug text not null,
	sort_order integer not null default 0,
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (slug)
);

create index categories_parent_id_idx on public.categories(parent_id);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create table public.vendors (
	id uuid primary key default gen_random_uuid(),
	owner_user_id uuid not null references public.profiles(id) on delete cascade,
	name text not null,
	summary text,
	description text,
	region_primary text,
	region_secondary text,
	price_min integer,
	price_max integer,
	status public.vendor_status not null default 'draft',
	rating_avg numeric,
	review_count integer not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (owner_user_id)
);

create index vendors_status_idx on public.vendors(status);

create trigger vendors_set_updated_at
before update on public.vendors
for each row execute function public.set_updated_at();

create table public.vendor_categories (
	vendor_id uuid not null references public.vendors(id) on delete cascade,
	category_id uuid not null references public.categories(id) on delete cascade,
	created_at timestamptz not null default now(),
	primary key (vendor_id, category_id)
);

create index vendor_categories_category_id_idx on public.vendor_categories(category_id);

create table public.vendor_portfolios (
	id uuid primary key default gen_random_uuid(),
	vendor_id uuid not null references public.vendors(id) on delete cascade,
	title text,
	description text,
	sort_order integer not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index vendor_portfolios_vendor_id_idx on public.vendor_portfolios(vendor_id);

create trigger vendor_portfolios_set_updated_at
before update on public.vendor_portfolios
for each row execute function public.set_updated_at();

create table public.vendor_portfolio_assets (
	id uuid primary key default gen_random_uuid(),
	portfolio_id uuid not null references public.vendor_portfolios(id) on delete cascade,
	file_id uuid references public.files(id) on delete set null,
	url text,
	sort_order integer not null default 0,
	created_at timestamptz not null default now()
);

create index vendor_portfolio_assets_portfolio_id_idx on public.vendor_portfolio_assets(portfolio_id);

create table public.leads (
	id uuid primary key default gen_random_uuid(),
	doctor_user_id uuid not null references public.profiles(id) on delete restrict,
	vendor_id uuid not null references public.vendors(id) on delete restrict,
	service_name text,
	contact_name text,
	contact_phone text,
	contact_email text,
	preferred_channel text,
	preferred_time text,
	content text,
	status public.lead_status not null default 'submitted',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index leads_doctor_user_id_idx on public.leads(doctor_user_id);
create index leads_vendor_id_idx on public.leads(vendor_id);
create index leads_status_idx on public.leads(status);

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create trigger leads_prevent_identity_change
before update on public.leads
for each row execute function public.prevent_lead_identity_change();

create table public.lead_status_history (
	id uuid primary key default gen_random_uuid(),
	lead_id uuid not null references public.leads(id) on delete cascade,
	from_status public.lead_status,
	to_status public.lead_status not null,
	changed_by uuid references public.profiles(id) on delete set null,
	created_at timestamptz not null default now()
);

create index lead_status_history_lead_id_idx on public.lead_status_history(lead_id);

create table public.lead_attachments (
	id uuid primary key default gen_random_uuid(),
	lead_id uuid not null references public.leads(id) on delete cascade,
	file_id uuid not null references public.files(id) on delete restrict,
	created_by uuid references public.profiles(id) on delete set null,
	created_at timestamptz not null default now()
);

create index lead_attachments_lead_id_idx on public.lead_attachments(lead_id);

create table public.reviews (
	id uuid primary key default gen_random_uuid(),
	vendor_id uuid not null references public.vendors(id) on delete restrict,
	doctor_user_id uuid not null references public.profiles(id) on delete restrict,
	lead_id uuid references public.leads(id) on delete set null,
	rating smallint not null check (rating between 1 and 5),
	content text not null,
	amount integer,
	worked_at date,
	status public.review_status not null default 'published',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create unique index reviews_lead_id_unique on public.reviews(lead_id) where lead_id is not null;
create index reviews_vendor_id_idx on public.reviews(vendor_id);

-- Vendor rating aggregation
create or replace function public.refresh_vendor_rating(target_vendor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	avg_rating numeric;
	cnt integer;
begin
	select
		round(avg(r.rating)::numeric, 2),
		count(*)
	into avg_rating, cnt
	from public.reviews r
	where r.vendor_id = target_vendor_id
		and r.status = 'published';

	update public.vendors v
	set
		rating_avg = avg_rating,
		review_count = cnt
	where v.id = target_vendor_id;
end;
$$;

create or replace function public.tg_refresh_vendor_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	vendor_id uuid;
begin
	vendor_id = coalesce(new.vendor_id, old.vendor_id);
	perform public.refresh_vendor_rating(vendor_id);
	return null;
end;
$$;

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create trigger reviews_prevent_identity_change
before update on public.reviews
for each row execute function public.prevent_review_identity_change();

create trigger reviews_refresh_vendor_rating
after insert or update or delete on public.reviews
for each row execute function public.tg_refresh_vendor_rating();

create table public.favorites (
	user_id uuid not null references public.profiles(id) on delete cascade,
	vendor_id uuid not null references public.vendors(id) on delete cascade,
	created_at timestamptz not null default now(),
	primary key (user_id, vendor_id)
);

create index favorites_vendor_id_idx on public.favorites(vendor_id);

create table public.recent_views (
	user_id uuid not null references public.profiles(id) on delete cascade,
	vendor_id uuid not null references public.vendors(id) on delete cascade,
	view_count integer not null default 1,
	last_viewed_at timestamptz not null default now(),
	primary key (user_id, vendor_id)
);

create index recent_views_last_viewed_at_idx on public.recent_views(last_viewed_at);

-- RLS helper functions (require tables)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.profiles p
		where p.id = auth.uid()
			and p.role = 'admin'
	);
$$;

create or replace function public.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = public
as $$
	select p.role
	from public.profiles p
	where p.id = auth.uid();
$$;

create or replace function public.is_approved_doctor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.doctor_verifications v
		where v.user_id = auth.uid()
			and v.status = 'approved'
	);
$$;

create or replace function public.is_vendor_owner(vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.vendors v
		where v.id = vendor_id
			and v.owner_user_id = auth.uid()
	);
$$;

create or replace function public.is_vendor_approved(vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.vendors v
		join public.vendor_verifications vv
			on vv.user_id = v.owner_user_id
			and vv.status = 'approved'
		where v.id = vendor_id
	);
$$;

create or replace function public.is_vendor_public(vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.vendors v
		where v.id = vendor_id
			and v.status = 'active'
			and public.is_vendor_approved(v.id)
	);
$$;

create or replace function public.can_create_lead(target_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select public.is_approved_doctor()
		and exists (
			select 1
			from public.vendors v
			where v.id = target_vendor_id
				and v.status = 'active'
				and public.is_vendor_approved(v.id)
		);
$$;

create or replace function public.can_write_review(target_vendor_id uuid, target_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select public.is_approved_doctor()
		and exists (
			select 1
			from public.leads l
			where l.id = target_lead_id
				and l.vendor_id = target_vendor_id
				and l.doctor_user_id = auth.uid()
				and l.status <> 'canceled'
		)
		and public.is_vendor_public(target_vendor_id);
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.files enable row level security;
alter table public.audit_logs enable row level security;
alter table public.doctor_verifications enable row level security;
alter table public.vendor_verifications enable row level security;
alter table public.categories enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_categories enable row level security;
alter table public.vendor_portfolios enable row level security;
alter table public.vendor_portfolio_assets enable row level security;
alter table public.leads enable row level security;
alter table public.lead_status_history enable row level security;
alter table public.lead_attachments enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.recent_views enable row level security;

-- Profiles policies
create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (
	id = auth.uid()
	and role in ('doctor', 'vendor')
);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
	id = auth.uid()
	and role in ('doctor', 'vendor')
);

create policy profiles_admin_update
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Files policies
create policy files_select_owner_or_admin
on public.files
for select
to authenticated
using (owner_user_id = auth.uid() or public.is_admin());

create policy files_insert_owner
on public.files
for insert
to authenticated
with check (owner_user_id = auth.uid());

create policy files_update_owner
on public.files
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy files_admin_all
on public.files
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Audit logs policies
create policy audit_logs_admin_select
on public.audit_logs
for select
to authenticated
using (public.is_admin());

create policy audit_logs_admin_insert
on public.audit_logs
for insert
to authenticated
with check (public.is_admin() and actor_user_id = auth.uid());

-- Doctor verifications policies
create policy doctor_verifications_select_self_or_admin
on public.doctor_verifications
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy doctor_verifications_insert_self
on public.doctor_verifications
for insert
to authenticated
with check (
	user_id = auth.uid()
	and status = 'pending'
);

create policy doctor_verifications_update_self_before_approved
on public.doctor_verifications
for update
to authenticated
using (
	user_id = auth.uid()
	and status in ('pending', 'rejected')
)
with check (
	user_id = auth.uid()
	and status = 'pending'
);

create policy doctor_verifications_admin_update
on public.doctor_verifications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Vendor verifications policies
create policy vendor_verifications_select_self_or_admin
on public.vendor_verifications
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy vendor_verifications_insert_self
on public.vendor_verifications
for insert
to authenticated
with check (
	user_id = auth.uid()
	and status = 'pending'
);

create policy vendor_verifications_update_self_before_approved
on public.vendor_verifications
for update
to authenticated
using (
	user_id = auth.uid()
	and status in ('pending', 'rejected')
)
with check (
	user_id = auth.uid()
	and status = 'pending'
);

create policy vendor_verifications_admin_update
on public.vendor_verifications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Categories policies
create policy categories_select_public
on public.categories
for select
to anon, authenticated
using (is_active = true);

create policy categories_admin_all
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Vendors policies
create policy vendors_select_public
on public.vendors
for select
to anon, authenticated
using (public.is_vendor_public(id));

create policy vendors_select_owner
on public.vendors
for select
to authenticated
using (owner_user_id = auth.uid());

create policy vendors_admin_select
on public.vendors
for select
to authenticated
using (public.is_admin());

create policy vendors_insert_owner
on public.vendors
for insert
to authenticated
with check (
	owner_user_id = auth.uid()
	and public.current_profile_role() = 'vendor'
);

create policy vendors_update_owner
on public.vendors
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy vendors_admin_all
on public.vendors
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Vendor categories policies
create policy vendor_categories_select_public
on public.vendor_categories
for select
to anon, authenticated
using (public.is_vendor_public(vendor_id));

create policy vendor_categories_owner_all
on public.vendor_categories
for all
to authenticated
using (public.is_vendor_owner(vendor_id) or public.is_admin())
with check (public.is_vendor_owner(vendor_id) or public.is_admin());

-- Vendor portfolios policies
create policy vendor_portfolios_select_public
on public.vendor_portfolios
for select
to anon, authenticated
using (public.is_vendor_public(vendor_id));

create policy vendor_portfolios_owner_all
on public.vendor_portfolios
for all
to authenticated
using (
	public.is_admin()
	or exists (
		select 1
		from public.vendors v
		where v.id = vendor_id
			and v.owner_user_id = auth.uid()
	)
)
with check (
	public.is_admin()
	or exists (
		select 1
		from public.vendors v
		where v.id = vendor_id
			and v.owner_user_id = auth.uid()
	)
);

-- Vendor portfolio assets policies
create policy vendor_portfolio_assets_select_public
on public.vendor_portfolio_assets
for select
to anon, authenticated
using (
	exists (
		select 1
		from public.vendor_portfolios p
		where p.id = portfolio_id
			and public.is_vendor_public(p.vendor_id)
	)
);

create policy vendor_portfolio_assets_owner_all
on public.vendor_portfolio_assets
for all
to authenticated
using (
	public.is_admin()
	or exists (
		select 1
		from public.vendor_portfolios p
		join public.vendors v on v.id = p.vendor_id
		where p.id = portfolio_id
			and v.owner_user_id = auth.uid()
	)
)
with check (
	public.is_admin()
	or exists (
		select 1
		from public.vendor_portfolios p
		join public.vendors v on v.id = p.vendor_id
		where p.id = portfolio_id
			and v.owner_user_id = auth.uid()
	)
);

-- Leads policies
create policy leads_select_doctor
on public.leads
for select
to authenticated
using (doctor_user_id = auth.uid());

create policy leads_select_vendor_owner
on public.leads
for select
to authenticated
using (
	exists (
		select 1
		from public.vendors v
		where v.id = vendor_id
			and v.owner_user_id = auth.uid()
	)
);

create policy leads_admin_select
on public.leads
for select
to authenticated
using (public.is_admin());

create policy leads_insert_doctor_only_when_approved
on public.leads
for insert
to authenticated
with check (
	doctor_user_id = auth.uid()
	and public.current_profile_role() = 'doctor'
	and public.can_create_lead(vendor_id)
);

create policy leads_update_doctor_cancel_only
on public.leads
for update
to authenticated
using (doctor_user_id = auth.uid())
with check (
	doctor_user_id = auth.uid()
	and status = 'canceled'
);

create policy leads_update_vendor_owner
on public.leads
for update
to authenticated
using (public.is_vendor_owner(vendor_id) or public.is_admin())
with check (public.is_vendor_owner(vendor_id) or public.is_admin());

-- Lead status history policies
create policy lead_status_history_select_participants
on public.lead_status_history
for select
to authenticated
using (
	public.is_admin()
	or exists (
		select 1
		from public.leads l
		where l.id = lead_id
			and (
				l.doctor_user_id = auth.uid()
				or public.is_vendor_owner(l.vendor_id)
			)
	)
);

create policy lead_status_history_insert_participants
on public.lead_status_history
for insert
to authenticated
with check (
	public.is_admin()
	or exists (
		select 1
		from public.leads l
		where l.id = lead_id
			and (
				l.doctor_user_id = auth.uid()
				or public.is_vendor_owner(l.vendor_id)
			)
	)
);

-- Lead attachments policies
create policy lead_attachments_select_participants
on public.lead_attachments
for select
to authenticated
using (
	public.is_admin()
	or exists (
		select 1
		from public.leads l
		where l.id = lead_id
			and (
				l.doctor_user_id = auth.uid()
				or public.is_vendor_owner(l.vendor_id)
			)
	)
);

create policy lead_attachments_insert_participants
on public.lead_attachments
for insert
to authenticated
with check (
	public.is_admin()
	or exists (
		select 1
		from public.leads l
		where l.id = lead_id
			and (
				l.doctor_user_id = auth.uid()
				or public.is_vendor_owner(l.vendor_id)
			)
	)
);

-- Reviews policies
create policy reviews_select_public
on public.reviews
for select
to anon, authenticated
using (
	status = 'published'
	and public.is_vendor_public(vendor_id)
);

create policy reviews_select_doctor_own
on public.reviews
for select
to authenticated
using (doctor_user_id = auth.uid());

create policy reviews_select_vendor_owner
on public.reviews
for select
to authenticated
using (public.is_vendor_owner(vendor_id) or public.is_admin());

create policy reviews_insert_doctor_only_when_allowed
on public.reviews
for insert
to authenticated
with check (
	doctor_user_id = auth.uid()
	and public.current_profile_role() = 'doctor'
	and public.can_write_review(vendor_id, lead_id)
);

create policy reviews_admin_update
on public.reviews
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Favorites policies
create policy favorites_select_own
on public.favorites
for select
to authenticated
using (user_id = auth.uid());

create policy favorites_insert_own
on public.favorites
for insert
to authenticated
with check (user_id = auth.uid());

create policy favorites_delete_own
on public.favorites
for delete
to authenticated
using (user_id = auth.uid());

-- Recent views policies
create policy recent_views_select_own
on public.recent_views
for select
to authenticated
using (user_id = auth.uid());

create policy recent_views_upsert_own
on public.recent_views
for insert
to authenticated
with check (user_id = auth.uid());

create policy recent_views_update_own
on public.recent_views
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy recent_views_delete_own
on public.recent_views
for delete
to authenticated
using (user_id = auth.uid());

-- Seed: initial root categories
insert into public.categories (name, slug, sort_order, depth)
values
	('원외탕전', 'external-decoction', 10, 1),
	('의료기기', 'medical-devices', 20, 1),
	('인테리어', 'interior', 30, 1),
	('간판', 'signage', 40, 1),
	('전자차트', 'emr', 50, 1),
	('마케팅', 'marketing', 60, 1),
	('세무/노무', 'tax-labor', 70, 1),
	('홈페이지', 'website', 80, 1)
on conflict (slug) do nothing;

-- Grants (minimal; RLS still applies)
grant usage on schema public to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.current_profile_role() to anon, authenticated;
grant execute on function public.is_approved_doctor() to anon, authenticated;
grant execute on function public.is_vendor_owner(uuid) to anon, authenticated;
grant execute on function public.is_vendor_approved(uuid) to anon, authenticated;
grant execute on function public.is_vendor_public(uuid) to anon, authenticated;
grant execute on function public.can_create_lead(uuid) to anon, authenticated;
grant execute on function public.can_write_review(uuid, uuid) to anon, authenticated;
