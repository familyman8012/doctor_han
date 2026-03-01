-- ============================================
-- Ad System: 배너 광고 (10-1) + 우선순위 노출 (10-2)
-- ============================================

-- Enum: 배너 슬롯 위치
CREATE TYPE ad_slot_position AS ENUM ('main', 'sub');

-- Enum: 캠페인 상태
CREATE TYPE ad_campaign_status AS ENUM ('draft', 'pending', 'active', 'paused', 'completed', 'canceled');

-- Enum: 크리에이티브 유형
CREATE TYPE ad_creative_type AS ENUM ('image', 'html');

-- Enum: 우선순위 등급
CREATE TYPE ad_priority_tier AS ENUM ('premium', 'plus_up', 'plus', 'rookie');

-- Enum: 우선순위 구매 상태
CREATE TYPE ad_priority_purchase_status AS ENUM ('active', 'expired', 'canceled', 'refunded');

-- ============================================
-- 배너 광고 테이블
-- ============================================

-- 배너 슬롯 정의 (메인/서브)
CREATE TABLE ad_slots (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position       ad_slot_position NOT NULL,
  name           text NOT NULL,
  max_campaigns  integer NOT NULL DEFAULT 6,
  display_count  integer NOT NULL DEFAULT 3,
  price_monthly  integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- 배너 캠페인 (관리자가 생성)
CREATE TABLE ad_campaigns (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_slot_id        uuid NOT NULL REFERENCES ad_slots(id) ON DELETE CASCADE,
  vendor_id         uuid REFERENCES vendors(id) ON DELETE SET NULL,
  advertiser_name   text NOT NULL,
  status            ad_campaign_status NOT NULL DEFAULT 'draft',
  starts_at         timestamptz NOT NULL,
  ends_at           timestamptz NOT NULL,
  monthly_price     integer NOT NULL DEFAULT 0,
  total_impressions integer NOT NULL DEFAULT 0,
  total_clicks      integer NOT NULL DEFAULT 0,
  created_by        uuid NOT NULL REFERENCES profiles(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

-- 캠페인별 크리에이티브 소재
CREATE TABLE ad_creatives (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  type           ad_creative_type NOT NULL DEFAULT 'image',
  title          text NOT NULL,
  image_url      text,
  click_url      text NOT NULL,
  html_content   text,
  is_active      boolean NOT NULL DEFAULT true,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- 일별 노출/클릭 집계
CREATE TABLE ad_impressions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  date           date NOT NULL,
  impressions    integer NOT NULL DEFAULT 0,
  clicks         integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, date)
);

-- 개별 클릭 로그 (사기 탐지용)
CREATE TABLE ad_click_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  creative_id    uuid NOT NULL REFERENCES ad_creatives(id) ON DELETE CASCADE,
  user_id        uuid,
  ip_address     text,
  user_agent     text,
  clicked_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 우선순위 노출 테이블
-- ============================================

-- 카테고리별 우선순위 슬롯 정의
CREATE TABLE ad_priority_slots (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  tier           ad_priority_tier NOT NULL,
  max_slots      integer NOT NULL DEFAULT 4,
  price_weekly   integer NOT NULL DEFAULT 0,
  sort_order     integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, tier)
);

-- 업체의 우선순위 슬롯 구매
CREATE TABLE ad_priority_purchases (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  priority_slot_id       uuid NOT NULL REFERENCES ad_priority_slots(id) ON DELETE CASCADE,
  vendor_id              uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id            uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  tier                   ad_priority_tier NOT NULL,
  status                 ad_priority_purchase_status NOT NULL DEFAULT 'active',
  starts_at              timestamptz NOT NULL,
  ends_at                timestamptz NOT NULL,
  price_paid             integer NOT NULL DEFAULT 0,
  credit_transaction_id  uuid,
  jumpup_remaining       integer NOT NULL DEFAULT 0,
  jumpup_last_used_at    timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

-- 루키 점프업 이력
CREATE TABLE ad_priority_jumpups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id    uuid NOT NULL REFERENCES ad_priority_purchases(id) ON DELETE CASCADE,
  activated_at   timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 인덱스
-- ============================================

-- 배너 광고
CREATE INDEX idx_ad_campaigns_slot_id ON ad_campaigns(ad_slot_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_vendor_id ON ad_campaigns(vendor_id);
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(starts_at, ends_at);
CREATE INDEX idx_ad_campaigns_created_at ON ad_campaigns(created_at DESC);
CREATE INDEX idx_ad_creatives_campaign_id ON ad_creatives(campaign_id);
CREATE INDEX idx_ad_impressions_campaign_id ON ad_impressions(campaign_id);
CREATE INDEX idx_ad_impressions_date ON ad_impressions(date DESC);
CREATE INDEX idx_ad_click_logs_campaign_id ON ad_click_logs(campaign_id);
CREATE INDEX idx_ad_click_logs_clicked_at ON ad_click_logs(clicked_at DESC);

-- 우선순위 노출
CREATE INDEX idx_ad_priority_slots_category_id ON ad_priority_slots(category_id);
CREATE INDEX idx_ad_priority_purchases_slot_id ON ad_priority_purchases(priority_slot_id);
CREATE INDEX idx_ad_priority_purchases_vendor_id ON ad_priority_purchases(vendor_id);
CREATE INDEX idx_ad_priority_purchases_category_id ON ad_priority_purchases(category_id);
CREATE INDEX idx_ad_priority_purchases_status ON ad_priority_purchases(status);
CREATE INDEX idx_ad_priority_purchases_dates ON ad_priority_purchases(starts_at, ends_at);
CREATE INDEX idx_ad_priority_jumpups_purchase_id ON ad_priority_jumpups(purchase_id);
CREATE INDEX idx_ad_priority_jumpups_expires_at ON ad_priority_jumpups(expires_at);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_click_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_priority_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_priority_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_priority_jumpups ENABLE ROW LEVEL SECURITY;

-- ad_slots: 전체 SELECT 허용 (공개 렌더링)
CREATE POLICY "ad_slots_select_all"
  ON ad_slots FOR SELECT
  USING (true);

-- ad_campaigns: admin만 SELECT/INSERT/UPDATE
CREATE POLICY "ad_campaigns_select_admin"
  ON ad_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE POLICY "ad_campaigns_insert_admin"
  ON ad_campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE POLICY "ad_campaigns_update_admin"
  ON ad_campaigns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- ad_creatives: 전체 SELECT 허용 (공개 렌더링)
CREATE POLICY "ad_creatives_select_all"
  ON ad_creatives FOR SELECT
  USING (true);

-- ad_creatives: admin만 INSERT/UPDATE
CREATE POLICY "ad_creatives_insert_admin"
  ON ad_creatives FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE POLICY "ad_creatives_update_admin"
  ON ad_creatives FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- ad_impressions, ad_click_logs: service_role 전용 (서버에서만 접근)
-- RLS 활성화 + 정책 없음 = service_role(bypass)만 접근 가능

-- ad_priority_slots: 전체 SELECT 허용 (카탈로그)
CREATE POLICY "ad_priority_slots_select_all"
  ON ad_priority_slots FOR SELECT
  USING (true);

-- ad_priority_purchases: 본인 vendor 또는 admin
CREATE POLICY "ad_priority_purchases_select_own_or_admin"
  ON ad_priority_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = ad_priority_purchases.vendor_id
        AND v.owner_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- ad_priority_jumpups: 본인 vendor 또는 admin
CREATE POLICY "ad_priority_jumpups_select_own_or_admin"
  ON ad_priority_jumpups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ad_priority_purchases pp
      JOIN vendors v ON v.id = pp.vendor_id
      WHERE pp.id = ad_priority_jumpups.purchase_id
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
-- 시드 데이터: 배너 슬롯
-- ============================================

INSERT INTO ad_slots (position, name, max_campaigns, display_count, price_monthly, sort_order) VALUES
  ('main', '메인 배너', 6, 3, 2000000, 1),
  ('sub', '서브 배너', 4, 2, 1200000, 2);

-- ============================================
-- 시드 데이터: 우선순위 슬롯 (카테고리별 자동 생성)
-- ============================================

DO $$
DECLARE
  cat_record RECORD;
BEGIN
  FOR cat_record IN
    SELECT id FROM categories WHERE depth = 1 AND is_active = true
  LOOP
    INSERT INTO ad_priority_slots (category_id, tier, max_slots, price_weekly, sort_order) VALUES
      (cat_record.id, 'premium',  4, 300000, 1),
      (cat_record.id, 'plus_up',  4, 210000, 2),
      (cat_record.id, 'plus',     4,  60000, 3),
      (cat_record.id, 'rookie',   4,  30000, 4);
  END LOOP;
END $$;
