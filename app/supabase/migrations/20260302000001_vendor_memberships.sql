-- ============================================
-- P4: S등급 입점비/연회비 (Vendor Memberships)
-- ============================================

-- 1. categories.tier 컬럼 추가
ALTER TABLE categories ADD COLUMN tier text NOT NULL DEFAULT 'standard'
  CHECK (tier IN ('standard', 's_grade'));

-- 2. S등급 카테고리 시드
-- 기존 원외탕전 → s_grade
UPDATE categories SET tier = 's_grade' WHERE slug = 'external-decoction';

-- 약재회사/제약사 루트 카테고리 추가
INSERT INTO categories (name, slug, sort_order, depth, tier)
VALUES ('약재회사/제약사', 'herb-pharma', 90, 1, 's_grade')
ON CONFLICT (slug) DO UPDATE SET tier = 's_grade';

-- 원외탕전 하위 서브카테고리 추가
INSERT INTO categories (name, slug, sort_order, depth, tier, parent_id)
VALUES
  ('한약', 'herbal-medicine', 1, 2, 's_grade',
    (SELECT id FROM categories WHERE slug = 'external-decoction')),
  ('약침', 'pharmacopuncture', 2, 2, 's_grade',
    (SELECT id FROM categories WHERE slug = 'external-decoction'))
ON CONFLICT (slug) DO UPDATE SET tier = 's_grade';

-- 3. membership_plans 테이블
CREATE TABLE membership_plans (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  duration_days     integer NOT NULL CHECK (duration_days > 0),
  price             integer NOT NULL CHECK (price > 0),
  promo_price       integer CHECK (promo_price > 0),
  promo_expires_at  timestamptz,
  sort_order        integer NOT NULL DEFAULT 0,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER membership_plans_set_updated_at
  BEFORE UPDATE ON membership_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 시드: 연간 입점비 200만원
INSERT INTO membership_plans (name, duration_days, price, promo_price, promo_expires_at, sort_order)
VALUES ('연간 입점비', 365, 2000000, NULL, NULL, 1);

-- 4. vendor_memberships 테이블
CREATE TABLE vendor_memberships (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  plan_id               uuid NOT NULL REFERENCES membership_plans(id),
  status                text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
  price_paid            integer NOT NULL,
  starts_at             timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz NOT NULL,
  auto_renew            boolean NOT NULL DEFAULT false,
  credit_transaction_id uuid REFERENCES credit_transactions(id) ON DELETE SET NULL,
  payment_id            uuid REFERENCES payments(id) ON DELETE SET NULL,
  canceled_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- 업체당 활성 멤버십 1개만
CREATE UNIQUE INDEX idx_vm_vendor_active
  ON vendor_memberships(vendor_id) WHERE status = 'active';

CREATE INDEX idx_vm_vendor_id ON vendor_memberships(vendor_id);
CREATE INDEX idx_vm_expires_at_active ON vendor_memberships(expires_at) WHERE status = 'active';

CREATE TRIGGER vendor_memberships_set_updated_at
  BEFORE UPDATE ON vendor_memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. vendor_membership_reminder_logs (알림 중복 방지)
CREATE TABLE vendor_membership_reminder_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id        uuid NOT NULL REFERENCES vendor_memberships(id) ON DELETE CASCADE,
  reminder_days_before integer NOT NULL CHECK (reminder_days_before IN (30, 7)),
  sent_at              timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (membership_id, reminder_days_before)
);

CREATE INDEX idx_vmrl_membership_id ON vendor_membership_reminder_logs(membership_id);
CREATE INDEX idx_vmrl_sent_at ON vendor_membership_reminder_logs(sent_at DESC);

-- 6. RLS
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_membership_reminder_logs ENABLE ROW LEVEL SECURITY;

-- membership_plans: 활성 플랜만 공개 조회
CREATE POLICY "membership_plans_select_active"
  ON membership_plans FOR SELECT
  USING (is_active = true);

-- vendor_memberships: 본인 또는 admin 조회만 (직접 쓰기 차단)
CREATE POLICY "vm_owner_select" ON vendor_memberships
  FOR SELECT TO authenticated
  USING (is_vendor_owner(vendor_id) OR is_admin());

-- reminder_logs: admin만 조회
CREATE POLICY "vmrl_admin_select"
  ON vendor_membership_reminder_logs
  FOR SELECT TO authenticated
  USING (is_admin());

-- 7. has_active_vendor_membership() SQL 함수
CREATE OR REPLACE FUNCTION public.has_active_vendor_membership(
  p_vendor_id uuid,
  p_reference_time timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE sql STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendor_memberships vm
    WHERE vm.vendor_id = p_vendor_id
      AND vm.status = 'active'
      AND vm.expires_at > p_reference_time
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_vendor_membership(uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_active_vendor_membership(uuid, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.has_active_vendor_membership(uuid, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_vendor_membership(uuid, timestamptz) TO service_role;

-- 8. purchase_vendor_membership() RPC
CREATE OR REPLACE FUNCTION public.purchase_vendor_membership(
  p_vendor_id uuid,
  p_plan_id uuid,
  p_auto_renew boolean DEFAULT false
)
RETURNS TABLE(
  membership_id uuid,
  new_balance integer,
  transaction_id uuid,
  was_extended boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_plan_id uuid; v_plan_name text; v_plan_price integer; v_plan_duration_days integer;
  v_plan_promo_price integer; v_plan_promo_expires_at timestamptz;
  v_effective_price integer;
  v_existing_membership_id uuid; v_existing_expires_at timestamptz;
  v_credit_account_id uuid; v_new_balance integer; v_transaction_id uuid; v_final_membership_id uuid;
BEGIN
  -- Advisory lock: vendor 단위
  PERFORM pg_advisory_xact_lock(hashtext('membership'), hashtext(p_vendor_id::text));

  -- Plan 검증
  SELECT mp.id, mp.name, mp.price, mp.duration_days, mp.promo_price, mp.promo_expires_at
    INTO v_plan_id, v_plan_name, v_plan_price, v_plan_duration_days, v_plan_promo_price, v_plan_promo_expires_at
  FROM membership_plans mp WHERE mp.id = p_plan_id AND mp.is_active = true;

  IF NOT FOUND THEN RAISE EXCEPTION 'MEMBERSHIP_PLAN_NOT_FOUND'; END IF;

  -- S등급 업체 검증: vendor_categories → categories.tier
  IF NOT EXISTS (
    SELECT 1 FROM vendor_categories vc
    JOIN categories c ON c.id = vc.category_id
    WHERE vc.vendor_id = p_vendor_id AND c.tier = 's_grade'
  ) THEN RAISE EXCEPTION 'VENDOR_NOT_S_GRADE'; END IF;

  -- 프로모션 가격 결정
  IF v_plan_promo_price IS NOT NULL
    AND (v_plan_promo_expires_at IS NULL OR v_plan_promo_expires_at > now()) THEN
    v_effective_price := v_plan_promo_price;
  ELSE
    v_effective_price := v_plan_price;
  END IF;

  -- 기존 활성 멤버십 확인
  SELECT vm.id, vm.expires_at INTO v_existing_membership_id, v_existing_expires_at
  FROM vendor_memberships vm
  WHERE vm.vendor_id = p_vendor_id AND vm.status = 'active'
  ORDER BY vm.created_at DESC LIMIT 1 FOR UPDATE;

  -- 만료된 active 행 정리
  IF v_existing_membership_id IS NOT NULL AND v_existing_expires_at <= now() THEN
    UPDATE vendor_memberships SET status = 'expired', updated_at = now()
    WHERE id = v_existing_membership_id;
    v_existing_membership_id := NULL; v_existing_expires_at := NULL;
  END IF;

  -- 크레딧 계정 확보
  INSERT INTO credit_accounts (vendor_id) VALUES (p_vendor_id) ON CONFLICT (vendor_id) DO NOTHING;

  SELECT ca.id INTO v_credit_account_id FROM credit_accounts ca
  WHERE ca.vendor_id = p_vendor_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'CREDIT_ACCOUNT_NOT_FOUND'; END IF;

  -- 크레딧 차감
  SELECT c.new_balance, c.transaction_id INTO v_new_balance, v_transaction_id
  FROM credit_balance_update(
    p_credit_account_id => v_credit_account_id, p_transaction_id => NULL,
    p_amount => -v_effective_price, p_type => 'deduct',
    p_description => format('입점비 구매: %s', v_plan_name), p_expires_at => NULL
  ) AS c;

  -- 기존 멤버십 연장
  IF v_existing_membership_id IS NOT NULL THEN
    UPDATE vendor_memberships
    SET plan_id = v_plan_id, price_paid = v_effective_price,
        expires_at = v_existing_expires_at + make_interval(days => v_plan_duration_days),
        auto_renew = p_auto_renew, credit_transaction_id = v_transaction_id, updated_at = now()
    WHERE id = v_existing_membership_id RETURNING id INTO v_final_membership_id;
    RETURN QUERY SELECT v_final_membership_id, v_new_balance, v_transaction_id, true;
    RETURN;
  END IF;

  -- 신규 멤버십 생성
  INSERT INTO vendor_memberships (vendor_id, plan_id, status, price_paid,
    starts_at, expires_at, auto_renew, credit_transaction_id)
  VALUES (p_vendor_id, v_plan_id, 'active', v_effective_price,
    now(), now() + make_interval(days => v_plan_duration_days), p_auto_renew, v_transaction_id)
  RETURNING id INTO v_final_membership_id;

  RETURN QUERY SELECT v_final_membership_id, v_new_balance, v_transaction_id, false;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_vendor_membership(uuid, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purchase_vendor_membership(uuid, uuid, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.purchase_vendor_membership(uuid, uuid, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_vendor_membership(uuid, uuid, boolean) TO service_role;

-- 9. notification_type 확장
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'membership_expiring';
