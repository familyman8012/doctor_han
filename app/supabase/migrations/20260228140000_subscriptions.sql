-- ============================================
-- Subscriptions: 기간제 무제한 리드 수신 상품
-- ============================================

-- Enum: 구독 상태
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'canceled');

-- 구독 플랜 카탈로그 (admin 관리, credit_packages 패턴)
CREATE TABLE subscription_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  duration_days integer NOT NULL CHECK (duration_days > 0),
  price         integer NOT NULL CHECK (price > 0),
  daily_rate    integer NOT NULL,
  discount_rate numeric(5,4) NOT NULL DEFAULT 0,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 업체 구독 인스턴스
CREATE TABLE vendor_subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id           uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  plan_id               uuid NOT NULL REFERENCES subscription_plans(id),
  status                subscription_status NOT NULL DEFAULT 'active',
  price_paid            integer NOT NULL,
  starts_at             timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz NOT NULL,
  auto_renew            boolean NOT NULL DEFAULT false,
  lead_count            integer NOT NULL DEFAULT 0,
  credit_transaction_id uuid REFERENCES credit_transactions(id) ON DELETE SET NULL,
  canceled_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Partial unique: 동일 업체+카테고리에 active 구독 1개만
CREATE UNIQUE INDEX idx_vs_vendor_category_active
  ON vendor_subscriptions(vendor_id, category_id) WHERE status = 'active';

CREATE INDEX idx_vs_vendor_id ON vendor_subscriptions(vendor_id);
CREATE INDEX idx_vs_expires_at_active ON vendor_subscriptions(expires_at) WHERE status = 'active';

-- Updated_at 트리거
CREATE TRIGGER subscription_plans_set_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER vendor_subscriptions_set_updated_at
  BEFORE UPDATE ON vendor_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;

-- subscription_plans: 활성 플랜은 누구나 읽기 가능
CREATE POLICY "subscription_plans_select_active"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- vendor_subscriptions: vendor owner 또는 admin
CREATE POLICY "vs_owner_all" ON vendor_subscriptions
  FOR ALL TO authenticated
  USING (is_vendor_owner(vendor_id) OR is_admin())
  WITH CHECK (is_vendor_owner(vendor_id) OR is_admin());

-- ============================================
-- 시드 데이터: 구독 플랜 5종
-- ============================================
INSERT INTO subscription_plans (name, duration_days, price, daily_rate, discount_rate, sort_order) VALUES
  ('30일', 30, 500000, 16667, 0, 1),
  ('60일', 60, 900000, 15000, 0.1000, 2),
  ('90일', 90, 1200000, 13333, 0.2000, 3),
  ('180일', 180, 2100000, 11667, 0.3000, 4),
  ('365일', 365, 3650000, 10000, 0.4000, 5);
