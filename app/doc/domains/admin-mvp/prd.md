# PRD: Admin MVP

## 1) 목표
- 운영자가 서비스 품질/신뢰를 유지할 수 있도록 최소한의 관리자 기능을 제공한다.
- MVP 단계에서는 “승인/반려 + 카테고리 관리 + 사용자/업체 조회”까지만 확실히 한다.

## 2) 범위
### MVP 포함
- 한의사/업체 인증 승인 큐
- 승인/반려 처리(사유 포함) + 감사 로그
- 사용자/업체 목록 조회(기본 필터/검색)
- 카테고리 CRUD

### MVP 제외(P1+)
- 제재/휴면/퇴출 자동화
- 리드 품질/오남용 감시(비정상 트래픽 탐지)
- 통계 대시보드/리포트

## 3) 어드민 화면(초안)
- 대시보드(간단): pending 건수, 오늘 처리할 일
- 인증 승인 큐: doctor/vendor 탭, 상태 필터, 상세 패널
- 사용자/업체 목록: 기본 검색(이메일/업체명/사업자번호)
- 카테고리 관리: 트리 편집(대/중/소)

## 4) API(BFF) 초안
- `GET /api/admin/verifications`
- `POST /api/admin/verifications/:id/approve`
- `POST /api/admin/verifications/:id/reject`
- `GET /api/admin/users`
- `GET /api/admin/vendors`
- `POST /api/admin/categories`
- `PATCH /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`

## 5) 데이터 모델(초안)
- `audit_logs`
  - `id`, `actor_user_id`, `action`, `target_type`, `target_id`, `metadata`, `created_at`
- `profiles`, `doctor_verifications`, `vendor_verifications`, `categories`, `vendors`

## 6) 권한/보안
- admin role만 접근 가능(페이지/라우트 모두 가드)
- 민감 정보(서류 파일)는 signed URL + 접근 로그(가능하면)로 보호

## 7) 오픈 이슈(결정 필요)
- 승인/반려 사유 템플릿 관리(하드코딩 vs DB 관리)
- admin 역할 부여/회수 프로세스

## 8) 완료 기준(AC)
- 운영자가 인증을 처리할 수 있고, 서비스 운영에 필요한 최소 CRUD가 가능하다.

