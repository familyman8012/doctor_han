-- 리드에 한의사 개인 메모 필드 추가
ALTER TABLE public.leads
  ADD COLUMN doctor_memo TEXT;

COMMENT ON COLUMN public.leads.doctor_memo IS '한의사 개인 메모 (업체에게 보이지 않음)';
