-- ============================================
-- 11-2. 비딩 시스템 (인테리어) 마이그레이션
-- ============================================

-- 1. Enum 생성
CREATE TYPE bid_project_status AS ENUM (
  'draft', 'open', 'bidding', 'selecting', 'contracted',
  'in_progress', 'completed', 'settled', 'canceled'
);

CREATE TYPE bid_response_status AS ENUM (
  'invited', 'submitted', 'selected', 'rejected', 'withdrawn', 'expired'
);

CREATE TYPE bid_contract_status AS ENUM (
  'pending', 'active', 'completed', 'canceled', 'disputed'
);

CREATE TYPE bid_commission_status AS ENUM (
  'pending', 'charged', 'refunded', 'waived'
);

-- 2. bid_projects 테이블
CREATE TABLE public.bid_projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  location        text NOT NULL,
  budget_min      integer NOT NULL DEFAULT 0,
  budget_max      integer NOT NULL DEFAULT 0,
  space_size      text,
  schedule        text,
  requirements    text,
  attachments     jsonb NOT NULL DEFAULT '[]',
  status          bid_project_status NOT NULL DEFAULT 'draft',
  bid_deadline    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bid_projects_doctor ON public.bid_projects(doctor_user_id);
CREATE INDEX idx_bid_projects_status ON public.bid_projects(status);
CREATE INDEX idx_bid_projects_created_at ON public.bid_projects(created_at);

CREATE TRIGGER set_bid_projects_updated_at
  BEFORE UPDATE ON public.bid_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. bid_project_scores 테이블
CREATE TABLE public.bid_project_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES bid_projects(id) ON DELETE CASCADE,
  vendor_id       uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  region_score    numeric(5,4) NOT NULL DEFAULT 0,
  rating_score    numeric(5,4) NOT NULL DEFAULT 0,
  response_score  numeric(5,4) NOT NULL DEFAULT 0,
  portfolio_score numeric(5,4) NOT NULL DEFAULT 0,
  price_score     numeric(5,4) NOT NULL DEFAULT 0,
  total_score     numeric(5,4) NOT NULL DEFAULT 0,
  is_recommended  boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, vendor_id)
);

CREATE INDEX idx_bid_project_scores_project ON public.bid_project_scores(project_id);
CREATE INDEX idx_bid_project_scores_vendor ON public.bid_project_scores(vendor_id);

-- 4. bid_responses 테이블
CREATE TABLE public.bid_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES bid_projects(id) ON DELETE CASCADE,
  vendor_id       uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  status          bid_response_status NOT NULL DEFAULT 'invited',
  price           integer,
  proposal        text,
  estimated_days  integer,
  attachments     jsonb NOT NULL DEFAULT '[]',
  submitted_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, vendor_id)
);

CREATE INDEX idx_bid_responses_project ON public.bid_responses(project_id);
CREATE INDEX idx_bid_responses_vendor ON public.bid_responses(vendor_id);
CREATE INDEX idx_bid_responses_status ON public.bid_responses(status);

CREATE TRIGGER set_bid_responses_updated_at
  BEFORE UPDATE ON public.bid_responses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. bid_contracts 테이블
CREATE TABLE public.bid_contracts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid NOT NULL UNIQUE REFERENCES bid_projects(id) ON DELETE CASCADE,
  vendor_id           uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  response_id         uuid NOT NULL REFERENCES bid_responses(id) ON DELETE CASCADE,
  contract_amount     integer NOT NULL,
  commission_amount   integer NOT NULL DEFAULT 0,
  commission_status   bid_commission_status NOT NULL DEFAULT 'pending',
  commission_transaction_id uuid REFERENCES credit_transactions(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bid_contracts_vendor ON public.bid_contracts(vendor_id);
CREATE INDEX idx_bid_contracts_commission_status ON public.bid_contracts(commission_status);

CREATE TRIGGER set_bid_contracts_updated_at
  BEFORE UPDATE ON public.bid_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. bid_project_status_history 테이블
CREATE TABLE public.bid_project_status_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES bid_projects(id) ON DELETE CASCADE,
  from_status     bid_project_status,
  to_status       bid_project_status NOT NULL,
  changed_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bid_status_history_project ON public.bid_project_status_history(project_id);

-- 7. notification_type 확장
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bid_vendor_invited';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bid_response_submitted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bid_vendor_selected';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bid_commission_charged';

-- 8. charge_bid_commission RPC
CREATE OR REPLACE FUNCTION charge_bid_commission(
  p_contract_id uuid,
  p_vendor_id uuid
)
RETURNS TABLE(new_balance integer, transaction_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_contract bid_contracts%ROWTYPE;
  v_credit_account_id uuid;
  v_commission integer;
  v_tx_id uuid;
  v_new_bal integer;
BEGIN
  -- Lock contract row
  SELECT * INTO v_contract
  FROM bid_contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CONTRACT_NOT_FOUND';
  END IF;

  IF v_contract.vendor_id != p_vendor_id THEN
    RAISE EXCEPTION 'VENDOR_MISMATCH';
  END IF;

  IF v_contract.commission_status != 'pending' THEN
    RAISE EXCEPTION 'ALREADY_PROCESSED';
  END IF;

  v_commission := v_contract.commission_amount;

  -- Get credit account
  SELECT id INTO v_credit_account_id
  FROM credit_accounts
  WHERE vendor_id = p_vendor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CREDIT_ACCOUNT_NOT_FOUND';
  END IF;

  -- Deduct via credit_balance_update
  SELECT (r).new_balance, (r).transaction_id
  INTO v_new_bal, v_tx_id
  FROM credit_balance_update(
    v_credit_account_id,
    NULL::uuid,
    -v_commission,
    'deduct',
    '비딩 수수료 차감',
    NULL::timestamptz
  ) r;

  -- Update contract
  UPDATE bid_contracts
  SET commission_status = 'charged',
      commission_transaction_id = v_tx_id,
      updated_at = now()
  WHERE id = p_contract_id;

  new_balance := v_new_bal;
  transaction_id := v_tx_id;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION charge_bid_commission(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION charge_bid_commission(uuid, uuid) TO service_role;

-- 9. RLS 정책

-- bid_projects
ALTER TABLE public.bid_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bid_projects_select_doctor"
  ON public.bid_projects FOR SELECT
  USING (doctor_user_id = auth.uid());

CREATE POLICY "bid_projects_insert_doctor"
  ON public.bid_projects FOR INSERT
  WITH CHECK (doctor_user_id = auth.uid());

CREATE POLICY "bid_projects_update_doctor"
  ON public.bid_projects FOR UPDATE
  USING (doctor_user_id = auth.uid());

CREATE POLICY "bid_projects_select_vendor"
  ON public.bid_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bid_responses br
      WHERE br.project_id = bid_projects.id
        AND EXISTS (
          SELECT 1 FROM vendors v
          WHERE v.id = br.vendor_id AND v.owner_user_id = auth.uid()
        )
    )
  );

CREATE POLICY "bid_projects_select_admin"
  ON public.bid_projects FOR SELECT
  USING (public.is_admin());

CREATE POLICY "bid_projects_update_admin"
  ON public.bid_projects FOR UPDATE
  USING (public.is_admin());

-- bid_project_scores
ALTER TABLE public.bid_project_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bid_scores_select_doctor"
  ON public.bid_project_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bid_projects bp
      WHERE bp.id = bid_project_scores.project_id
        AND bp.doctor_user_id = auth.uid()
    )
  );

CREATE POLICY "bid_scores_select_vendor"
  ON public.bid_project_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = bid_project_scores.vendor_id
        AND v.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "bid_scores_select_admin"
  ON public.bid_project_scores FOR SELECT
  USING (public.is_admin());

-- bid_responses
ALTER TABLE public.bid_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bid_responses_select_doctor"
  ON public.bid_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bid_projects bp
      WHERE bp.id = bid_responses.project_id
        AND bp.doctor_user_id = auth.uid()
    )
  );

CREATE POLICY "bid_responses_select_vendor"
  ON public.bid_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = bid_responses.vendor_id
        AND v.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "bid_responses_update_vendor"
  ON public.bid_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = bid_responses.vendor_id
        AND v.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "bid_responses_select_admin"
  ON public.bid_responses FOR SELECT
  USING (public.is_admin());

CREATE POLICY "bid_responses_update_admin"
  ON public.bid_responses FOR UPDATE
  USING (public.is_admin());

-- bid_contracts
ALTER TABLE public.bid_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bid_contracts_select_doctor"
  ON public.bid_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bid_projects bp
      WHERE bp.id = bid_contracts.project_id
        AND bp.doctor_user_id = auth.uid()
    )
  );

CREATE POLICY "bid_contracts_select_vendor"
  ON public.bid_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = bid_contracts.vendor_id
        AND v.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "bid_contracts_select_admin"
  ON public.bid_contracts FOR SELECT
  USING (public.is_admin());

CREATE POLICY "bid_contracts_update_admin"
  ON public.bid_contracts FOR UPDATE
  USING (public.is_admin());

-- bid_project_status_history
ALTER TABLE public.bid_project_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bid_status_history_select_doctor"
  ON public.bid_project_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bid_projects bp
      WHERE bp.id = bid_project_status_history.project_id
        AND bp.doctor_user_id = auth.uid()
    )
  );

CREATE POLICY "bid_status_history_select_admin"
  ON public.bid_project_status_history FOR SELECT
  USING (public.is_admin());
