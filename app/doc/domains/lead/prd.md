# PRD: Lead (문의) (MVP)

## 1) 목표
- 한의사 ↔ 업체를 연결하는 핵심 기능: 문의(리드) 생성/관리/상태 업데이트.
- MVP에서는 “문의 생성 → 업체가 확인 → 상태 업데이트/응답”까지 최소 흐름을 완성한다.

## 2) 범위
### MVP 포함
- 문의(리드) 생성 폼
- 역할별 보관함
  - 한의사: 내 문의함
  - 업체: 받은 리드함
- 상태 관리(수동)
- 첨부 파일 업/다운(견적서/사업자등록증/포트폴리오 등)

### MVP 제외(P1+)
- SLA 타이머/자동 리마인드/만료
- 리드별 메시지 스레드(채팅)
- 환불/보상(무응답 자동 환불 등)

## 3) 접근/게이팅(승인 정책)
- doctor: `approved` 상태에서만 리드 생성 가능
- vendor: `approved` 상태의 업체만 공개 노출 및 리드 수신 가능
- API는 아래를 반드시 검증한다.
  - `POST /api/leads`: 요청자가 approved doctor인지
  - 대상 vendor가 승인/활성 상태인지(목록/상세/리드 생성 모두 동일 정책 적용)

## 4) 리드 상태(초안)
UI 표시(한글) 기준:
- `submitted`(신청완료)
- `in_progress`(진행중)
- `quote_pending`(견적 대기)
- `negotiating`(협의 중)
- `contracted`(계약)
- `hold`(보류)
- `canceled`(취소)
- `closed`(종료)

## 5) UX/플로우
한의사:
1. 업체 상세 → “문의하기”
2. 필수 입력 + 파일 첨부 → 제출
3. 내 문의함에서 상태 확인/취소

업체:
1. 받은 리드함에서 신규 리드 확인
2. 상태 업데이트(예: 견적 대기/협의 중/계약/종료)
3. 필요 시 파일 업로드(견적서)

## 6) API(BFF) 초안
- `POST /api/leads` (생성)
- `GET /api/leads` (역할별 목록)
- `GET /api/leads/:id` (상세)
- `PATCH /api/leads/:id/status`
- (후순위) `POST /api/leads/:id/messages`

File:
- `POST /api/files/signed-upload`
- `GET /api/files/signed-download`

## 7) 데이터 모델(초안)
- `leads`
  - `id`, `doctor_user_id`, `vendor_id`
  - `service_name`, `contact_name`, `contact_phone`, `contact_email`
  - `preferred_channel`, `preferred_time`, `content`
  - `status`, `created_at`, `updated_at`
- `lead_status_history`
  - `id`, `lead_id`, `from_status`, `to_status`, `changed_by`, `created_at`
- `lead_attachments`
  - `id`, `lead_id`, `file_id`, `created_by`, `created_at`

## 8) RLS 정책(요약)
- doctor는 본인 lead만 select/update(취소 등 제한된 변경만)
- vendor는 본인 vendor에 걸린 lead만 select/update(상태 업데이트 등)
- admin은 전체 조회 가능(운영)

## 9) 오픈 이슈(결정 필요)
- 업체 응답 “의무” 범위(MVP에서는 상태 변경만으로 충분한지)
- 견적 데이터 모델(파일 첨부로 시작 vs structured quote)
- 연락처 노출 정책(제3자 유출 방지)

## 10) 완료 기준(AC)
- 한의사가 문의를 생성하면 업체 보관함에 노출되고, 양쪽이 상태를 확인/변경할 수 있다.
- 첨부 파일 업/다운이 동작한다.
