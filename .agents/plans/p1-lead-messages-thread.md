# Feature: Lead Message Thread (P1)

## Feature Description

리드(문의) 단위로 doctor ↔ vendor가 메시지를 주고받을 수 있는 스레드(채팅에 가까운)를 제공한다. MVP에서는 “상태 업데이트”까지만 존재하므로, 협의 비용을 줄이기 위해 P1에서 메시징을 도입한다.

## User Story

As a doctor/vendor  
I want to discuss lead details inside the platform  
So that the negotiation process is faster and traceable

## Problem Statement

현재 리드는 상태만 변경 가능해서, 실제 협의는 외부 채널(전화/카톡/메일)로 흩어진다. 이로 인해 히스토리 관리가 어렵고 운영/분쟁 대응이 힘들다.

## Solution Statement

`lead_messages` 테이블을 추가하고, 참여자(doctor_user_id, vendor owner)가 조회/작성 가능하도록 RLS를 적용한다.  
BFF API로 목록/작성/읽음 처리 등을 제공하고, UI에서 스레드를 렌더링한다.

## Feature Metadata

**Feature Type**: New Capability  
**Estimated Complexity**: High  
**Primary Systems Affected**: `app/src/app/api`, `app/src/server/lead`, `app/src/app/(main)`  
**Dependencies**: (optional) Realtime/WebSocket은 P2+로 이관 가능

---

## CONTEXT REFERENCES (MUST READ)

- `app/doc/domains/lead/prd.md`
- `app/doc/todo.md` (리드 메시지 스레드 TODO)
- `.claude/reference/api-routes-index.md`

---

## New Files to Create (proposal)

- DB: `app/supabase/migrations/*_lead_messages.sql`
- API:
  - `app/src/app/api/leads/[id]/messages/route.ts` (GET/POST)
- Server:
  - `app/src/server/lead/messages.ts` (service)
- UI:
  - `app/src/app/(main)/partner/leads/[id]/page.tsx` (또는 기존 상세 페이지에 섹션 추가)
  - `app/src/app/(main)/mypage/leads/[id]/page.tsx`

---

## IMPLEMENTATION PLAN

### Phase 1: DB & RLS
- `lead_messages`:
  - `id`, `lead_id`, `sender_user_id`, `message`, `created_at`
- RLS:
  - lead의 doctor_user_id 또는 vendor owner(=vendor.owner_user_id)만 select/insert 가능
- 인덱스: `(lead_id, created_at)`

### Phase 2: API (BFF)
- `GET /api/leads/:id/messages`:
  - 참여자 권한 체크 + 페이징(최소 limit/offset)
- `POST /api/leads/:id/messages`:
  - 입력 검증(Zod)
  - sender는 현재 사용자로 강제

### Phase 3: UI
- 메시지 리스트(스크롤/페이지네이션)
- 입력 폼(react-hook-form) + 전송 mutation
- 에러 토스트 중앙화 유지

### Phase 4: Validation
- `cd app && pnpm lint`
- `cd app && pnpm build`
- (DB changed) `cd app && pnpm db:gen -- --local`

---

## STEP-BY-STEP TASKS

1) 마이그레이션 작성 + RLS 설계
2) 타입 갱신
3) API route + server service 구현
4) UI 상세 페이지에 스레드 렌더링/입력 추가
5) 린트/빌드 검증

