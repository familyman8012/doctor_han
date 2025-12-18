# PRD: Vendor (MVP)

## 1) 목표
- 업체 정보를 표준화해서 노출하고(가격/포트폴리오/AS/응답 속도 등), 한의사가 신뢰 있게 선택할 수 있게 한다.
- 업체는 “파트너 센터”에서 프로필/포트폴리오를 관리한다.

## 2) 범위
### MVP 포함
- 업체 프로필(기본 정보/소개/연락 채널/지역/가격대)
- 카테고리 연결(제공 서비스)
- 포트폴리오(이미지/링크)
- 업체 리스트 카드 + 업체 상세 페이지
- 리뷰/평점 노출(리스트 카드: 별점/후기 수, 상세: 리뷰 리스트)

### MVP 제외(P1+)
- 배지 조건 엔진(“빠른응답/세금계산서/프라임” 등)
- 고급 SEO 템플릿/OG 자동 생성

## 3) UX/플로우
- 한의사: 리스트 → 상세 → 문의하기
- 업체: 파트너 센터 → 업체 프로필 편집 → 포트폴리오 관리

## 4) API(BFF) 초안
Public:
- `GET /api/vendors`
- `GET /api/vendors/:id`

Vendor self:
- `GET /api/vendors/me`
- `POST /api/vendors/me`
- `PATCH /api/vendors/me`
- `POST /api/vendors/me/portfolio`
- `DELETE /api/vendors/me/portfolio/:id`

File:
- `POST /api/files/signed-upload` (포트폴리오 업로드)

## 5) 데이터 모델(초안)
- `vendors`
  - `id`, `owner_user_id`, `name`, `summary`, `description`
  - `region_*`, `price_min`, `price_max`
  - `status`(active/inactive/banned)
- `vendor_categories`
- `vendor_portfolios`
  - `id`, `vendor_id`, `title`, `description`, `sort_order`
- `vendor_portfolio_assets`
  - `id`, `portfolio_id`, `file_id` or `url`

## 6) RLS 정책(요약)
- 공개 read(승인 + 활성 업체만)
- 업체 owner는 본인 업체 row update 가능

## 7) 오픈 이슈(결정 필요)
- 업체 “가격” 데이터 모델(범위 vs 옵션/패키지)
- 상세 페이지 섹션(FAQ/AS 정책 등) MVP 최소치
- 리뷰 작성 권한(리드 기반 제한 여부) 및 노출 정책

## 8) 완료 기준(AC)
- 업체 리스트/상세가 노출되고, 업체가 본인 프로필/포트폴리오를 관리할 수 있다.
