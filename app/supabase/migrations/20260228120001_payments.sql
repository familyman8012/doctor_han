-- ============================================
-- Payments: 결제 기록 + 웹훅 로그
-- ============================================

-- Enum: 결제 상태
CREATE TYPE payment_status AS ENUM (
  'ready',
  'in_progress',
  'done',
  'canceled',
  'partial_canceled',
  'aborted',
  'expired'
);

-- Enum: 결제 수단
CREATE TYPE payment_method AS ENUM (
  'card',
  'virtual_account',
  'transfer',
  'mobile',
  'easy_pay',
  'etc'
);

-- 결제 기록
CREATE TABLE payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      text NOT NULL UNIQUE,
  payment_key   text UNIQUE,
  vendor_id     uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        integer NOT NULL CHECK (amount > 0),
  status        payment_status NOT NULL DEFAULT 'ready',
  method        payment_method,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 웹훅 이벤트 로그
CREATE TABLE payment_webhooks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    text NOT NULL,
  payment_key   text,
  raw_body      jsonb NOT NULL,
  signature     text,
  processed     boolean NOT NULL DEFAULT false,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_payment_key ON payments(payment_key);
CREATE INDEX idx_payments_vendor_id ON payments(vendor_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payment_webhooks_payment_key ON payment_webhooks(payment_key);
CREATE INDEX idx_payment_webhooks_processed ON payment_webhooks(processed);

-- ============================================
-- FK: credit_transactions.payment_id → payments.id
-- ============================================
ALTER TABLE credit_transactions
  ADD CONSTRAINT fk_credit_transactions_payment
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- ============================================
-- RLS
-- ============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

-- payments: 본인 결제만 조회 (변경은 service_role)
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- payment_webhooks: admin only
CREATE POLICY "payment_webhooks_admin_only"
  ON payment_webhooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );
