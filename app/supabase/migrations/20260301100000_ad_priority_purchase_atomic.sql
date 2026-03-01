-- ============================================
-- Ad Priority Purchase: atomic credit deduction + purchase insert
-- ============================================

CREATE OR REPLACE FUNCTION purchase_ad_priority_slot(
  p_vendor_id uuid,
  p_priority_slot_id uuid
)
RETURNS TABLE(
  purchase_id uuid,
  transaction_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot ad_priority_slots%ROWTYPE;
  v_account_id uuid;
  v_account_balance integer;
  v_active_count integer;
  v_jumpup_remaining integer;
  v_now timestamptz := now();
BEGIN
  -- Serialize purchases per slot to avoid overbooking in concurrent requests.
  PERFORM pg_advisory_xact_lock(hashtext(p_priority_slot_id::text)::bigint);

  SELECT *
    INTO v_slot
  FROM ad_priority_slots
  WHERE id = p_priority_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRIORITY_SLOT_NOT_FOUND';
  END IF;

  IF v_slot.is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'PRIORITY_SLOT_INACTIVE';
  END IF;

  SELECT COUNT(*)
    INTO v_active_count
  FROM ad_priority_purchases
  WHERE priority_slot_id = p_priority_slot_id
    AND status = 'active'
    AND ends_at > v_now;

  IF v_active_count >= v_slot.max_slots THEN
    RAISE EXCEPTION 'PRIORITY_SLOT_FULL';
  END IF;

  SELECT id, balance
    INTO v_account_id, v_account_balance
  FROM credit_accounts
  WHERE vendor_id = p_vendor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CREDIT_ACCOUNT_NOT_FOUND';
  END IF;

  IF v_account_balance < v_slot.price_weekly THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDIT';
  END IF;

  SELECT t.transaction_id
    INTO transaction_id
  FROM credit_balance_update(
    v_account_id,
    NULL,
    -v_slot.price_weekly,
    'deduct',
    format('우선순위 노출 구매 (%s)', v_slot.tier),
    NULL
  ) AS t
  LIMIT 1;

  v_jumpup_remaining := CASE
    WHEN v_slot.tier = 'rookie' THEN 3
    ELSE 0
  END;

  INSERT INTO ad_priority_purchases (
    priority_slot_id,
    vendor_id,
    category_id,
    tier,
    status,
    starts_at,
    ends_at,
    price_paid,
    credit_transaction_id,
    jumpup_remaining
  ) VALUES (
    v_slot.id,
    p_vendor_id,
    v_slot.category_id,
    v_slot.tier,
    'active',
    v_now,
    v_now + interval '7 days',
    v_slot.price_weekly,
    transaction_id,
    v_jumpup_remaining
  )
  RETURNING id INTO purchase_id;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_ad_priority_slot(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purchase_ad_priority_slot(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.purchase_ad_priority_slot(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_ad_priority_slot(uuid, uuid) TO service_role;
