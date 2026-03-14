-- P9 A5 코드리뷰 수정: review_replies UPDATE/DELETE RLS 강화
-- Critical #2 (RPC SECURITY INVOKER)는 20260315090000 마이그레이션에서 처리됨.

-- ============================================================
-- Critical #1: review_replies UPDATE/DELETE 정책에 업체 소유권 재검증 추가
-- 기존 정책은 vendor_user_id = auth.uid()만 확인하므로, 업체 소유권이
-- 변경된 후에도 이전 소유자가 답글을 수정/삭제할 수 있는 취약점이 있음.
-- ============================================================

-- 기존 update 정책 삭제 후 재생성
DROP POLICY IF EXISTS review_replies_update_own ON public.review_replies;

CREATE POLICY review_replies_update_owner
ON public.review_replies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.reviews r
    JOIN public.vendors v ON v.id = r.vendor_id
    WHERE r.id = review_id
      AND v.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  vendor_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.reviews r
    JOIN public.vendors v ON v.id = r.vendor_id
    WHERE r.id = review_id
      AND v.owner_user_id = auth.uid()
  )
);

-- 기존 delete 정책 삭제 후 재생성
DROP POLICY IF EXISTS review_replies_delete_own ON public.review_replies;

CREATE POLICY review_replies_delete_owner
ON public.review_replies
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.reviews r
    JOIN public.vendors v ON v.id = r.vendor_id
    WHERE r.id = review_id
      AND v.owner_user_id = auth.uid()
  )
);
