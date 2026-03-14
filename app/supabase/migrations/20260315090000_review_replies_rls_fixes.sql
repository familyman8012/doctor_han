-- P9 A4: 리뷰 확장 RLS 보안 수정
-- 1. get_vendor_sub_rating_summary: SECURITY DEFINER → INVOKER + is_vendor_public 검증
-- 2. review_replies: 리뷰 작성자(의사)가 자기 리뷰의 답변을 볼 수 있는 정책 추가

-- ============================================================
-- 1. RPC 함수 보안 수정
--    SECURITY DEFINER는 RLS를 우회하므로,
--    비공개/비활성 업체의 집계값이 노출될 수 있음.
--    SECURITY INVOKER로 변경 + is_vendor_public 검증 추가.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_vendor_sub_rating_summary(target_vendor_id uuid)
RETURNS TABLE (
  quality_avg numeric,
  communication_avg numeric,
  speed_avg numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    ROUND(AVG(quality_rating)::numeric, 2),
    ROUND(AVG(communication_rating)::numeric, 2),
    ROUND(AVG(speed_rating)::numeric, 2)
  FROM public.reviews
  WHERE vendor_id = target_vendor_id
    AND status = 'published'
    AND public.is_vendor_public(target_vendor_id);
$$;

-- ============================================================
-- 2. 리뷰 작성자가 자기 리뷰의 답변을 볼 수 있는 정책
--    hidden 상태 리뷰도 작성자에겐 답변이 보여야 함.
-- ============================================================

CREATE POLICY review_replies_select_doctor_own
ON public.review_replies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.reviews r
    WHERE r.id = review_id
      AND r.doctor_user_id = auth.uid()
  )
);
