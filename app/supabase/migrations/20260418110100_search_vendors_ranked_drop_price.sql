-- search_vendors_ranked 함수 재정의: price_min/price_max 필드 제거
-- 업체 테이블에서 price 컬럼이 제거되었으므로 반환 필드와 파라미터도 정리
-- 상품 가격 기반 검색은 별도의 products API에서 처리

CREATE OR REPLACE FUNCTION public.search_vendors_ranked(
    p_query text,
    p_category_id uuid DEFAULT NULL,
    p_sort text DEFAULT 'relevance',
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    name text,
    summary text,
    region_primary text[],
    region_secondary text,
    road_address text,
    jibun_address text,
    address_detail text,
    zonecode text,
    latitude double precision,
    longitude double precision,
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

REVOKE ALL ON FUNCTION public.search_vendors_ranked(text, uuid, text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.search_vendors_ranked(text, uuid, text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.search_vendors_ranked(text, uuid, text, integer, integer) TO service_role;
