-- ============================================
-- Settlement atomic insert RPC (settlement + items)
-- ============================================

CREATE OR REPLACE FUNCTION public.create_settlement_with_items(
  p_vendor_id uuid,
  p_period_start date,
  p_period_end date,
  p_status settlement_status DEFAULT 'pending',
  p_total_revenue integer DEFAULT 0,
  p_total_refunds integer DEFAULT 0,
  p_net_revenue integer DEFAULT 0,
  p_lead_charge_revenue integer DEFAULT 0,
  p_lead_charge_refunds integer DEFAULT 0,
  p_subscription_revenue integer DEFAULT 0,
  p_membership_revenue integer DEFAULT 0,
  p_ad_purchase_revenue integer DEFAULT 0,
  p_bid_commission_revenue integer DEFAULT 0,
  p_total_item_count integer DEFAULT 0,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE(
  inserted boolean,
  id uuid,
  vendor_id uuid,
  period_start date,
  period_end date,
  status settlement_status,
  total_revenue integer,
  total_refunds integer,
  net_revenue integer,
  lead_charge_revenue integer,
  lead_charge_refunds integer,
  subscription_revenue integer,
  membership_revenue integer,
  ad_purchase_revenue integer,
  bid_commission_revenue integer,
  total_item_count integer,
  confirmed_by uuid,
  confirmed_at timestamptz,
  paid_by uuid,
  paid_at timestamptz,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settlement_id uuid;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'SETTLEMENT_ITEMS_NOT_ARRAY';
  END IF;

  -- Vendor/period 단위 직렬화로 동시 실행 시 중복 생성 방지
  PERFORM pg_advisory_xact_lock(
    hashtext('settlement'),
    hashtext(p_vendor_id::text || ':' || p_period_start::text || ':' || p_period_end::text)
  );

  INSERT INTO settlements (
    vendor_id,
    period_start,
    period_end,
    status,
    total_revenue,
    total_refunds,
    net_revenue,
    lead_charge_revenue,
    lead_charge_refunds,
    subscription_revenue,
    membership_revenue,
    ad_purchase_revenue,
    bid_commission_revenue,
    total_item_count
  )
  VALUES (
    p_vendor_id,
    p_period_start,
    p_period_end,
    p_status,
    p_total_revenue,
    p_total_refunds,
    p_net_revenue,
    p_lead_charge_revenue,
    p_lead_charge_refunds,
    p_subscription_revenue,
    p_membership_revenue,
    p_ad_purchase_revenue,
    p_bid_commission_revenue,
    p_total_item_count
  )
  ON CONFLICT (vendor_id, period_start, period_end) DO NOTHING
  RETURNING settlements.id INTO v_settlement_id;

  IF v_settlement_id IS NULL THEN
    RETURN QUERY
    SELECT false, s.*
    FROM settlements s
    WHERE s.vendor_id = p_vendor_id
      AND s.period_start = p_period_start
      AND s.period_end = p_period_end
    LIMIT 1;
    RETURN;
  END IF;

  IF jsonb_array_length(p_items) > 0 THEN
    INSERT INTO settlement_items (
      settlement_id,
      item_type,
      source_id,
      amount,
      refund_amount,
      net_amount,
      description,
      source_created_at
    )
    SELECT
      v_settlement_id,
      (item.item_type)::settlement_item_type,
      item.source_id,
      item.amount,
      item.refund_amount,
      item.net_amount,
      item.description,
      item.source_created_at
    FROM jsonb_to_recordset(p_items) AS item(
      item_type text,
      source_id uuid,
      amount integer,
      refund_amount integer,
      net_amount integer,
      description text,
      source_created_at timestamptz
    );
  END IF;

  RETURN QUERY
  SELECT true, s.*
  FROM settlements s
  WHERE s.id = v_settlement_id
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.create_settlement_with_items(
  uuid, date, date, settlement_status, integer, integer, integer, integer, integer, integer, integer, integer, integer, integer, jsonb
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_settlement_with_items(
  uuid, date, date, settlement_status, integer, integer, integer, integer, integer, integer, integer, integer, integer, integer, jsonb
) FROM anon;
REVOKE ALL ON FUNCTION public.create_settlement_with_items(
  uuid, date, date, settlement_status, integer, integer, integer, integer, integer, integer, integer, integer, integer, integer, jsonb
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_settlement_with_items(
  uuid, date, date, settlement_status, integer, integer, integer, integer, integer, integer, integer, integer, integer, integer, jsonb
) TO service_role;
