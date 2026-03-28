-- 리드 열람 시각 추적 + 미열람 리마인더 + 알림 타입 확장

-- 1. leads 테이블에 열람 시각 컬럼 추가 (NULL = 미열람)
ALTER TABLE public.leads ADD COLUMN viewed_at timestamptz;

-- 미열람 리드 빠른 조회를 위한 partial index
CREATE INDEX idx_leads_viewed_at_null ON public.leads(created_at) WHERE viewed_at IS NULL;

-- 2. lead_charges에 미열람 리마인더 중복 방지 컬럼 (no_response_warned_at 패턴 동일)
ALTER TABLE public.lead_charges ADD COLUMN unviewed_reminded_at timestamptz;

-- 3. notification_type enum 확장
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'lead_status_changed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'lead_unviewed_reminder';
