-- vendor_service_prices: 업체 서비스별 단가 설정
-- 8-1(리드 과금) 선행 조건

CREATE TYPE vendor_service_price_status AS ENUM ('active', 'archived');

CREATE TABLE vendor_service_prices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id     uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  price           integer NOT NULL CHECK (price >= 10000 AND price <= 200000),
  daily_budget_limit integer,  -- nullable, 일일 예산 한도 (원)
  status          vendor_service_price_status NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Partial unique: 동일 업체+카테고리에 active 가격 1개만
CREATE UNIQUE INDEX idx_vsp_vendor_category_active
  ON vendor_service_prices(vendor_id, category_id) WHERE status = 'active';

CREATE INDEX idx_vsp_vendor_id ON vendor_service_prices(vendor_id);
CREATE INDEX idx_vsp_status ON vendor_service_prices(status);

CREATE TRIGGER vendor_service_prices_set_updated_at
  BEFORE UPDATE ON vendor_service_prices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE vendor_service_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vsp_owner_all" ON vendor_service_prices
  FOR ALL TO authenticated
  USING (is_vendor_owner(vendor_id) OR is_admin())
  WITH CHECK (is_vendor_owner(vendor_id) OR is_admin());
