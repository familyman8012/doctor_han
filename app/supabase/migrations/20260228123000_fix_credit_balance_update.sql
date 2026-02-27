-- ============================================
-- Fix: credit_balance_update idempotency + function privilege hardening
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
