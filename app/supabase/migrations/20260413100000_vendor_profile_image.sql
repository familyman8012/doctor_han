-- vendors 테이블에 프로필 이미지 URL 컬럼 추가
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

COMMENT ON COLUMN vendors.profile_image_url IS '업체 프로필 이미지 URL (예: /api/files/open?fileId=xxx)';
