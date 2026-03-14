-- ============================================
-- P9 A6: Search Backend
-- pg_trgm indexes + search_events + RPCs
-- ============================================

-- 1. Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN trigram indexes on vendors for accelerated ILIKE
CREATE INDEX IF NOT EXISTS idx_vendors_name_trgm
  ON public.vendors USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vendors_summary_trgm
  ON public.vendors USING gin (summary gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vendors_description_trgm
  ON public.vendors USING gin (description gin_trgm_ops);

-- 3. GIN trigram index on categories.name for autocomplete
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm
  ON public.categories USING gin (name gin_trgm_ops);

-- 4. search_events table for tracking
CREATE TABLE public.search_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query      text NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  result_count integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_events_created_query
  ON public.search_events (created_at, query);

-- 5. RLS for search_events
ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_events_select_admin"
  ON public.search_events FOR SELECT
  USING (public.is_admin());

-- INSERT는 service_role만 사용 (fire-and-forget from API route)

-- 6. Vendor search RPC: ILIKE matching (uses GIN trigram index) + similarity ranking
CREATE OR REPLACE FUNCTION public.search_vendors_ranked(
  p_query text,
  p_category_id uuid DEFAULT NULL,
  p_price_min integer DEFAULT NULL,
  p_price_max integer DEFAULT NULL,
  p_sort text DEFAULT 'relevance',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  summary text,
  region_primary text,
  region_secondary text,
  road_address text,
  jibun_address text,
  address_detail text,
  zonecode text,
  latitude double precision,
  longitude double precision,
  price_min integer,
  price_max integer,
  rating_avg numeric,
  review_count integer,
  rank real,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_query text;
BEGIN
  v_query := trim(p_query);

  RETURN QUERY
  WITH matched AS (
    SELECT
      v.id,
      v.name,
      v.summary,
      v.region_primary,
      v.region_secondary,
      v.road_address,
      v.jibun_address,
      v.address_detail,
      v.zonecode,
      v.latitude,
      v.longitude,
      v.price_min,
      v.price_max,
      v.rating_avg,
      v.review_count,
      v.created_at,
      GREATEST(
        similarity(v.name, v_query),
        similarity(COALESCE(v.summary, ''), v_query) * 0.8,
        similarity(COALESCE(v.description, ''), v_query) * 0.6
      ) AS rank
    FROM vendors v
    WHERE v.status = 'active'
      AND (
        v.name ILIKE '%' || v_query || '%'
        OR v.summary ILIKE '%' || v_query || '%'
        OR v.description ILIKE '%' || v_query || '%'
      )
      AND (p_category_id IS NULL OR EXISTS (
        SELECT 1 FROM vendor_categories vc
        WHERE vc.vendor_id = v.id AND vc.category_id = p_category_id
      ))
      AND (p_price_min IS NULL OR v.price_max >= p_price_min)
      AND (p_price_max IS NULL OR v.price_min <= p_price_max)
  )
  SELECT
    m.id,
    m.name,
    m.summary,
    m.region_primary,
    m.region_secondary,
    m.road_address,
    m.jibun_address,
    m.address_detail,
    m.zonecode,
    m.latitude,
    m.longitude,
    m.price_min,
    m.price_max,
    m.rating_avg,
    m.review_count,
    m.rank,
    COUNT(*) OVER () AS total_count
  FROM matched m
  ORDER BY
    CASE WHEN p_sort = 'relevance' THEN m.rank END DESC NULLS LAST,
    CASE WHEN p_sort = 'rating' THEN m.rating_avg END DESC NULLS LAST,
    CASE WHEN p_sort = 'rating' THEN m.review_count END DESC NULLS LAST,
    CASE WHEN p_sort = 'newest' OR p_sort = 'relevance' THEN m.created_at END DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 7. Autocomplete RPC: vendor names + category names
CREATE OR REPLACE FUNCTION public.search_autocomplete(
  p_query text,
  p_limit integer DEFAULT 8
)
RETURNS TABLE(
  label text,
  type text,
  score real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_query text;
BEGIN
  v_query := trim(p_query);

  IF length(v_query) < 1 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT sub.label, sub.type, sub.score
  FROM (
    (
      SELECT DISTINCT ON (v.name)
        v.name AS label,
        'vendor'::text AS type,
        similarity(v.name, v_query) AS score
      FROM vendors v
      WHERE v.status = 'active'
        AND (
          v.name ILIKE v_query || '%'
          OR v.name ILIKE '%' || v_query || '%'
        )
      ORDER BY v.name, similarity(v.name, v_query) DESC
      LIMIT p_limit
    )
    UNION ALL
    (
      SELECT DISTINCT ON (c.name)
        c.name AS label,
        'category'::text AS type,
        similarity(c.name, v_query) AS score
      FROM categories c
      WHERE c.is_active = true
        AND (
          c.name ILIKE v_query || '%'
          OR c.name ILIKE '%' || v_query || '%'
        )
      ORDER BY c.name, similarity(c.name, v_query) DESC
      LIMIT p_limit
    )
  ) sub
  ORDER BY sub.score DESC
  LIMIT p_limit;
END;
$$;

-- 8. Popular search terms RPC
CREATE OR REPLACE FUNCTION public.get_popular_search_terms(
  p_days integer DEFAULT 30,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  term text,
  count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lower(trim(se.query)) AS term,
    COUNT(*) AS count
  FROM search_events se
  WHERE se.created_at >= now() - (p_days || ' days')::interval
    AND length(trim(se.query)) >= 2
  GROUP BY lower(trim(se.query))
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$;
