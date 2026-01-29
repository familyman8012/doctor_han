-- notification_settings 확장: 카카오 알림톡 수신 여부
ALTER TABLE public.notification_settings
ADD COLUMN kakao_enabled boolean NOT NULL DEFAULT false;

-- notification_deliveries 재시도 지원
ALTER TABLE public.notification_deliveries
ADD COLUMN retry_count integer NOT NULL DEFAULT 0,
ADD COLUMN max_retries integer NOT NULL DEFAULT 3,
ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- 인덱스: 상태별 조회 최적화
CREATE INDEX notification_deliveries_status_idx
  ON public.notification_deliveries(status);
