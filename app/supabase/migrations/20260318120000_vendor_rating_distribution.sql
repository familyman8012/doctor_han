-- 업체별 리뷰 평점 분포 (5/4/3/2/1점 각 건수)
CREATE OR REPLACE FUNCTION get_vendor_rating_distribution(target_vendor_id uuid)
RETURNS TABLE(rating int, count bigint)
LANGUAGE sql STABLE
AS $$
  SELECT r.rating::int, count(*)::bigint
  FROM reviews r
  WHERE r.vendor_id = target_vendor_id AND r.status = 'published'
  GROUP BY r.rating
  ORDER BY r.rating DESC;
$$;
