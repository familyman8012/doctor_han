# PRD: Profile & Verification (MVP)

## 1) 목표
- 한의사/업체가 신뢰 기반으로 거래할 수 있도록 **신원/자격 인증**을 구축한다.
- 관리자가 인증 신청을 승인/반려하고 이력을 남긴다.

## 2) 범위
### MVP 포함
- 한의사 인증(면허번호/면허증 업로드) 제출
- 업체 인증(사업자등록증 업로드) 제출
- 관리자 승인/반려(사유 포함)
- 사용자 화면에서 인증 상태 표시

### MVP 제외(P1+)
- PASS/통신사 본인인증
- 카카오 알림톡/이메일 등 멀티채널 알림(최소 인앱부터)
- 제재/휴면/퇴출 자동화(운영 고도화)

## 3) 핵심 개념
인증은 “계정(auth)”과 별개로, 운영이 개입하는 “검수 대상 데이터”다.

## 4) 상태 정의
공통:
- `pending`: 제출됨, 검수 대기
- `approved`: 승인
- `rejected`: 반려(사유 기록)

## 5) 승인 전 기능 제한(정책)
- doctor: 업체 탐색/찜 가능, **리드 생성/리뷰 작성 불가**
- vendor: 파트너 센터에서 프로필/서류 제출 가능, **공개 노출/리드 수신 불가**

## 6) UX/플로우
### 6-1. 한의사
1. 회원가입 → 프로필 입력
2. 면허번호/성명/생년월일/병원명 + 면허증 파일 업로드
3. 상태: pending → (승인/반려)

### 6-2. 업체
1. 회원가입 → 업체 기본정보/담당자 입력
2. 사업자등록증 파일 업로드 + 제공 카테고리/지역/가격대 입력
3. 상태: pending → (승인/반려)

### 6-3. 관리자
1. 승인 큐 목록 조회
2. 상세 확인(파일/메타)
3. 승인 또는 반려(사유 템플릿/자유 입력)
4. 감사 로그 기록

## 7) API(BFF) 초안
Doctor:
- `POST /api/doctor/verification` (제출/재제출)
- `GET /api/doctor/verification` (상태 조회)

Vendor:
- `POST /api/vendor/verification`
- `GET /api/vendor/verification`

Admin:
- `GET /api/admin/verifications?type=doctor|vendor&status=pending`
- `POST /api/admin/verifications/:id/approve`
- `POST /api/admin/verifications/:id/reject`

File:
- `POST /api/files/signed-upload` (면허증/사업자등록증 업로드용)

## 8) 데이터 모델(초안)
- `doctor_verifications`
  - `id`, `user_id`, `license_no`, `name`, `birth_date`, `clinic_name`
  - `license_file_id`
  - `status`, `reviewed_by`, `reviewed_at`, `reject_reason`
- `vendor_verifications`
  - `id`, `user_id`, `business_no`, `company_name`, `contact_name`, `contact_phone`, `contact_email`
  - `business_license_file_id`
  - `status`, `reviewed_by`, `reviewed_at`, `reject_reason`
- `audit_logs` (승인/반려 기록)
- `files` (Storage 오브젝트 메타)

## 9) RLS 정책(요약)
- 사용자 본인은 본인 인증 row select 가능, 제출/수정 가능(단, 승인 후 수정 정책 결정 필요)
- 파일 접근은 signed URL 기반이며, row 접근은 권한 체크로 보호
- admin은 승인 큐 접근 가능

## 10) 오픈 이슈(결정 필요)
- 승인 후 정보 수정 허용 범위(재검수 필요 여부)
- 반려 사유 템플릿 관리 방식

## 11) 완료 기준(AC)
- 한의사/업체가 인증 정보를 제출할 수 있고, 관리자 승인/반려가 가능
- 사용자는 본인의 인증 상태와 사유(반려 시)를 확인 가능
