# Domains PRD

이 폴더는 도메인별 PRD(요구사항/흐름/데이터 모델/API)를 모아둔다.

## MVP PRD 목록
- `auth/prd.md`: 가입/로그인/세션/역할(Role) 기본
- `profile-verification/prd.md`: 한의사/업체 인증 + 관리자 승인/반려
- `category-search/prd.md`: 카테고리 트리 + 검색/필터/정렬
- `vendor/prd.md`: 업체 프로필/포트폴리오/가격/배지 + 상세 페이지
- `lead/prd.md`: 문의(리드) 생성/상태/첨부 + 역할별 보관함
- `review/prd.md`: 리뷰(별점/후기) 작성/조회 + 리스트 노출
- `admin-mvp/prd.md`: 관리자 MVP(승인 큐/사용자·업체 관리/카테고리 CRUD)

## 공통 원칙(필수)
- Frontend에서 Supabase(DB) 직접 호출 금지: 모든 데이터 통신은 `src/app/api/**/route.ts`(BFF)로 통일.
- 예외: Auth(`supabase.auth.*`) 허용. Storage는 서버 Signed URL 발급 후 클라이언트 업/다운로드만 허용.
- 스키마 변경은 Supabase CLI 마이그레이션(`app/supabase/migrations`)으로 관리.
