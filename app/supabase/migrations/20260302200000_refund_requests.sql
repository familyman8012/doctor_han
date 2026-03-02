-- ============================================
-- 12-2. 환불/보상 시스템 마이그레이션
-- ============================================

-- 1. Enum 생성
CREATE TYPE refund_request_reason AS ENUM (
  'wrong_contact', 'spam_lead', 'competitor_lead',
  'no_response', 'service_mismatch', 'other'
);

CREATE TYPE refund_request_status AS ENUM (
  'pending', 'approved', 'rejected'
);

-- 2. refund_requests 테이블
CREATE TABLE public.refund_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_charge_id    uuid NOT NULL UNIQUE REFERENCES lead_charges(id) ON DELETE CASCADE,
  vendor_id         uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason            refund_request_reason NOT NULL,
  description       text,
  status            refund_request_status NOT NULL DEFAULT 'pending',
  admin_note        text,
  reviewed_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 3. 인덱스
CREATE INDEX idx_refund_requests_vendor_id ON public.refund_requests(vendor_id);
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX idx_refund_requests_created_at ON public.refund_requests(created_at DESC);

-- 4. updated_at 트리거 (기존 함수 재사용)
CREATE TRIGGER set_refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. RLS 정책
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- vendor owner: 자기 요청만 조회
CREATE POLICY "refund_requests_select_vendor_owner"
  ON public.refund_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = refund_requests.vendor_id
        AND v.owner_user_id = auth.uid()
    )
  );

-- vendor owner: 자기 업체 건만 생성
CREATE POLICY "refund_requests_insert_vendor_owner"
  ON public.refund_requests FOR INSERT
  WITH CHECK (
    requester_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = refund_requests.vendor_id
        AND v.owner_user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM lead_charges c
      WHERE c.id = refund_requests.lead_charge_id
        AND c.vendor_id = refund_requests.vendor_id
        AND c.status = 'charged'
    )
  );

-- admin: 전체 조회
CREATE POLICY "refund_requests_select_admin"
  ON public.refund_requests FOR SELECT
  USING (public.is_admin());

-- admin: 전체 수정 (심사 처리)
CREATE POLICY "refund_requests_update_admin"
  ON public.refund_requests FOR UPDATE
  USING (public.is_admin());
