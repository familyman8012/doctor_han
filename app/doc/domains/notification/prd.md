# PRD: Notification (이메일 알림)

> Status: Draft | Last updated: 2026-01-17 | Owner: spec-writer
> SSOT: 이 문서 + TODO(구현 후 코드 경로 링크)

## 1) 배경/문제

- 현재 한의사/업체 인증 승인/반려 처리 시 사용자에게 결과를 알려주는 채널이 없음
- 사용자가 결과를 확인하려면 직접 사이트에 재접속하여 상태를 조회해야 함
- 인증 결과를 즉시 전달하지 못해 사용자 경험이 저하되고, 플랫폼 신뢰도가 떨어짐
- 향후 리드 응답/리뷰 알림 등 추가 알림 채널이 필요할 것으로 예상됨

## 2) 목표(Goals)

- G1: 한의사/업체 인증 승인/반려 시 이메일로 결과를 즉시 알림
- G2: 사용자가 알림 수신 여부를 제어할 수 있도록 설정 UI 제공
- G3: 확장 가능한 알림 인프라 구축(이메일 1순위, 향후 카카오/문자/인앱 대비)
- G4: 이메일 발송 상태/실패 이력을 로깅하여 운영 가시성 확보

## 3) 비범위(Non-goals)

- NG1: 카카오 알림톡/문자(SMS)/인앱 알림(P2+)
- NG2: 실시간 알림/푸시 알림(P2+)
- NG3: 이메일 템플릿 디자인 고도화(MVP는 텍스트 기반 템플릿)
- NG4: 이메일 발송 재시도/큐잉 시스템(Resend 기본 retry 사용)
- NG5: 사용자별 알림 히스토리 UI(P2+)

## 4) 사용자/역할

- `doctor`: 한의사 - 면허 인증 결과 이메일 수신
- `vendor`: 업체 - 사업자 인증 결과 이메일 수신
- `admin`: 관리자 - 승인/반려 시 이메일 발송 트리거(자동)
- `all`: 전체 사용자 - 마이페이지에서 알림 설정 on/off

## 5) 사용자 시나리오

### UC-1: 한의사 인증 승인 알림
1. 관리자가 한의사 인증 신청을 승인
2. 시스템이 해당 한의사의 이메일 설정 확인
3. 설정이 on이면 승인 이메일 발송(제목: "[메디허브] 한의사 인증이 승인되었습니다", 내용: 승인 메시지 + 플랫폼 이용 안내)
4. 한의사는 이메일을 받고 로그인하여 전체 기능 사용

### UC-2: 업체 인증 반려 알림
1. 관리자가 업체 인증 신청을 반려(사유 입력)
2. 시스템이 해당 업체의 이메일 설정 확인
3. 설정이 on이면 반려 이메일 발송(제목: "[메디허브] 업체 인증이 반려되었습니다", 내용: 반려 사유 + 재제출 안내)
4. 업체는 이메일을 받고 로그인하여 서류 재제출

### UC-3: 알림 설정 변경
1. 사용자(doctor/vendor)가 마이페이지 진입
2. 알림 설정 섹션에서 "인증 결과 알림" 토글을 off로 변경
3. 이후 인증 결과가 나와도 이메일을 받지 않음

## 6) 요구사항(Functional)

### R1: 이메일 발송 인프라
- Resend를 이메일 발송 서비스로 사용
- 환경변수 `RESEND_API_KEY`, `RESEND_FROM_EMAIL` 필수
- 도메인 인증(DKIM/SPF) 설정 완료 가정(운영 배포 전 필수)
- 이메일 발송은 서버(API Route/서버 모듈)에서만 수행(클라이언트에서 Resend 직접 호출 금지)

### R2: 이메일 템플릿
- 템플릿 종류(MVP):
  - 한의사 인증 승인
  - 한의사 인증 반려
  - 업체 인증 승인
  - 업체 인증 반려
- 템플릿 구성(텍스트 기반):
  - 제목(subject)
  - 본문(body): 인사말 + 결과 내용 + 다음 액션 안내 + 고객센터 연락처
  - 반려 시: 반려 사유 포함

### R3: 알림 설정(DB 스키마)
- 테이블: `notification_settings`
  - `user_id`(uuid, FK to profiles.id)
  - `email_enabled`(boolean, default: true) - 전체 이메일 알림 on/off
  - `verification_result_enabled`(boolean, default: true) - 인증 결과 알림 on/off
  - `lead_enabled`(boolean, default: true) - 리드 관련 알림 on/off (P1+)
  - `marketing_enabled`(boolean, default: false) - 마케팅 알림 on/off
  - `created_at`, `updated_at`
- RLS: 본인 row만 select/update 가능

### R4: 발송 로그(선택적, 운영 가시성)
- 테이블: `notification_deliveries` (선택)
  - `id`(uuid)
  - `user_id`(uuid, FK)
  - `type`(enum: `verification_approved`, `verification_rejected`, ...)
  - `channel`(enum: `email`, `kakao`, `sms`, `in_app`)
  - `provider`(text: `resend`, `kakao`, ...)
  - `recipient`(text: 이메일 주소/전화번호)
  - `subject`(text, nullable)
  - `body_preview`(text, nullable)
  - `provider_response`(jsonb, nullable) - Resend API 응답
  - `sent_at`(timestamp)
  - `failed_at`(timestamp, nullable)
  - `error_message`(text, nullable)
- RLS: admin만 조회 가능 (운영용)

### R5: 승인/반려 API 통합
- `POST /api/admin/verifications/:id/approve` 호출 시:
  - 인증 상태 업데이트
  - 사용자의 `notification_settings` 확인
  - `email_enabled && verification_result_enabled`이면 이메일 발송
  - 발송 성공/실패 여부를 `notification_deliveries`에 기록(선택)
- `POST /api/admin/verifications/:id/reject` 호출 시: 동일, 반려 템플릿 사용

### R6: 알림 설정 API
- `GET /api/notification-settings`
  - 현재 사용자의 알림 설정 조회
  - 인증: doctor/vendor/admin (로그인 필수)
  - 응답: `NotificationSettingsSchema` (Zod)
- `PATCH /api/notification-settings`
  - 알림 설정 변경(부분 업데이트)
  - 입력: `{ email_enabled?, verification_result_enabled?, lead_enabled?, marketing_enabled? }`
  - 응답: 업데이트된 설정
  - 검증: Zod 스키마

### R7: 알림 설정 UI
- 위치: 마이페이지 > 알림 설정 섹션
- UI 구성:
  - "이메일 알림 전체 수신" 토글
  - "인증 결과 알림" 토글
  - "리드 관련 알림" 토글 (P1+)
  - "마케팅 알림" 토글
- 데이터 페칭: React Query(`useQuery`)
- 변경: React Query(`useMutation`) + invalidate

## 7) 정책/제약(Constraints)

- Server Action 금지 - 알림 발송/설정 변경은 `src/app/api/**/route.ts` + React Query로 처리
- 브라우저에서 Supabase(DB) 직접 호출 금지(예외: Auth/Storage)
- React Query 커스텀 훅 래핑 금지 - 컴포넌트에서 직접 `useQuery/useMutation` 사용
- 중앙 에러 핸들러 외 onError 금지 - 백엔드에서 사용자 메시지 내려보내고, 전역 핸들러가 토스트로 표시
- 이메일 발송은 비동기이므로 응답 지연 최소화(Resend API 호출 timeout 고려)
- 실패 시 사용자에게 에러를 노출하지 않고, 로그만 기록(사용자는 "처리 완료" 메시지만 표시)

## 8) Acceptance Criteria (검증 가능한 문장)

- [ ] AC-1: 관리자가 한의사 인증을 승인하면, 해당 한의사의 이메일로 승인 알림이 발송된다.
- [ ] AC-2: 관리자가 업체 인증을 반려하면, 해당 업체의 이메일로 반려 알림(사유 포함)이 발송된다.
- [ ] AC-3: 사용자가 알림 설정에서 "인증 결과 알림"을 off로 설정하면, 인증 결과 이메일이 발송되지 않는다.
- [ ] AC-4: 사용자가 마이페이지에서 알림 설정을 조회하고 변경할 수 있다.
- [ ] AC-5: 이메일 발송 실패 시 에러가 로그에 기록되고, 사용자에게는 에러를 노출하지 않는다.
- [ ] AC-6: 이메일 발송 기록이 `notification_deliveries` 테이블에 저장된다(선택).

## 9) 리스크/오픈 이슈

### 리스크
- R1: Resend API 장애/요청 제한 시 이메일 발송 실패 가능성
  - 완화: Resend 기본 retry 사용, 실패 시 로그 기록 후 운영 대응
- R2: 이메일 발송 지연으로 인한 API 응답 지연
  - 완화: Resend API 호출 timeout 설정(예: 5초), 실패 시 로그만 기록하고 승인/반려 처리는 완료
- R3: 이메일 스팸 필터링 가능성
  - 완화: 도메인 인증(DKIM/SPF) 완료, 발신자 주소 고정, 사용자에게 수신함 확인 안내

### 오픈 이슈(결정 필요)
- Q1: `notification_deliveries` 테이블 구현 여부(MVP 필수 vs 선택)
  - 제안: 운영 가시성을 위해 MVP에 포함 권장
- Q2: 이메일 발송 실패 시 재시도 정책(즉시 재시도 vs 수동 재발송)
  - 제안: MVP는 재시도 없음, 운영자가 로그 확인 후 수동 재발송(Admin UI는 P1+)
- Q3: 알림 설정 기본값(가입 시 자동 생성 vs 최초 조회 시 생성)
  - 제안: 최초 조회 시 자동 생성(upsert 패턴)
- Q4: 이메일 템플릿 관리 방식(코드 내장 vs DB 저장)
  - 제안: MVP는 코드 내장(간단), P1+에서 DB 저장 검토
- Q5: 마케팅 알림 범위/시점(가입 시 동의 vs 별도 동의)
  - 제안: 가입 시 별도 동의 받지 않고, 설정에서만 on/off(법적 검토 필요)

## 10) 기술 결정 사항(TODO)

- TODO: 이메일 템플릿 파일/함수 위치 결정(예: `src/server/notification/templates/`)
- TODO: Resend 클라이언트 초기화 위치 결정(예: `src/server/notification/resend.ts`)
- TODO: 이메일 발송 유틸 함수 설계(예: `sendVerificationApprovedEmail(userId, data)`)
- TODO: `notification_settings` 초기 마이그레이션 파일 작성
- TODO: `notification_deliveries` 초기 마이그레이션 파일 작성(Q1 결정 후)
- TODO: Zod 스키마 작성(`NotificationSettingsSchema`, `UpdateNotificationSettingsSchema`)
