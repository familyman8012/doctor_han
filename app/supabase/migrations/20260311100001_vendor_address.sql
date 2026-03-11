-- ============================================
-- Vendor address/map fields migration
-- Adds structured address + geocode columns to vendors table
-- ============================================

-- 1. Add address columns (nullable, backward-compatible)
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS road_address text,
  ADD COLUMN IF NOT EXISTS jibun_address text,
  ADD COLUMN IF NOT EXISTS address_detail text,
  ADD COLUMN IF NOT EXISTS zonecode text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- 2. Add index on coordinates for future geo-queries
CREATE INDEX IF NOT EXISTS idx_vendors_coordinates
  ON public.vendors (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
