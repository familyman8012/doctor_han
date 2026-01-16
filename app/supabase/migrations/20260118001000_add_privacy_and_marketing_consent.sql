-- profiles 테이블에 개인정보처리방침 동의/마케팅 수신동의 이력(최소) 필드 추가
ALTER TABLE public.profiles
ADD COLUMN privacy_agreed_version TEXT,
ADD COLUMN privacy_agreed_at TIMESTAMPTZ,
ADD COLUMN marketing_opt_in_at TIMESTAMPTZ,
ADD COLUMN marketing_opt_out_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.privacy_agreed_version IS '동의한 개인정보처리방침 버전 (YYYY-MM-DD)';
COMMENT ON COLUMN public.profiles.privacy_agreed_at IS '개인정보처리방침 동의 시각';
COMMENT ON COLUMN public.profiles.marketing_opt_in_at IS '마케팅 수신동의 시각(최근)';
COMMENT ON COLUMN public.profiles.marketing_opt_out_at IS '마케팅 수신동의 철회 시각(최근)';
