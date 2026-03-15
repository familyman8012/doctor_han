-- P9 A3: Badge System Backend
-- Add badges JSONB column to vendors table for auto-computed vendor badges

ALTER TABLE public.vendors
  ADD COLUMN badges jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX idx_vendors_badges ON public.vendors USING gin(badges);
