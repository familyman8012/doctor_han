-- profiles 테이블에 약관 동의 필드 추가
ALTER TABLE public.profiles
ADD COLUMN terms_agreed_version TEXT,
ADD COLUMN terms_agreed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.terms_agreed_version IS '동의한 약관 버전 (YYYY-MM-DD)';
COMMENT ON COLUMN public.profiles.terms_agreed_at IS '약관 동의 시각';
