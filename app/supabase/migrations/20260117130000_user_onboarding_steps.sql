-- 온보딩 상태 저장 테이블 (단순화 버전)
-- 스텝 boolean 필드 제거: 런타임 계산으로 통일
-- 테이블은 "사용자 의사 표현"만 저장 (나중에 하기, 완료 인정)

CREATE TABLE public.user_onboarding_steps (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  skipped_at timestamptz,          -- "나중에 하기" 클릭 시점
  completed_at timestamptz,        -- 온보딩 완료 처리 시점
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.user_onboarding_steps ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인만 조회 가능 + admin 조회
CREATE POLICY user_onboarding_steps_select_self_or_admin
ON public.user_onboarding_steps FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- RLS 정책: 본인만 생성 가능
CREATE POLICY user_onboarding_steps_insert_self
ON public.user_onboarding_steps FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS 정책: 본인만 수정 가능
CREATE POLICY user_onboarding_steps_update_self
ON public.user_onboarding_steps FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- updated_at 자동 갱신 트리거
CREATE TRIGGER user_onboarding_steps_set_updated_at
  BEFORE UPDATE ON public.user_onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
