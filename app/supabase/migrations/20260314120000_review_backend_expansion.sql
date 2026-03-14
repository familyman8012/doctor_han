-- P9 A4: 리뷰 확장 Backend
-- 1. 세부 평점 컬럼 추가 (quality, communication, speed)
-- 2. review_replies 테이블 생성
-- 3. 세부 평점 평균 RPC 함수

-- ============================================================
-- 1. 세부 평점 컬럼 (reviews 테이블)
-- ============================================================

ALTER TABLE public.reviews
  ADD COLUMN quality_rating smallint,
  ADD COLUMN communication_rating smallint,
  ADD COLUMN speed_rating smallint;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_quality_rating_range
    CHECK (quality_rating IS NULL OR quality_rating BETWEEN 1 AND 5),
  ADD CONSTRAINT reviews_communication_rating_range
    CHECK (communication_rating IS NULL OR communication_rating BETWEEN 1 AND 5),
  ADD CONSTRAINT reviews_speed_rating_range
    CHECK (speed_rating IS NULL OR speed_rating BETWEEN 1 AND 5);

-- ============================================================
-- 2. review_replies 테이블
-- ============================================================

CREATE TABLE public.review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  vendor_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(trim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id)
);

CREATE INDEX review_replies_review_id_idx ON public.review_replies(review_id);

CREATE TRIGGER review_replies_set_updated_at
  BEFORE UPDATE ON public.review_replies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3. RLS (review_replies)
-- ============================================================

ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- 공개 리뷰의 답변은 누구나 조회
CREATE POLICY review_replies_select_public
ON public.review_replies
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.id = review_id
      AND r.status = 'published'
      AND public.is_vendor_public(r.vendor_id)
  )
);

-- 업체 소유자: 자기 업체 리뷰 답변 조회
CREATE POLICY review_replies_select_vendor_owner
ON public.review_replies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.id = review_id
      AND public.is_vendor_owner(r.vendor_id)
  )
);

-- 관리자 전체
CREATE POLICY review_replies_admin_all
ON public.review_replies
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 삽입: 벤더 소유자만
CREATE POLICY review_replies_insert_vendor_owner
ON public.review_replies
FOR INSERT
TO authenticated
WITH CHECK (
  vendor_user_id = auth.uid()
  AND public.current_profile_role() = 'vendor'
  AND EXISTS (
    SELECT 1 FROM public.reviews r
    JOIN public.vendors v ON v.id = r.vendor_id
    WHERE r.id = review_id
      AND v.owner_user_id = auth.uid()
  )
);

-- 수정: 본인만
CREATE POLICY review_replies_update_own
ON public.review_replies
FOR UPDATE
TO authenticated
USING (vendor_user_id = auth.uid())
WITH CHECK (vendor_user_id = auth.uid());

-- 삭제: 본인만
CREATE POLICY review_replies_delete_own
ON public.review_replies
FOR DELETE
TO authenticated
USING (vendor_user_id = auth.uid());

-- ============================================================
-- 4. 세부 평점 평균 RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_vendor_sub_rating_summary(target_vendor_id uuid)
RETURNS TABLE (
  quality_avg numeric,
  communication_avg numeric,
  speed_avg numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROUND(AVG(quality_rating)::numeric, 2),
    ROUND(AVG(communication_rating)::numeric, 2),
    ROUND(AVG(speed_rating)::numeric, 2)
  FROM public.reviews
  WHERE vendor_id = target_vendor_id
    AND status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.get_vendor_sub_rating_summary(uuid) TO anon, authenticated;
