-- ============================================
-- 토스 즉시결제용 Direct Purchase RPCs
-- 구독/멤버십/광고 우선순위를 크레딧 차감 없이 payment_id 기반으로 생성
-- 기존 purchase_vendor_* RPC는 유지 (legacy 보존 + 감사용)
-- ============================================

-- 1. subscription/ad_priority에 payment_id 컬럼 추가 (membership은 이미 있음)
ALTER TABLE vendor_subscriptions
  ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES payments(id) ON DELETE SET NULL;

ALTER TABLE ad_priority_purchases
  ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES payments(id) ON DELETE SET NULL;

-- credit_transaction_id를 NULL 허용으로 (즉시결제는 크레딧 트랜잭션 없음)
ALTER TABLE vendor_subscriptions
  ALTER COLUMN credit_transaction_id DROP NOT NULL;

ALTER TABLE vendor_memberships
  ALTER COLUMN credit_transaction_id DROP NOT NULL;

ALTER TABLE ad_priority_purchases
  ALTER COLUMN credit_transaction_id DROP NOT NULL;

-- ============================================
-- 2. purchase_vendor_subscription_direct: 크레딧 차감 없이 구독 생성/연장
-- ============================================
CREATE OR REPLACE FUNCTION public.purchase_vendor_subscription_direct(
  p_vendor_id uuid,
  p_category_id uuid,
  p_plan_id uuid,
  p_payment_id uuid,
  p_auto_renew boolean DEFAULT false,
  p_extension_window_days integer DEFAULT 7
)
RETURNS TABLE(
  subscription_id uuid,
  was_extended boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
  v_plan_price integer;
  v_plan_duration_days integer;
  v_existing_subscription_id uuid;
  v_existing_expires_at timestamptz;
  v_final_subscription_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_vendor_id::text), hashtext(p_category_id::text));

  SELECT sp.id, sp.price, sp.duration_days
    INTO v_plan_id, v_plan_price, v_plan_duration_days
  FROM subscription_plans sp
  WHERE sp.id = p_plan_id AND sp.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUBSCRIPTION_PLAN_NOT_FOUND';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM vendor_categories vc
    WHERE vc.vendor_id = p_vendor_id AND vc.category_id = p_category_id
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

  IF v_existing_subscription_id IS NOT NULL
    AND v_existing_expires_at <= now() THEN
    UPDATE vendor_subscriptions
    SET status = 'expired', updated_at = now()
    WHERE id = v_existing_subscription_id;
    v_existing_subscription_id := NULL;
    v_existing_expires_at := NULL;
  END IF;

  IF v_existing_subscription_id IS NOT NULL
    AND v_existing_expires_at > now() + make_interval(days => p_extension_window_days) THEN
    RAISE EXCEPTION 'SUBSCRIPTION_EXTENSION_WINDOW_NOT_REACHED';
  END IF;

  IF v_existing_subscription_id IS NOT NULL THEN
    UPDATE vendor_subscriptions
    SET plan_id = v_plan_id,
        price_paid = v_plan_price,
        expires_at = v_existing_expires_at + make_interval(days => v_plan_duration_days),
        auto_renew = p_auto_renew,
        payment_id = p_payment_id,
        updated_at = now()
    WHERE id = v_existing_subscription_id
    RETURNING id INTO v_final_subscription_id;

    RETURN QUERY SELECT v_final_subscription_id, true;
    RETURN;
  END IF;

  INSERT INTO vendor_subscriptions (
    vendor_id, category_id, plan_id, status, price_paid,
    starts_at, expires_at, auto_renew, lead_count, payment_id
  ) VALUES (
    p_vendor_id, p_category_id, v_plan_id, 'active', v_plan_price,
    now(), now() + make_interval(days => v_plan_duration_days),
    p_auto_renew, 0, p_payment_id
  )
  RETURNING id INTO v_final_subscription_id;

  RETURN QUERY SELECT v_final_subscription_id, false;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_vendor_subscription_direct(uuid, uuid, uuid, uuid, boolean, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purchase_vendor_subscription_direct(uuid, uuid, uuid, uuid, boolean, integer) FROM anon;
REVOKE ALL ON FUNCTION public.purchase_vendor_subscription_direct(uuid, uuid, uuid, uuid, boolean, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_vendor_subscription_direct(uuid, uuid, uuid, uuid, boolean, integer) TO service_role;

-- ============================================
-- 3. purchase_vendor_membership_direct: 크레딧 차감 없이 멤버십 생성/연장
-- ============================================
CREATE OR REPLACE FUNCTION public.purchase_vendor_membership_direct(
  p_vendor_id uuid,
  p_plan_id uuid,
  p_payment_id uuid,
  p_auto_renew boolean DEFAULT false
)
RETURNS TABLE(
  membership_id uuid,
  was_extended boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
  v_plan_price integer;
  v_plan_duration_days integer;
  v_plan_promo_price integer;
  v_plan_promo_expires_at timestamptz;
  v_effective_price integer;
  v_existing_membership_id uuid;
  v_existing_expires_at timestamptz;
  v_final_membership_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('membership'), hashtext(p_vendor_id::text));

  SELECT mp.id, mp.price, mp.duration_days, mp.promo_price, mp.promo_expires_at
    INTO v_plan_id, v_plan_price, v_plan_duration_days, v_plan_promo_price, v_plan_promo_expires_at
  FROM membership_plans mp
  WHERE mp.id = p_plan_id AND mp.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEMBERSHIP_PLAN_NOT_FOUND';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM vendor_categories vc
    JOIN categories c ON c.id = vc.category_id
    WHERE vc.vendor_id = p_vendor_id AND c.tier = 's_grade'
  ) THEN
    RAISE EXCEPTION 'VENDOR_NOT_S_GRADE';
  END IF;

  IF v_plan_promo_price IS NOT NULL
    AND (v_plan_promo_expires_at IS NULL OR v_plan_promo_expires_at > now()) THEN
    v_effective_price := v_plan_promo_price;
  ELSE
    v_effective_price := v_plan_price;
  END IF;

  SELECT vm.id, vm.expires_at
    INTO v_existing_membership_id, v_existing_expires_at
  FROM vendor_memberships vm
  WHERE vm.vendor_id = p_vendor_id AND vm.status = 'active'
  ORDER BY vm.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_existing_membership_id IS NOT NULL AND v_existing_expires_at <= now() THEN
    UPDATE vendor_memberships SET status = 'expired', updated_at = now()
    WHERE id = v_existing_membership_id;
    v_existing_membership_id := NULL;
    v_existing_expires_at := NULL;
  END IF;

  IF v_existing_membership_id IS NOT NULL THEN
    UPDATE vendor_memberships
    SET plan_id = v_plan_id,
        price_paid = v_effective_price,
        expires_at = v_existing_expires_at + make_interval(days => v_plan_duration_days),
        auto_renew = p_auto_renew,
        payment_id = p_payment_id,
        updated_at = now()
    WHERE id = v_existing_membership_id
    RETURNING id INTO v_final_membership_id;

    RETURN QUERY SELECT v_final_membership_id, true;
    RETURN;
  END IF;

  INSERT INTO vendor_memberships (
    vendor_id, plan_id, status, price_paid,
    starts_at, expires_at, auto_renew, payment_id
  ) VALUES (
    p_vendor_id, v_plan_id, 'active', v_effective_price,
    now(), now() + make_interval(days => v_plan_duration_days),
    p_auto_renew, p_payment_id
  )
  RETURNING id INTO v_final_membership_id;

  RETURN QUERY SELECT v_final_membership_id, false;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_vendor_membership_direct(uuid, uuid, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purchase_vendor_membership_direct(uuid, uuid, uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.purchase_vendor_membership_direct(uuid, uuid, uuid, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_vendor_membership_direct(uuid, uuid, uuid, boolean) TO service_role;

-- ============================================
-- 4. purchase_ad_priority_slot_direct: 크레딧 차감 없이 우선순위 구매
-- ============================================
CREATE OR REPLACE FUNCTION public.purchase_ad_priority_slot_direct(
  p_vendor_id uuid,
  p_priority_slot_id uuid,
  p_payment_id uuid
)
RETURNS TABLE(
  purchase_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot ad_priority_slots%ROWTYPE;
  v_active_count integer;
  v_jumpup_remaining integer;
  v_now timestamptz := now();
  v_purchase_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_priority_slot_id::text)::bigint);

  SELECT * INTO v_slot
  FROM ad_priority_slots
  WHERE id = p_priority_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRIORITY_SLOT_NOT_FOUND';
  END IF;

  IF v_slot.is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'PRIORITY_SLOT_INACTIVE';
  END IF;

  SELECT COUNT(*) INTO v_active_count
  FROM ad_priority_purchases
  WHERE priority_slot_id = p_priority_slot_id
    AND status = 'active'
    AND ends_at > v_now;

  IF v_active_count >= v_slot.max_slots THEN
    RAISE EXCEPTION 'PRIORITY_SLOT_FULL';
  END IF;

  v_jumpup_remaining := CASE WHEN v_slot.tier = 'rookie' THEN 3 ELSE 0 END;

  INSERT INTO ad_priority_purchases (
    priority_slot_id, vendor_id, category_id, tier, status,
    starts_at, ends_at, price_paid, payment_id, jumpup_remaining
  ) VALUES (
    v_slot.id, p_vendor_id, v_slot.category_id, v_slot.tier, 'active',
    v_now, v_now + interval '7 days', v_slot.price_weekly, p_payment_id, v_jumpup_remaining
  )
  RETURNING id INTO v_purchase_id;

  RETURN QUERY SELECT v_purchase_id;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_ad_priority_slot_direct(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purchase_ad_priority_slot_direct(uuid, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.purchase_ad_priority_slot_direct(uuid, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_ad_priority_slot_direct(uuid, uuid, uuid) TO service_role;
