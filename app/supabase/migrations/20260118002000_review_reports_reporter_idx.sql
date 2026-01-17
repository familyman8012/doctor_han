-- reporter_user_id 인덱스 추가 (사용자별 신고 이력 조회용)
create index if not exists review_reports_reporter_user_id_idx
    on public.review_reports(reporter_user_id);
