# Feature: Resend Email Notifications (P1)

## Feature Description

인증(승인/반려), 리드 상태 변경 등 핵심 이벤트에 대해 이메일 알림을 발송하고, 사용자가 알림 설정을 관리할 수 있게 한다.

## User Story

As a doctor/vendor  
I want to receive email notifications for important events  
So that I don't miss approval results or lead updates

## Problem Statement

현재는 인증 결과/리드 변경을 사용자가 직접 들어와서 확인해야 한다. 이는 전환율/응답률을 떨어뜨리고, 운영 부담을 증가시킨다.

## Solution Statement

서버(BFF)에서만 Resend를 호출하여 이메일 알림을 발송한다.  
사용자별 알림 설정(`notification_settings`)을 두고, 승인/반려/리드 이벤트 발생 시 설정에 따라 발송한다.

## Feature Metadata

**Feature Type**: New Capability  
**Estimated Complexity**: Medium  
**Primary Systems Affected**: `app/src/app/api`, `app/src/server`, `app/supabase/migrations`  
**Dependencies**: Resend (email)

---

## CONTEXT REFERENCES (MUST READ)

### Product / Policy
- `app/doc/todo.md` (5-3 알림 섹션)
- `app/doc/domains/profile-verification/prd.md`
- `app/doc/domains/admin-mvp/prd.md`

### Codebase Files (starting points)
- `app/src/app/api/admin/verifications/[id]/approve/route.ts`
- `app/src/app/api/admin/verifications/[id]/reject/route.ts`
- `app/src/server/api/with-api.ts`
- `app/src/server/api/response.ts`
- `app/src/server/api/errors.ts`

---

## New Files to Create (proposal)

- `app/src/server/notification/resend.ts` (Resend client wrapper)
- `app/src/server/notification/templates/*.ts` (메일 템플릿)
- `app/src/server/notification/service.ts` (발송 로직 + 설정 체크)
- `app/src/app/api/notification-settings/route.ts` (GET/PATCH)
- `app/supabase/migrations/*_notification_settings.sql`

---

## IMPLEMENTATION PLAN

### Phase 1: DB
- `notification_settings` 테이블 추가(최소: user_id, email_on, types jsonb)
- (선택) `notification_deliveries` 테이블(발송 로그)
- RLS: 본인 row만 접근 가능

### Phase 2: Server Notification Service
- Resend API 호출 모듈 구현(서버 전용)
- 이벤트별 템플릿(승인/반려: doctor/vendor)
- 실패 시 로깅(민감 정보 제외)

### Phase 3: Integrate Into Admin Approval Flow
- approve/reject API에서:
  - DB 업데이트 성공 후 이메일 발송 트리거
  - 발송 실패는 “업무 실패”로 만들지 말고 운영 로그로 남김(정책 결정)

### Phase 4: Settings API + UI
- `GET /api/notification-settings`, `PATCH /api/notification-settings`
- 마이페이지에 토글 UI 추가(최소: 인증 결과, 리드 관련, 마케팅)

### Phase 5: Validation
- `cd app && pnpm lint`
- `cd app && pnpm build`
- (DB changed) `cd app && pnpm db:gen -- --local`

---

## STEP-BY-STEP TASKS

1) DB 마이그레이션: `notification_settings` 추가 + RLS
2) `pnpm db:gen -- --local`로 타입 갱신
3) Resend 모듈/서비스 구현(환경변수: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`)
4) 승인/반려 API에 발송 로직 연결
5) 알림 설정 API + UI 추가
6) 린트/빌드로 검증

