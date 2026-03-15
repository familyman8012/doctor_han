-- ============================================
-- P9 A6: Search Backend - REVOKE PUBLIC 누락 보완
-- PUBLIC role의 기본 EXECUTE 권한도 제거해야 완전한 service_role 전용 제한
-- ============================================

-- search_vendors_ranked
REVOKE ALL ON FUNCTION public.search_vendors_ranked(text, uuid, integer, integer, text, integer, integer) FROM PUBLIC;

-- search_autocomplete
REVOKE ALL ON FUNCTION public.search_autocomplete(text, integer) FROM PUBLIC;

-- get_popular_search_terms
REVOKE ALL ON FUNCTION public.get_popular_search_terms(integer, integer) FROM PUBLIC;
