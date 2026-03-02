-- ============================================
-- Subscriptions hardening + purchase RPC + expiry reminder logs
-- ============================================

-- vendor_subscriptions: 직접 쓰기 차단 (service_role/BFF 경유만 허용)
DROP POLICY IF EXISTS "vs_owner_all" ON vendor_subscriptions;
DROP POLICY IF EXISTS "vs_owner_select" ON vendor_subscriptions;

CREATE POLICY "vs_owner_select" ON vendor_subscriptions
  FOR SELECT TO authenticated
  USING (is_vendor_owner(vendor_id) OR is_admin());

-- 알림 타입 확장: 구독 만료 임박
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'subscription_expiring';

-- 구독 만료 알림 중복 방지 로그
CREATE TABLE IF NOT EXISTS vendor_subscription_reminder_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id      uuid NOT NULL REFERENCES vendor_subscriptions(id) ON DELETE CASCADE,
  reminder_days_before integer NOT NULL CHECK (reminder_days_before IN (7, 1)),
  sent_at              timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, reminder_days_before)
);

CREATE INDEX IF NOT EXISTS idx_vsrl_subscription_id ON vendor_subscription_reminder_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_vsrl_sent_at ON vendor_subscription_reminder_logs(sent_at DESC);

ALTER TABLE vendor_subscription_reminder_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vsrl_admin_select" ON vendor_subscription_reminder_logs;
CREATE POLICY "vsrl_admin_select"
  ON vendor_subscription_reminder_logs
  FOR SELECT TO authenticated
  USING (is_admin());

-- 활성 구독 여부 helper (만료 시간 포함)
CREATE OR REPLACE FUNCTION public.has_active_vendor_subscription(
  p_vendor_id uuid,
  p_category_id uuid,
  p_reference_time timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM vendor_subscriptions vs
    WHERE vs.vendor_id = p_vendor_id
      AND vs.category_id = p_category_id
      AND vs.status = 'active'
      AND vs.expires_at > p_reference_time
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_vendor_subscription(uuid, uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_active_vendor_subscription(uuid, uuid, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.has_active_vendor_subscription(uuid, uuid, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_vendor_subscription(uuid, uuid, timestamptz) TO service_role;

-- 원자적 구독 구매/연장 RPC
CREATE OR REPLACE FUNCTION public.purchase_vendor_subscription(
  p_vendor_id uuid,
  p_category_id uuid,
  p_plan_id uuid,
  p_auto_renew boolean DEFAULT false,
  p_extension_window_days integer DEFAULT 7
)
RETURNS TABLE(
  subscription_id uuid,
  new_balance integer,
  transaction_id uuid,
  was_extended boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
  v_plan_name text;
  v_plan_price integer;
  v_plan_duration_days integer;

  v_existing_subscription_id uuid;
  v_existing_expires_at timestamptz;

  v_credit_account_id uuid;
  v_new_balance integer;
  v_transaction_id uuid;
  v_final_subscription_id uuid;
BEGIN
  -- 동일 업체+카테고리 구매를 직렬화하여 중복 차감/중복 생성 방지
  PERFORM pg_advisory_xact_lock(hashtext(p_vendor_id::text), hashtext(p_category_id::text));

  SELECT sp.id, sp.name, sp.price, sp.duration_days
    INTO v_plan_id, v_plan_name, v_plan_price, v_plan_duration_days
  FROM subscription_plans sp
  WHERE sp.id = p_plan_id
    AND sp.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUBSCRIPTION_PLAN_NOT_FOUND';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM vendor_categories vc
    WHERE vc.vendor_id = p_vendor_id
      AND vc.category_id = p_category_id
  ) THEN
    RAISE EXCEPTION 'VENDOR_CATEGORY_NOT_FOUND';
  END IF;

  SELECT vs.id, vs.expires_at
    INTO v_existing_subscription_id, v_existing_expires_at
  FROM vendor_subscriptions vs
  WHERE vs.vendor_id = p_vendor_id
    AND vs.category_id = p_category_id
    AND vs.status = 'active'
  ORDER BY vs.created_at DESC
  LIMIT 1
  FOR UPDATE;

  -- 만료됐는데 active로 남아있던 레코드는 즉시 정리
  IF v_existing_subscription_id IS NOT NULL
    AND v_existing_expires_at <= now() THEN
    UPDATE vendor_subscriptions
    SET status = 'expired', updated_at = now()
    WHERE id = v_existing_subscription_id;

    v_existing_subscription_id := NULL;
    v_existing_expires_at := NULL;
  END IF;

  -- 활성 구독이 있으면 만료 7일(기본) 전부터만 연장 허용
  IF v_existing_subscription_id IS NOT NULL
    AND v_existing_expires_at > now() + make_interval(days => p_extension_window_days) THEN
    RAISE EXCEPTION 'SUBSCRIPTION_EXTENSION_WINDOW_NOT_REACHED';
  END IF;

  -- 크레딧 계정 ensure + row lock
  INSERT INTO credit_accounts (vendor_id)
  VALUES (p_vendor_id)
  ON CONFLICT (vendor_id) DO NOTHING;

  SELECT ca.id
    INTO v_credit_account_id
  FROM credit_accounts ca
  WHERE ca.vendor_id = p_vendor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CREDIT_ACCOUNT_NOT_FOUND';
  END IF;

  -- 원자적 차감
  SELECT c.new_balance, c.transaction_id
    INTO v_new_balance, v_transaction_id
  FROM credit_balance_update(
    p_credit_account_id => v_credit_account_id,
    p_transaction_id => NULL,
    p_amount => -v_plan_price,
    p_type => 'deduct',
    p_description => format('구독 구매: %s', v_plan_name),
    p_expires_at => NULL
  ) AS c;

  -- 연장: 기존 활성 구독의 만료일만 뒤로 이동
  IF v_existing_subscription_id IS NOT NULL THEN
    UPDATE vendor_subscriptions
    SET plan_id = v_plan_id,
        price_paid = v_plan_price,
        expires_at = v_existing_expires_at + make_interval(days => v_plan_duration_days),
        auto_renew = p_auto_renew,
        credit_transaction_id = v_transaction_id,
        updated_at = now()
    WHERE id = v_existing_subscription_id
    RETURNING id INTO v_final_subscription_id;

    RETURN QUERY SELECT v_final_subscription_id, v_new_balance, v_transaction_id, true;
    RETURN;
  END IF;

  -- 신규 생성
  INSERT INTO vendor_subscriptions (
    vendor_id,
    category_id,
    plan_id,
    status,
    price_paid,
    starts_at,
    expires_at,
    auto_renew,
    lead_count,
    credit_transaction_id
  ) VALUES (
    p_vendor_id,
    p_category_id,
    v_plan_id,
    'active',
    v_plan_price,
    now(),
    now() + make_interval(days => v_plan_duration_days),
    p_auto_renew,
    0,
    v_transaction_id
  )
  RETURNING id INTO v_final_subscription_id;

  RETURN QUERY SELECT v_final_subscription_id, v_new_balance, v_transaction_id, false;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_vendor_subscription(uuid, uuid, uuid, boolean, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purchase_vendor_subscription(uuid, uuid, uuid, boolean, integer) FROM anon;
REVOKE ALL ON FUNCTION public.purchase_vendor_subscription(uuid, uuid, uuid, boolean, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_vendor_subscription(uuid, uuid, uuid, boolean, integer) TO service_role;
