# PRD: Review (리뷰) (MVP)

## 1) 목표
- 업체 선택에 필요한 신뢰 신호(별점/후기)를 제공한다.
- “리드 → 계약/진행” 이후 경험을 다시 검색/정렬에 반영할 수 있게 한다.

## 2) 범위
### MVP 포함
- 리뷰 작성(한의사)
- 리뷰 조회(업체 상세)
- 리스트 카드에 별점/후기 수 노출

### MVP 제외(P1+)
- 리뷰 수정/삭제/비공개 전환
- 사진 첨부 리뷰
- 신고/블라인드/제재(운영 고도화)

## 3) 작성 권한(정책)
- doctor만 작성 가능
- “리드 기반 제한”을 기본으로 한다.
  - 최소 조건: 해당 vendor와의 `lead`가 1건 이상 존재
  - 권장 조건: 해당 lead가 `contracted` 또는 `closed` 상태일 때만 작성 가능

## 4) 데이터 모델(초안)
- `reviews`
  - `id`
  - `vendor_id`
  - `doctor_user_id`
  - `lead_id`(optional, 권장)
  - `rating`(1~5)
  - `content`
  - `amount`(optional)
  - `worked_at`(optional)
  - `status`(published/hidden)
  - `created_at`, `updated_at`

파생 데이터(택1):
- `vendors`에 `rating_avg`, `review_count` 컬럼 + 트리거/배치
- 또는 `vendor_review_summary` 뷰/머티리얼라이즈드 뷰

## 5) API(BFF) 초안
- `POST /api/reviews` (작성)
- `GET /api/vendors/:id/reviews` (목록)

필터/정렬(초기):
- MVP: 최신순
- P1+: 평점순/금액/작업일 등 확장

## 6) RLS 정책(요약)
- 공개 read: `published`만
- doctor: 본인 리뷰 select 가능(작성/수정 정책은 범위에 따라)
- admin: 운영 목적으로 전체 조회 가능

## 7) 오픈 이슈(결정 필요)
- 리뷰 “금액/작업일”을 필수로 받을지(후기 품질 vs 마찰)
- 리뷰 작성 시점(lead 상태 기준)
- 노출 정책(익명화/작성자 표시 범위)

## 8) 완료 기준(AC)
- 업체 상세에서 리뷰가 노출되고, 한의사가 리뷰를 작성할 수 있다.

