-- ============================================
-- Phase G: 메인페이지 업체/상품 이미지 에셋
-- 업체: 기존 portfolio_asset URL → AI 생성 이미지로 교체
-- 상품: product_images 레코드 신규 삽입
-- ============================================

-- ============================================
-- 1. 업체 포트폴리오 에셋 URL 업데이트
--    각 업체의 첫 번째 포트폴리오의 첫 번째 에셋 URL 교체
-- ============================================

-- Helper: 업체별 첫 번째 에셋 ID를 찾아서 URL 업데이트
WITH vendor_first_asset AS (
  SELECT DISTINCT ON (vp.vendor_id)
    vpa.id AS asset_id,
    vp.vendor_id
  FROM public.vendor_portfolios vp
  JOIN public.vendor_portfolio_assets vpa ON vpa.portfolio_id = vp.id
  ORDER BY vp.vendor_id, vp.sort_order ASC, vp.created_at ASC, vpa.sort_order ASC, vpa.created_at ASC
)
UPDATE public.vendor_portfolio_assets vpa
SET url = v.new_url
FROM (VALUES
  ('3c93ee7d-ecfd-4301-8a58-380b10c76878'::uuid, '/images/vendors/thumbnails/vendor-3c93ee7d.webp'),
  ('40b1af6b-7953-461b-93f7-e67fbde845dd'::uuid, '/images/vendors/thumbnails/vendor-40b1af6b.webp'),
  ('d8ce9078-1667-4adb-b495-d8a30c446252'::uuid, '/images/vendors/thumbnails/vendor-d8ce9078.webp'),
  ('839348cf-a71c-464c-ae26-9fbe4b233855'::uuid, '/images/vendors/thumbnails/vendor-839348cf.webp'),
  ('44245505-a3af-4240-b5d0-a73b0cf06da7'::uuid, '/images/vendors/thumbnails/vendor-44245505.webp'),
  ('57186a80-2458-4b05-a2ed-14850d881d1e'::uuid, '/images/vendors/thumbnails/vendor-57186a80.webp'),
  ('79ca470c-b9ac-49bb-8f1a-15f84c950b35'::uuid, '/images/vendors/thumbnails/vendor-79ca470c.webp'),
  ('fedfba7d-1e8d-4db4-abb8-7aa3d00d95e0'::uuid, '/images/vendors/thumbnails/vendor-fedfba7d.webp'),
  ('0b285f9d-14e1-4ffc-85b6-758e54195a18'::uuid, '/images/vendors/thumbnails/vendor-0b285f9d.webp'),
  ('195bc242-8751-49bd-8339-5edc7031f9ac'::uuid, '/images/vendors/thumbnails/vendor-195bc242.webp'),
  ('b8c59044-08c9-403f-9975-e14359fd357a'::uuid, '/images/vendors/thumbnails/vendor-b8c59044.webp'),
  ('78c70ed9-90d1-4a8b-bb0e-7be2908cf221'::uuid, '/images/vendors/thumbnails/vendor-78c70ed9.webp'),
  ('7651c643-474e-4b7a-a10b-8fc492d1595f'::uuid, '/images/vendors/thumbnails/vendor-7651c643.webp'),
  ('55c55a05-6d21-4e2b-8ec6-ab57beebc9a0'::uuid, '/images/vendors/thumbnails/vendor-55c55a05.webp'),
  ('273bf925-b1c3-41e2-b259-e0d534921c3b'::uuid, '/images/vendors/thumbnails/vendor-273bf925.webp'),
  ('72b2f383-fa96-4d17-9c97-7f60d07f45e1'::uuid, '/images/vendors/thumbnails/vendor-72b2f383.webp'),
  ('b83ae1fd-21a6-4afd-a43e-59455c87cdbc'::uuid, '/images/vendors/thumbnails/vendor-b83ae1fd.webp'),
  ('48661c69-15a2-4d66-b95f-bbe000b12005'::uuid, '/images/vendors/thumbnails/vendor-48661c69.webp'),
  ('b5f1e0c3-2713-4e68-be8e-50a3e10f6f6e'::uuid, '/images/vendors/thumbnails/vendor-b5f1e0c3.webp'),
  ('e72f17b5-861d-45da-bb96-9b43f8e042fa'::uuid, '/images/vendors/thumbnails/vendor-e72f17b5.webp'),
  ('2dc78d94-80d6-405a-9728-78e4f5c485f2'::uuid, '/images/vendors/thumbnails/vendor-2dc78d94.webp'),
  ('6f267cb7-40fd-4302-b85e-f8f73df6e44e'::uuid, '/images/vendors/thumbnails/vendor-6f267cb7.webp'),
  ('2b7f05bd-d9b5-4d8f-abbb-624a231d1ae1'::uuid, '/images/vendors/thumbnails/vendor-2b7f05bd.webp'),
  ('bdca6565-0ab6-4ede-a1a2-7844b642615e'::uuid, '/images/vendors/thumbnails/vendor-bdca6565.webp'),
  ('04c6027e-2ef0-4d17-8166-5fde2239263e'::uuid, '/images/vendors/thumbnails/vendor-04c6027e.webp'),
  ('c02161df-64bd-4113-bfd3-36617b823bd8'::uuid, '/images/vendors/thumbnails/vendor-c02161df.webp'),
  ('e2ec5606-152c-4c37-b62b-f658ed22849a'::uuid, '/images/vendors/thumbnails/vendor-e2ec5606.webp'),
  ('b79d4496-a9bf-4434-be1d-1922536f11c5'::uuid, '/images/vendors/thumbnails/vendor-b79d4496.webp'),
  ('914c3c27-f22e-4911-b276-82cd3947c95e'::uuid, '/images/vendors/thumbnails/vendor-914c3c27.webp'),
  ('beb31e5a-6ef7-4f3d-95fc-d13da3a76a0e'::uuid, '/images/vendors/thumbnails/vendor-beb31e5a.webp'),
  ('170fdb0b-2db2-49b5-9d5e-e03086d88b5c'::uuid, '/images/vendors/thumbnails/vendor-170fdb0b.webp'),
  ('199dcbe8-7569-4886-9d02-5ab675e556c8'::uuid, '/images/vendors/thumbnails/vendor-199dcbe8.webp'),
  ('7cdfc3e5-1034-4bb1-b103-38b482a1ed42'::uuid, '/images/vendors/thumbnails/vendor-7cdfc3e5.webp'),
  ('b10129d6-eea7-4023-b5cd-21e4adeeee24'::uuid, '/images/vendors/thumbnails/vendor-b10129d6.webp'),
  ('0262cef5-b8e1-4ad8-866b-f4ce016cd7dc'::uuid, '/images/vendors/thumbnails/vendor-0262cef5.webp'),
  ('dd501d28-7904-416a-9d9d-3642f456417a'::uuid, '/images/vendors/thumbnails/vendor-dd501d28.webp'),
  ('18701b14-487f-4bba-ac05-405a567bb7a5'::uuid, '/images/vendors/thumbnails/vendor-18701b14.webp')
) AS v(vendor_id, new_url)
JOIN vendor_first_asset vfa ON vfa.vendor_id = v.vendor_id
WHERE vpa.id = vfa.asset_id;

-- ============================================
-- 2. 상품 이미지 신규 삽입
-- ============================================

INSERT INTO public.product_images (product_id, url, alt_text, is_primary, sort_order)
VALUES
  -- 의료기기
  ('26179bf9-0379-40fc-a117-e5dd795a57a3', '/images/products/thumbnails/product-26179bf9.webp', '내시경 카메라 시스템', true, 0),
  ('9ffea9b2-2db8-4de3-81ab-31296649dd5f', '/images/products/thumbnails/product-9ffea9b2.webp', '초음파 진단기 HD-3000', true, 0),
  ('ced55766-8378-4255-959f-46c426435aa4', '/images/products/thumbnails/product-ced55766.webp', '심전도 모니터 ECG Pro', true, 0),
  ('e4b5ab5f-ce8a-4471-8c8a-44eb6d0ab36a', '/images/products/thumbnails/product-e4b5ab5f.webp', '의료용 레이저 치료기', true, 0),
  -- 간판
  ('9fe2fe86-7bbc-44e6-8f22-9b1b76af2ec6', '/images/products/thumbnails/product-9fe2fe86.webp', '외부 대형 간판 설치', true, 0),
  ('6eef4445-5057-4a9a-ade3-808d6a22b5a6', '/images/products/thumbnails/product-6eef4445.webp', '야간 조명 간판', true, 0),
  ('a0aa85d0-6395-45b9-a936-2b9fb52bf611', '/images/products/thumbnails/product-a0aa85d0.webp', 'LED 채널사인 제작', true, 0),
  -- 전자차트
  ('04d8b862-59de-4fcb-b7ed-1f08af3efaaa', '/images/products/thumbnails/product-04d8b862.webp', '클라우드 전자차트 기본형', true, 0),
  ('6dbec8e7-8b3a-49fc-84e8-9593c92e21d9', '/images/products/thumbnails/product-6dbec8e7.webp', '보험청구 연동 EMR', true, 0),
  ('6bf77a42-e04e-49ed-90a1-0301d7477eea', '/images/products/thumbnails/product-6bf77a42.webp', '한의원 전용 전자차트', true, 0),
  -- 마케팅
  ('ea3fa8d3-3ad6-4601-9f6c-f08f21bd3257', '/images/products/thumbnails/product-ea3fa8d3.webp', '병원 블로그 마케팅 월정액', true, 0),
  ('694976c6-91f7-471d-86e4-13f1362dd0ab', '/images/products/thumbnails/product-694976c6.webp', 'SNS 마케팅 패키지', true, 0),
  ('8586cd35-d551-4a51-82df-ffb96274758d', '/images/products/thumbnails/product-8586cd35.webp', '리뷰 관리 서비스', true, 0);
