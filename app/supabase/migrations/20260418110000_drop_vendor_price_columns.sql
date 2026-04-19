-- vendors.price_min, vendors.price_max 제거
-- 업체 가격 범위는 업체 프로필에서 수동 입력 대신 상품 등록 기반으로 대체
-- (업체형 카테고리는 "가격 문의"로 표시)

-- 먼저 search_vendors_ranked 함수가 이 컬럼을 참조하므로 드롭
DROP FUNCTION IF EXISTS public.search_vendors_ranked(text, uuid, integer, integer, text, integer, integer);

ALTER TABLE vendors DROP COLUMN IF EXISTS price_min;
ALTER TABLE vendors DROP COLUMN IF EXISTS price_max;
