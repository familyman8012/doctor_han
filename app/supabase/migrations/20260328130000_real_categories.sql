-- ============================================
-- 실제 운영 카테고리 적용
-- 기존 임시 카테고리 → 17개 대분류 + 소분류
-- ============================================

-- 1. 기존 참조 데이터 제거 (beta이므로 안전하게 전체 삭제)
-- 테이블 존재 여부에 관계없이 안전하게 처리
DO $$
BEGIN
  -- RESTRICT FK 테이블 먼저
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    DELETE FROM public.products;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_categories') THEN
    DELETE FROM public.vendor_categories;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_service_prices') THEN
    DELETE FROM public.vendor_service_prices;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ad_category_pricing') THEN
    DELETE FROM public.ad_category_pricing;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ad_positions') THEN
    DELETE FROM public.ad_positions;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_features') THEN
    DELETE FROM public.subscription_features;
  END IF;
END $$;

-- 2. 기존 카테고리 전체 삭제 (하위 먼저)
DELETE FROM public.categories WHERE depth > 1;
DELETE FROM public.categories;

-- 3. 대분류 INSERT (sort_order = 번호 * 10)
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type) VALUES
  ('원외탕전 (한약)', 'external-decoction-herbal', 10, 1, 's_grade', 'vendor'),
  ('원외탕전 (약침)', 'external-decoction-pharma', 20, 1, 's_grade', 'vendor'),
  ('한약재',          'herbal-materials',          30, 1, 'standard', 'product'),
  ('의료기기',        'medical-devices',           40, 1, 'standard', 'product'),
  ('개원/컨설팅',     'opening-consulting',        50, 1, 'standard', 'product'),
  ('마케팅',          'marketing',                 60, 1, 'standard', 'product'),
  ('인테리어',        'interior',                  70, 1, 'standard', 'vendor'),
  ('간판',            'signage',                   80, 1, 'standard', 'product'),
  ('디자인',          'design',                    90, 1, 'standard', 'product'),
  ('세무·법무·노무',  'tax-law-labor',            100, 1, 'standard', 'product'),
  ('탕전기기',        'decoction-equipment',      110, 1, 'standard', 'product'),
  ('의류/침구류',     'clothing-bedding',         120, 1, 'standard', 'product'),
  ('병원 관리',       'hospital-management',      130, 1, 'standard', 'product'),
  ('경영지원',        'business-support',         140, 1, 'standard', 'product'),
  ('교육·학술',       'education-academic',       150, 1, 'standard', 'product'),
  ('라이프',          'life',                     160, 1, 'standard', 'product')
ON CONFLICT (slug) DO NOTHING;

-- 4. 소분류 INSERT

-- 1) 원외탕전 (한약)
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('한약', 'herbal-medicine', 1, 2, 's_grade', 'vendor',
    (SELECT id FROM public.categories WHERE slug = 'external-decoction-herbal'))
ON CONFLICT (slug) DO NOTHING;

-- 2) 원외탕전 (약침)
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('약침', 'pharmacopuncture', 1, 2, 's_grade', 'vendor',
    (SELECT id FROM public.categories WHERE slug = 'external-decoction-pharma'))
ON CONFLICT (slug) DO NOTHING;

-- 3) 한약재
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('일반', 'herbal-general', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'herbal-materials')),
  ('녹용', 'deer-antler', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'herbal-materials'))
ON CONFLICT (slug) DO NOTHING;

-- 4) 의료기기
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('진단기기', 'diagnostic-devices', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'medical-devices')),
  ('레이저', 'laser', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'medical-devices')),
  ('미용의료기', 'aesthetic-devices', 3, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'medical-devices')),
  ('초음파', 'ultrasound', 4, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'medical-devices')),
  ('엑스레이', 'xray', 5, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'medical-devices')),
  ('치료기', 'therapy-devices', 6, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'medical-devices'))
ON CONFLICT (slug) DO NOTHING;

-- 5) 개원/컨설팅
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('경영컨설팅', 'management-consulting', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'opening-consulting')),
  ('입지분석', 'location-analysis', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'opening-consulting')),
  ('개원대출', 'opening-loan', 3, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'opening-consulting')),
  ('전자차트', 'emr', 4, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'opening-consulting')),
  ('카드리더기', 'card-reader', 5, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'opening-consulting')),
  ('CCTV', 'cctv', 6, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'opening-consulting')),
  ('MSO', 'mso', 7, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'opening-consulting'))
ON CONFLICT (slug) DO NOTHING;

-- 6) 마케팅
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('채널 활성화', 'channel-activation', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'marketing')),
  ('바이럴 협찬', 'viral-sponsorship', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'marketing')),
  ('지도 마케팅', 'map-marketing', 3, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'marketing')),
  ('업종 목적별', 'industry-purpose', 4, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'marketing')),
  ('SEO 최적화 노출', 'seo-optimization', 5, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'marketing')),
  ('해외 마케팅', 'overseas-marketing', 6, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'marketing')),
  ('퍼포먼스 마케팅', 'performance-marketing', 7, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'marketing')),
  ('AI 마케팅', 'ai-marketing', 8, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'marketing')),
  ('기타 마케팅', 'other-marketing', 9, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'marketing'))
ON CONFLICT (slug) DO NOTHING;

-- 7) 인테리어
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('인테리어', 'interior-sub', 1, 2, 'standard', 'vendor',
    (SELECT id FROM public.categories WHERE slug = 'interior'))
ON CONFLICT (slug) DO NOTHING;

-- 8) 간판
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('간판', 'signage-sub', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'signage'))
ON CONFLICT (slug) DO NOTHING;

-- 9) 디자인
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('전단지 배너 인쇄물', 'flyer-banner-print', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'design')),
  ('SNS 썸네일', 'sns-thumbnail', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'design')),
  ('명함', 'business-card', 3, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'design')),
  ('박스/패키지', 'box-package', 4, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'design')),
  ('쇼핑백/한약가방', 'shopping-bag', 5, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'design')),
  ('명찰', 'name-tag', 6, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'design')),
  ('로고/브랜딩', 'logo-branding', 7, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'design')),
  ('도장', 'stamp', 8, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'design'))
ON CONFLICT (slug) DO NOTHING;

-- 10) 세무·법무·노무
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('세무', 'tax', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'tax-law-labor')),
  ('노무', 'labor', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'tax-law-labor')),
  ('법무', 'legal', 3, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'tax-law-labor'))
ON CONFLICT (slug) DO NOTHING;

-- 11) 탕전기기
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('약탕기', 'herb-boiler', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'decoction-equipment')),
  ('약포장기', 'herb-packer', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'decoction-equipment'))
ON CONFLICT (slug) DO NOTHING;

-- 12) 의류/침구류
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('유니폼', 'uniform', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'clothing-bedding')),
  ('침구류', 'bedding', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'clothing-bedding')),
  ('커텐/블라인드', 'curtain-blind', 3, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'clothing-bedding'))
ON CONFLICT (slug) DO NOTHING;

-- 13) 병원 관리
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('의료폐기물', 'medical-waste', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'hospital-management')),
  ('누수', 'water-leak', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'hospital-management')),
  ('에어컨', 'air-conditioner', 3, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'hospital-management')),
  ('보험', 'insurance', 4, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'hospital-management')),
  ('병원급식', 'hospital-meal', 5, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'hospital-management'))
ON CONFLICT (slug) DO NOTHING;

-- 14) 경영지원
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('청소 외주', 'cleaning-outsource', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'business-support')),
  ('식사/반찬/도시락', 'meal-lunchbox', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'business-support')),
  ('개원선물', 'opening-gift', 3, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'business-support')),
  ('상표등록', 'trademark-registration', 4, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'business-support')),
  ('식품/건기식', 'food-supplement', 5, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'business-support')),
  ('이사/짐보관', 'moving-storage', 6, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'business-support')),
  ('CRM 개발', 'crm-development', 7, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'business-support')),
  ('소독/해충방제', 'pest-control', 8, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'business-support')),
  ('보안서비스', 'security-service', 9, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'business-support')),
  ('시설 안전관리', 'facility-safety', 10, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'business-support')),
  ('컴퓨터 수리', 'computer-repair', 11, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'business-support'))
ON CONFLICT (slug) DO NOTHING;

-- 15) 교육·학술
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('출판사', 'publisher', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'education-academic')),
  ('책 출판', 'book-publishing', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'education-academic')),
  ('법정의무교육', 'mandatory-education', 3, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'education-academic'))
ON CONFLICT (slug) DO NOTHING;

-- 16) 라이프
INSERT INTO public.categories (name, slug, sort_order, depth, tier, listing_type, parent_id) VALUES
  ('차량구매', 'vehicle-purchase', 1, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'life')),
  ('투자상품', 'investment-product', 2, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'life')),
  ('결혼정보회사', 'matchmaking', 3, 2, 'standard', 'product',
    (SELECT id FROM public.categories WHERE slug = 'life'))
ON CONFLICT (slug) DO NOTHING;
