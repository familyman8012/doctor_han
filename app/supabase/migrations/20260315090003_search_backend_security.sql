-- ============================================
-- P9 A6: Search Backend - Security hardening
-- 🔴 Critical: is_vendor_public() 조건 적용
-- 🟡 Important: RPC 실행 권한을 service_role로 제한
-- ============================================

-- 1. search_vendors_ranked: status='active' → is_vendor_public()
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
    WHERE public.is_vendor_public(v.id)
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

-- 2. search_autocomplete: status='active' → is_vendor_public()
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
      WHERE public.is_vendor_public(v.id)
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

-- 3. REVOKE/GRANT: 모든 검색 RPC를 service_role 전용으로 제한
-- search_vendors_ranked
REVOKE ALL ON FUNCTION public.search_vendors_ranked(text, uuid, integer, integer, text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.search_vendors_ranked(text, uuid, integer, integer, text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.search_vendors_ranked(text, uuid, integer, integer, text, integer, integer) TO service_role;

-- search_autocomplete
REVOKE ALL ON FUNCTION public.search_autocomplete(text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.search_autocomplete(text, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.search_autocomplete(text, integer) TO service_role;

-- get_popular_search_terms
REVOKE ALL ON FUNCTION public.get_popular_search_terms(integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_popular_search_terms(integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_search_terms(integer, integer) TO service_role;
