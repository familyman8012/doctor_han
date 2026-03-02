-- ============================================
-- 8-1. 건별 리드 과금 (CPL) 마이그레이션
-- ============================================

-- 1a. leads 테이블에 category_ids 추가
ALTER TABLE public.leads ADD COLUMN category_ids uuid[] DEFAULT '{}';
CREATE INDEX idx_leads_category_ids ON public.leads USING gin(category_ids);

-- 1b. Enum 생성
CREATE TYPE lead_charge_status AS ENUM (
  'charged', 'pending', 'refunded', 'waived', 'failed'
);

CREATE TYPE lead_charge_refund_reason AS ENUM (
  'duplicate_30d', 'no_response_72h', 'fraud_auto_filter',
  'fraud_vendor_report', 'admin_manual'
);

CREATE TYPE lead_report_reason AS ENUM (
  'wrong_contact', 'test_inquiry', 'competitor', 'inappropriate', 'other'
);

CREATE TYPE lead_report_status AS ENUM ('pending', 'approved', 'dismissed');

-- 1c. lead_charges 테이블
CREATE TABLE public.lead_charges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  vendor_id       uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  credit_account_id uuid NOT NULL REFERENCES credit_accounts(id) ON DELETE CASCADE,
  total_amount    integer NOT NULL DEFAULT 0,
  price_breakdown jsonb NOT NULL DEFAULT '[]',
  status          lead_charge_status NOT NULL DEFAULT 'pending',
  charge_transaction_id uuid REFERENCES credit_transactions(id) ON DELETE SET NULL,
  refund_transaction_id uuid REFERENCES credit_transactions(id) ON DELETE SET NULL,
  refund_reason   lead_charge_refund_reason,
  refund_amount   integer,
  refunded_at     timestamptz,
  no_response_warned_at timestamptz,
  is_duplicate    boolean NOT NULL DEFAULT false,
  duplicate_of_lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_charges_vendor_id ON public.lead_charges(vendor_id);
CREATE INDEX idx_lead_charges_status ON public.lead_charges(status);
CREATE INDEX idx_lead_charges_created_at ON public.lead_charges(created_at);

-- updated_at 트리거
CREATE TRIGGER set_lead_charges_updated_at
  BEFORE UPDATE ON public.lead_charges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 1d. lead_reports 테이블 (업체의 허위 리드 신고)
CREATE TABLE public.lead_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason          lead_report_reason NOT NULL,
  detail          text,
  status          lead_report_status NOT NULL DEFAULT 'pending',
  reviewed_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, reporter_user_id)
);

CREATE INDEX idx_lead_reports_status ON public.lead_reports(status);

CREATE TRIGGER set_lead_reports_updated_at
  BEFORE UPDATE ON public.lead_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 1e. notification_type 확장
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'lead_charged';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'lead_refunded';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'credit_low';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'lead_no_response_warning';

-- 1f. RLS 정책

-- lead_charges
ALTER TABLE public.lead_charges ENABLE ROW LEVEL SECURITY;

-- vendor owner can see their own charges
CREATE POLICY "lead_charges_select_vendor_owner"
  ON public.lead_charges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = lead_charges.vendor_id
        AND v.owner_user_id = auth.uid()
    )
  );

-- doctor can see charges for their own leads
CREATE POLICY "lead_charges_select_doctor"
  ON public.lead_charges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = lead_charges.lead_id
        AND l.doctor_user_id = auth.uid()
    )
  );

-- admin can see all charges
CREATE POLICY "lead_charges_select_admin"
  ON public.lead_charges FOR SELECT
  USING (public.is_admin());

-- lead_reports
ALTER TABLE public.lead_reports ENABLE ROW LEVEL SECURITY;

-- reporter can insert their own reports
CREATE POLICY "lead_reports_insert_reporter"
  ON public.lead_reports FOR INSERT
  WITH CHECK (reporter_user_id = auth.uid());

-- reporter can see their own reports
CREATE POLICY "lead_reports_select_reporter"
  ON public.lead_reports FOR SELECT
  USING (reporter_user_id = auth.uid());

-- admin can see and update all reports
CREATE POLICY "lead_reports_select_admin"
  ON public.lead_reports FOR SELECT
  USING (public.is_admin());

CREATE POLICY "lead_reports_update_admin"
  ON public.lead_reports FOR UPDATE
  USING (public.is_admin());
