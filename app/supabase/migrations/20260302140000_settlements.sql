-- ============================================
-- 12-1. 정산 관리 (Settlement Management) 마이그레이션
-- ============================================

-- 1. Enums
CREATE TYPE settlement_status AS ENUM ('pending', 'confirmed', 'paid');

CREATE TYPE settlement_item_type AS ENUM (
  'lead_charge', 'subscription', 'membership', 'ad_purchase', 'bid_commission'
);

-- 2. settlements: 업체별 월별 정산 (업체 × 월 당 1건)
CREATE TABLE public.settlements (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id               uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  period_start            date NOT NULL,
  period_end              date NOT NULL,
  status                  settlement_status NOT NULL DEFAULT 'pending',
  total_revenue           integer NOT NULL DEFAULT 0,
  total_refunds           integer NOT NULL DEFAULT 0,
  net_revenue             integer NOT NULL DEFAULT 0,
  lead_charge_revenue     integer NOT NULL DEFAULT 0,
  lead_charge_refunds     integer NOT NULL DEFAULT 0,
  subscription_revenue    integer NOT NULL DEFAULT 0,
  membership_revenue      integer NOT NULL DEFAULT 0,
  ad_purchase_revenue     integer NOT NULL DEFAULT 0,
  bid_commission_revenue  integer NOT NULL DEFAULT 0,
  total_item_count        integer NOT NULL DEFAULT 0,
  confirmed_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at            timestamptz,
  paid_by                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_at                 timestamptz,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, period_start, period_end)
);

-- 3. settlement_items: 정산 상세 항목 (개별 거래 참조)
CREATE TABLE public.settlement_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id     uuid NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  item_type         settlement_item_type NOT NULL,
  source_id         uuid NOT NULL,
  amount            integer NOT NULL DEFAULT 0,
  refund_amount     integer NOT NULL DEFAULT 0,
  net_amount        integer NOT NULL DEFAULT 0,
  description       text,
  source_created_at timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(settlement_id, item_type, source_id)
);

-- 4. Indexes
CREATE INDEX idx_settlements_vendor_id ON public.settlements(vendor_id);
CREATE INDEX idx_settlements_status ON public.settlements(status);
CREATE INDEX idx_settlements_period ON public.settlements(period_start, period_end);

CREATE INDEX idx_settlement_items_settlement_id ON public.settlement_items(settlement_id);
CREATE INDEX idx_settlement_items_item_type ON public.settlement_items(item_type);

-- 5. updated_at trigger
CREATE TRIGGER set_settlements_updated_at
  BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. RLS
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;

-- settlements: admin SELECT/UPDATE only
CREATE POLICY "settlements_select_admin"
  ON public.settlements FOR SELECT
  USING (public.is_admin());

CREATE POLICY "settlements_update_admin"
  ON public.settlements FOR UPDATE
  USING (public.is_admin());

-- settlement_items: admin SELECT only
CREATE POLICY "settlement_items_select_admin"
  ON public.settlement_items FOR SELECT
  USING (public.is_admin());
