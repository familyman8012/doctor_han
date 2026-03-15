-- ============================================
-- Phase D1-a: Add products to search_autocomplete RPC
-- ============================================

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
    UNION ALL
    (
      SELECT DISTINCT ON (p.title)
        p.title AS label,
        'product'::text AS type,
        similarity(p.title, v_query) AS score
      FROM products p
      WHERE p.status = 'active'
        AND (
          p.title ILIKE v_query || '%'
          OR p.title ILIKE '%' || v_query || '%'
        )
      ORDER BY p.title, similarity(p.title, v_query) DESC
      LIMIT p_limit
    )
  ) sub
  ORDER BY sub.score DESC
  LIMIT p_limit;
END;
$$;
