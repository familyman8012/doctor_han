-- vendors.region_primary: TEXT → TEXT[]
-- 서비스 가능 지역을 복수로 저장 (예: ["서울특별시", "인천광역시", "경기도"] 또는 ["전국"])
-- region_secondary는 주관식 메모용 TEXT로 유지

-- 기존 btree 인덱스 제거 (배열에는 GIN이 적합)
DROP INDEX IF EXISTS idx_vendors_region;

-- 타입 변경: 기존 단일값을 배열 1개짜리로 변환
ALTER TABLE vendors
    ALTER COLUMN region_primary TYPE TEXT[]
    USING CASE
        WHEN region_primary IS NULL OR region_primary = '' THEN NULL
        ELSE ARRAY[region_primary]
    END;

-- 배열 검색용 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_vendors_region_primary_gin
    ON vendors USING GIN (region_primary);
