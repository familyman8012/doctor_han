-- 프로필에 직책 필드 추가 (업체 담당자용)
ALTER TABLE public.profiles
  ADD COLUMN position TEXT;

COMMENT ON COLUMN public.profiles.position IS '직책 (업체 담당자의 직책/직위)';
