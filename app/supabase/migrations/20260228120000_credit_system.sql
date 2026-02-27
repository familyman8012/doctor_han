-- ============================================
-- Credit System: 크레딧 계정, 패키지, 거래 내역
-- ============================================

-- Enum: 크레딧 거래 유형
CREATE TYPE credit_transaction_type AS ENUM (
  'charge',         -- 충전
  'charge_bonus',   -- 충전 보너스
  'deduct',         -- 차감 (리드 과금 등)
  'refund',         -- 환불
  'recovery',       -- 복구 (72시간 무응답 등)
  'expire',         -- 만료
  'admin_adjust'    -- 관리자 수동 조정
);

-- Enum: 크레딧 거래 상태
CREATE TYPE credit_transaction_status AS ENUM (
  'pending',    -- 대기 (결제 준비 등)
  'completed',  -- 완료
  'failed',     -- 실패
  'canceled'    -- 취소
);

-- 충전 패키지 (관리자 관리)
CREATE TABLE credit_packages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  amount      integer NOT NULL CHECK (amount > 0),
  bonus_rate  numeric(5,4) NOT NULL DEFAULT 0,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 업체별 크레딧 계정 (1:1)
CREATE TABLE credit_accounts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             uuid NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  balance               integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  auto_charge_enabled   boolean NOT NULL DEFAULT false,
  auto_charge_amount    integer,
  auto_charge_threshold integer NOT NULL DEFAULT 10000,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- 크레딧 거래 내역
CREATE TABLE credit_transactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_account_id uuid NOT NULL REFERENCES credit_accounts(id) ON DELETE CASCADE,
  type              credit_transaction_type NOT NULL,
  status            credit_transaction_status NOT NULL DEFAULT 'pending',
  amount            integer NOT NULL,  -- signed: 양수=입금, 음수=차감
  balance_after     integer NOT NULL DEFAULT 0,
  payment_id        uuid,  -- FK는 payments 마이그레이션에서 추가
  description       text,
  expires_at        timestamptz,  -- 충전 건별 만료일 (충전일 +12개월)
  metadata          jsonb DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_credit_accounts_vendor_id ON credit_accounts(vendor_id);
CREATE INDEX idx_credit_transactions_account_id ON credit_transactions(credit_account_id);
CREATE INDEX idx_credit_transactions_status ON credit_transactions(status);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_payment_id ON credit_transactions(payment_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- ============================================
-- RPC: credit_balance_update (atomic balance update)
-- ============================================
CREATE OR REPLACE FUNCTION credit_balance_update(
  p_credit_account_id uuid,
  p_transaction_id uuid,
  p_amount integer,
  p_type credit_transaction_type,
  p_description text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS TABLE(new_balance integer, transaction_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_tx_status credit_transaction_status;
  v_tx_credit_account_id uuid;
BEGIN
  -- 기존 트랜잭션이 있으면 먼저 row lock으로 멱등성 확인
  IF p_transaction_id IS NOT NULL THEN
    SELECT status, credit_account_id
      INTO v_tx_status, v_tx_credit_account_id
    FROM credit_transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Credit transaction not found: %', p_transaction_id;
    END IF;

    IF v_tx_credit_account_id <> p_credit_account_id THEN
      RAISE EXCEPTION 'Credit account mismatch. tx account: %, input account: %', v_tx_credit_account_id, p_credit_account_id;
    END IF;

    -- 이미 completed면 멱등성 보장 (잔액 변경 없이 현재 잔액 반환)
    IF v_tx_status = 'completed' THEN
      SELECT balance INTO v_current_balance
      FROM credit_accounts
      WHERE id = p_credit_account_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Credit account not found: %', p_credit_account_id;
      END IF;

      RETURN QUERY SELECT v_current_balance AS new_balance, p_transaction_id AS transaction_id;
      RETURN;
    END IF;
  END IF;

  -- Row lock으로 동시성 제어
  SELECT balance INTO v_current_balance
  FROM credit_accounts
  WHERE id = p_credit_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit account not found: %', p_credit_account_id;
  END IF;

  v_new_balance := v_current_balance + p_amount;

  -- 잔액 부족 검증 (차감 시)
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', v_current_balance, p_amount;
  END IF;

  -- 잔액 업데이트
  UPDATE credit_accounts
  SET balance = v_new_balance, updated_at = now()
  WHERE id = p_credit_account_id;

  -- 기존 pending 트랜잭션이 있으면 업데이트, 없으면 신규 생성
  IF p_transaction_id IS NOT NULL THEN
    UPDATE credit_transactions
    SET status = 'completed',
        amount = p_amount,
        balance_after = v_new_balance,
        description = COALESCE(p_description, description),
        expires_at = COALESCE(p_expires_at, expires_at),
        updated_at = now()
    WHERE id = p_transaction_id;

    RETURN QUERY SELECT v_new_balance AS new_balance, p_transaction_id AS transaction_id;
  ELSE
    RETURN QUERY
    INSERT INTO credit_transactions (
      credit_account_id, type, status, amount, balance_after,
      description, expires_at
    ) VALUES (
      p_credit_account_id, p_type, 'completed', p_amount, v_new_balance,
      p_description, p_expires_at
    )
    RETURNING v_new_balance AS new_balance, id AS transaction_id;
  END IF;
END;
$$;

-- 함수 실행 권한 제한: service_role만 실행 가능
REVOKE ALL ON FUNCTION public.credit_balance_update(uuid, uuid, integer, credit_transaction_type, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_balance_update(uuid, uuid, integer, credit_transaction_type, text, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.credit_balance_update(uuid, uuid, integer, credit_transaction_type, text, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.credit_balance_update(uuid, uuid, integer, credit_transaction_type, text, timestamptz) TO service_role;

-- ============================================
-- RLS
-- ============================================
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- credit_packages: 활성 패키지는 누구나 읽기 가능
CREATE POLICY "credit_packages_select_active"
  ON credit_packages FOR SELECT
  USING (is_active = true);

-- credit_accounts: vendor owner 또는 admin만 조회
CREATE POLICY "credit_accounts_select_own"
  ON credit_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = credit_accounts.vendor_id
        AND v.owner_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- credit_transactions: vendor owner만 조회 (변경은 RPC/service_role)
CREATE POLICY "credit_transactions_select_own"
  ON credit_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM credit_accounts ca
      JOIN vendors v ON v.id = ca.vendor_id
      WHERE ca.id = credit_transactions.credit_account_id
        AND v.owner_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- ============================================
-- 시드 데이터: 충전 패키지 4종
-- ============================================
INSERT INTO credit_packages (name, amount, bonus_rate, sort_order) VALUES
  ('5만원', 50000, 0, 1),
  ('10만원', 100000, 0, 2),
  ('100만원', 1000000, 0, 3),
  ('300만원', 3000000, 0, 4);
