-- P9 A5: 포트폴리오 메타데이터 + 인기도 점수 + 필터 인덱스

-- 1) 포트폴리오 메타데이터: tags, is_featured
ALTER TABLE public.vendor_portfolios
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_vendor_portfolios_tags
  ON public.vendor_portfolios USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_vendor_portfolios_featured
  ON public.vendor_portfolios (vendor_id)
  WHERE is_featured = true;

-- 2) 인기도 점수 (정렬용 비정규화 컬럼)
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS popularity_score double precision NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_vendors_popularity_score
  ON public.vendors (popularity_score DESC);

-- 3) 필터용 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_vendors_region
  ON public.vendors (region_primary, region_secondary)
  WHERE region_primary IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_rating_avg
  ON public.vendors (rating_avg DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_vendors_review_count
  ON public.vendors (review_count DESC);

-- 4) popularity_score 갱신 함수
CREATE OR REPLACE FUNCTION public.refresh_vendor_popularity(target_vendor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vendors
  SET popularity_score = COALESCE(rating_avg, 0) * LN(review_count + 1)
  WHERE id = target_vendor_id;
END;
$$;

-- 5) 기존 tg_refresh_vendor_rating 트리거 함수 확장 (popularity도 같이 갱신)
CREATE OR REPLACE FUNCTION public.tg_refresh_vendor_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vid uuid;
BEGIN
  vid = coalesce(new.vendor_id, old.vendor_id);
  PERFORM public.refresh_vendor_rating(vid);
  PERFORM public.refresh_vendor_popularity(vid);
  RETURN null;
END;
$$;

-- 6) 기존 데이터 백필
UPDATE public.vendors
SET popularity_score = COALESCE(rating_avg, 0) * LN(review_count + 1);
