-- 한의사 근무형태 필드 추가
ALTER TABLE public.doctor_verifications
  ADD COLUMN work_type TEXT,
  ADD COLUMN work_type_other TEXT;

COMMENT ON COLUMN public.doctor_verifications.work_type IS '근무형태: clinic_owner, employed, substitute, public_health, resident, specialist_trainee, graduate_student, professor, job_seeking, other';
COMMENT ON COLUMN public.doctor_verifications.work_type_other IS '근무형태 기타 직접입력 값 (work_type=other 일 때)';
