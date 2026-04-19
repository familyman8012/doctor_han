-- ============================================
-- 상품 재수정 추적: first_published_at + resubmit_reason + 이전 active 스냅샷
-- ============================================

alter table public.products
  add column if not exists first_published_at timestamptz,
  add column if not exists resubmit_reason text,
  add column if not exists last_active_snapshot jsonb;

-- 이미 active 상태인 기존 상품들에 first_published_at 백필 (updated_at으로 추정)
update public.products
  set first_published_at = coalesce(first_published_at, updated_at, created_at)
  where status = 'active' and first_published_at is null;

-- 재수정 검색용 인덱스
create index if not exists idx_products_status_resubmit
  on public.products (status)
  where status = 'pending_review' and first_published_at is not null;
