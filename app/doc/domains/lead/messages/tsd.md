# 리드 Q&A 스레드 TSD

> 기반 문서: `app/doc/domains/lead/messages/prd.md:1`
> 참고 코드: `app/src/server/lead/repository.ts:1`, `app/src/lib/schema/lead.ts:1`, `app/src/server/notification/service.ts:1`

## 0. 변경 요약 (파일 단위)

| 파일 | 변경 | 변경 내용 요약 |
| --- | --- | --- |
| `app/supabase/migrations/XXX_lead_messages.ts` | CREATE | lead_messages, lead_message_attachments 테이블 + RLS + 인덱스 |
| `app/src/lib/schema/lead.ts` | UPDATE | 메시지 관련 Zod 스키마 추가 |
| `app/src/app/api/leads/[id]/messages/route.ts` | CREATE | 메시지 목록 조회(GET), 메시지 발송(POST) |
| `app/src/app/api/leads/[id]/messages/read/route.ts` | CREATE | 읽음 표시(PATCH) |
| `app/src/server/lead/message-repository.ts` | CREATE | 메시지 DB 조회/생성 |
| `app/src/server/lead/message-service.ts` | CREATE | 메시지 비즈니스 로직 |
| `app/src/server/lead/message-mapper.ts` | CREATE | 메시지 Row -> DTO 변환 |
| `app/src/api-client/leads.ts` | UPDATE | 메시지 API 클라이언트 추가 |
| `app/src/app/(main)/mypage/leads/[id]/page.tsx` | UPDATE | 탭 구조 + 대화 탭 추가 |
| `app/src/app/(main)/mypage/leads/[id]/components/MessagesTab.tsx` | CREATE | 메시지 탭 컴포넌트 |
| `app/src/app/(main)/mypage/leads/[id]/components/MessageList.tsx` | CREATE | 메시지 목록 컴포넌트 |
| `app/src/app/(main)/mypage/leads/[id]/components/MessageBubble.tsx` | CREATE | 개별 메시지 컴포넌트 |
| `app/src/app/(main)/mypage/leads/[id]/components/MessageInput.tsx` | CREATE | 메시지 입력 컴포넌트 |
| `app/src/app/(main)/partner/leads/[id]/page.tsx` | UPDATE | 탭 구조 + 대화 탭 추가 |
| `app/src/app/(main)/partner/leads/[id]/components/MessagesTab.tsx` | CREATE | 메시지 탭 컴포넌트 (업체용) |

## 0.1 영향 범위 매트릭스 (Impact Matrix)

| 레이어 | 변경 여부 | 관련 파일(대표) | 근거 |
| --- | --- | --- | --- |
| UI (Pages/Components) | UPDATE | `app/src/app/(main)/mypage/leads/[id]/page.tsx:113`, `app/src/app/(main)/partner/leads/[id]/page.tsx:118` | 기존 페이지에 탭 구조 추가, 대화 탭 신규 |
| API Route | CREATE | `app/src/app/api/leads/[id]/messages/route.ts` | 신규 API 3개 필요 (PRD 5.6) |
| API Client | UPDATE | `app/src/api-client/leads.ts:10` | 메시지 API 메서드 추가 필요 |
| Schema (Zod) | UPDATE | `app/src/lib/schema/lead.ts:1` | 메시지 스키마 추가 필요 |
| Service | CREATE | `app/src/server/lead/message-service.ts` | 메시지 비즈니스 로직 신규 |
| Repo/DB (+ Migration) | CREATE | `app/supabase/migrations/`, `app/src/server/lead/message-repository.ts` | lead_messages, lead_message_attachments 테이블 신규 |
| Auth/Security/RLS | CREATE | `app/supabase/migrations/XXX_lead_messages.ts` | 메시지 RLS 정책 신규 (PRD 5.7) |
| Integrations/Cache | UPDATE | `app/src/server/notification/service.ts:262` | 메시지 알림 발송 함수 추가 |
| Config/Middleware/Env | NO CHANGE | - | 기존 설정으로 충분 |
| Tests | CREATE | `app/src/tests/integration/lead-messages.test.ts` | 통합 테스트 작성 |

## 0.2 추가로 읽은 파일 (Read Set)

| 파일 | 라인 | 참조 이유 |
| --- | --- | --- |
| `app/src/lib/schema/common.ts` | 1-13 | zUuid, zNonEmptyString, zPaginationQuery 패턴 참조 |
| `app/src/server/lead/mapper.ts` | 1-65 | 기존 Lead mapper 패턴 참조 |
| `app/src/components/ui/Tab/Tab.tsx` | 1-79 | 탭 컴포넌트 사용법 참조 |
| `app/src/server/notification/service.ts` | 262-365 | sendVerificationResult 패턴 참조하여 메시지 알림 구현 |
| `app/src/app/(main)/mypage/leads/[id]/page.tsx` | 44-224 | 기존 상세 페이지 구조 파악 |

## 0.3 Step-by-Step Implementation Tasks

| ID | Layer | File | Action | Description | Depends On |
|----|-------|------|--------|-------------|------------|
| SCHEMA-1 | Schema | `app/src/lib/schema/lead.ts` | UPDATE | 메시지 관련 Zod 스키마 추가 | - |
| SCHEMA-2 | Migration | `app/supabase/migrations/XXX_lead_messages.ts` | CREATE | lead_messages, lead_message_attachments 테이블 + RLS + 인덱스 | - |
| BACKEND-1 | Repository | `app/src/server/lead/message-repository.ts` | CREATE | 메시지 DB CRUD 함수 | SCHEMA-1, SCHEMA-2 |
| BACKEND-2 | Mapper | `app/src/server/lead/message-mapper.ts` | CREATE | Row -> DTO 변환 함수 | SCHEMA-1 |
| BACKEND-3 | Service | `app/src/server/lead/message-service.ts` | CREATE | 메시지 비즈니스 로직 + 알림 발송 | BACKEND-1, BACKEND-2 |
| BACKEND-4 | API | `app/src/app/api/leads/[id]/messages/route.ts` | CREATE | GET(목록), POST(발송) 엔드포인트 | BACKEND-3 |
| BACKEND-5 | API | `app/src/app/api/leads/[id]/messages/read/route.ts` | CREATE | PATCH(읽음표시) 엔드포인트 | BACKEND-3 |
| FRONTEND-1 | API-Client | `app/src/api-client/leads.ts` | UPDATE | 메시지 API 클라이언트 메서드 추가 | BACKEND-4, BACKEND-5 |
| FRONTEND-2 | Component | `app/src/app/(main)/mypage/leads/[id]/components/MessageBubble.tsx` | CREATE | 개별 메시지 버블 컴포넌트 | SCHEMA-1 |
| FRONTEND-3 | Component | `app/src/app/(main)/mypage/leads/[id]/components/MessageList.tsx` | CREATE | 메시지 목록 컴포넌트 | FRONTEND-2 |
| FRONTEND-4 | Component | `app/src/app/(main)/mypage/leads/[id]/components/MessageInput.tsx` | CREATE | 메시지 입력 + 첨부파일 컴포넌트 | SCHEMA-1 |
| FRONTEND-5 | Component | `app/src/app/(main)/mypage/leads/[id]/components/MessagesTab.tsx` | CREATE | 메시지 탭 컨테이너 (의사용) | FRONTEND-1, FRONTEND-3, FRONTEND-4 |
| FRONTEND-6 | Page | `app/src/app/(main)/mypage/leads/[id]/page.tsx` | UPDATE | 탭 구조 추가 + 대화 탭 연결 | FRONTEND-5 |
| FRONTEND-7 | Component | `app/src/app/(main)/partner/leads/[id]/components/MessagesTab.tsx` | CREATE | 메시지 탭 컨테이너 (업체용) | FRONTEND-1, FRONTEND-3, FRONTEND-4 |
| FRONTEND-8 | Page | `app/src/app/(main)/partner/leads/[id]/page.tsx` | UPDATE | 탭 구조 추가 + 대화 탭 연결 | FRONTEND-7 |
| TEST-1 | Test | `app/src/tests/integration/lead-messages.test.ts` | CREATE | 메시지 API 통합 테스트 | BACKEND-4, BACKEND-5 |

## 0.4 Parallelization Strategy

### 실행 모드

**Conservative (기본)** 선택 - API 스펙 확정 전까지 Backend 완료 후 Frontend 시작

### 실행 단계

| Phase | Tasks | Executor | Mode |
|-------|-------|----------|------|
| 1 | SCHEMA-1, SCHEMA-2 | schema-implementer | Both |
| 2 | BACKEND-1, BACKEND-2, BACKEND-3, BACKEND-4, BACKEND-5 | backend-implementer | Both |
| 3 | FRONTEND-1, FRONTEND-2, FRONTEND-3, FRONTEND-4, FRONTEND-5, FRONTEND-6, FRONTEND-7, FRONTEND-8 | frontend-implementer | Conservative: Phase 2 완료 후 |
| 4 | TEST-1 | test-implementer | Phase 2 완료 후 |
| 5 | Integration | main | Both |

### 파일 소유권 (충돌 방지)

| Pattern | Owner | Others |
|---------|-------|--------|
| `app/src/lib/schema/lead.ts` | schema-implementer | READ-ONLY |
| `app/supabase/migrations/**` | schema-implementer | READ-ONLY |
| `app/src/server/lead/message-*.ts` | backend-implementer | READ-ONLY |
| `app/src/app/api/leads/[id]/messages/**` | backend-implementer | READ-ONLY |
| `app/src/app/(main)/mypage/leads/[id]/**` | frontend-implementer | READ-ONLY |
| `app/src/app/(main)/partner/leads/[id]/**` | frontend-implementer | READ-ONLY |
| `app/src/api-client/leads.ts` | frontend-implementer | READ-ONLY |
| `app/src/tests/**` | test-implementer | READ-ONLY |

## 1. 범위

- **포함**
  - lead_messages, lead_message_attachments 테이블 생성
  - 메시지 목록 조회, 발송, 읽음 표시 API
  - 메시지 알림 발송 (Email + 카카오)
  - 의사/업체 리드 상세 페이지에 대화 탭 추가
  - 메시지 UI (목록, 입력, 첨부파일)
- **제외**
  - 실시간 웹소켓 (폴링 기반)
  - 메시지 수정/삭제
  - 관리자 메시지 작성 (열람만 가능)
  - 리드 상태 자동화

## 2. 시스템 개요

### 2.1 아키텍처 / 경계

```
┌───────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│    UI Pages       │ --> │     API Routes       │ --> │    Service      │
│ /mypage/leads/[id]│     │ /api/leads/[id]/     │     │ message-service │
│ /partner/leads/[id]│    │   messages/          │     │                 │
└───────────────────┘     └──────────────────────┘     └────────┬────────┘
                                                                │
                          ┌──────────────────────┐              │
                          │   Notification       │<─────────────┤
                          │   Service            │              │
                          └──────────────────────┘              │
                                                                ▼
                          ┌──────────────────────┐     ┌─────────────────┐
                          │   message-repository │ --> │   Supabase      │
                          │   message-mapper     │     │   (RLS)         │
                          └──────────────────────┘     └─────────────────┘
```

- UI: `app/src/app/(main)/mypage/leads/[id]/`, `app/src/app/(main)/partner/leads/[id]/`
- API: `app/src/app/api/leads/[id]/messages/`
- API Client: `app/src/api-client/leads.ts`
- Schema (Zod): `app/src/lib/schema/lead.ts`
- Service: `app/src/server/lead/message-service.ts`
- Repository: `app/src/server/lead/message-repository.ts`
- Mapper: `app/src/server/lead/message-mapper.ts`
- Notification: `app/src/server/notification/service.ts`
- DB Migration: `app/supabase/migrations/XXX_lead_messages.ts`

### 2.2 데이터 흐름

**메시지 발송:**
1. UI -> API POST `/api/leads/[id]/messages`
2. API -> Service `sendMessage()`
3. Service -> Repository `insertMessage()` (DB 저장)
4. Service -> Notification `sendLeadMessageNotification()` (알림 발송)
5. Service -> Mapper -> Response

**메시지 조회:**
1. UI -> API GET `/api/leads/[id]/messages`
2. API -> Service `getMessages()`
3. Service -> Repository `fetchMessages()`
4. Service -> Mapper -> Response

**읽음 표시:**
1. UI -> API PATCH `/api/leads/[id]/messages/read`
2. API -> Service `markAsRead()`
3. Service -> Repository `updateMessagesReadAt()`

## 3. UI/UX 설계

### 3.1 해결할 문제 (PRD 기반)

- **핵심 문제**: 의사-업체 간 커뮤니케이션이 플랫폼 외부에 분산되어 추적 불가
- **핵심 니즈**: 리드 상세 페이지에서 바로 메시지 송수신, 읽음 상태 확인, 첨부파일 공유
- **성공 기준**: 플랫폼 내 대화 완결율 향상, 분쟁 시 근거 자료 확보 가능

### 3.2 정보 구조 (Information Architecture)

**핵심 정보 (반드시 표시):**
- 발신자 구분 (의사/업체)
- 메시지 내용
- 발송 시간
- 읽음 상태 (읽음 시간 또는 "읽지 않음")
- 첨부파일 목록

**부가 정보 (확장 시 표시):**
- 첨부파일 상세 (파일명, 크기, 다운로드)

**정보 그룹핑:**
- 시간순 정렬 (오래된 메시지 -> 최신 메시지)
- 발신자 기준 좌우 배치 (내가 보낸 메시지: 우측, 상대방: 좌측)

### 3.3 흐름(Flow) 설계

**메인 플로우 (메시지 발송):**
```
[리드 상세 페이지] -> [대화 탭 클릭] -> [메시지 목록 로드] -> [메시지 입력] -> [첨부파일 추가(선택)] -> [전송 버튼] -> [메시지 목록 갱신]
```

**메인 플로우 (메시지 확인):**
```
[알림 수신] -> [리드 상세 페이지 이동] -> [대화 탭] -> [새 메시지 확인] -> [읽음 표시 자동 업데이트]
```

**예외/이탈 루트:**
- 메시지 발송 실패 -> 토스트 에러 메시지 + 재시도 안내
- 첨부파일 업로드 실패 -> 해당 파일 업로드 실패 표시
- 네트워크 오류 -> 재시도 버튼 표시

**단계 최소화:**
- 메시지 발송까지 클릭 수: 3회 (탭 -> 입력 -> 전송)

### 3.4 레이아웃 및 시각적 위계

**레이아웃 선택 + 근거:**
- 목록 형태: **채팅 스타일 리스트** (메시지 버블)
- 근거: 1:1 대화 형식으로 발신자/수신자 구분이 명확해야 하며, 시간순 스크롤이 자연스러움

**시각적 위계 (중요도순):**
1. **Primary**: 메시지 입력 영역 + 전송 버튼
2. **Secondary**: 첨부파일 추가 버튼
3. **Information**: 메시지 목록

**영역 구분 (ASCII 레이아웃):**
```
┌─────────────────────────────────────────────────────────────┐
│  [탭: 상세정보 | 대화 | 상태이력]                              │
├─────────────────────────────────────────────────────────────┤
│  [메시지 목록 영역] - 스크롤                                   │
│  ┌─────────────────────┐                                    │
│  │ 상대방 메시지 (좌측)  │                                    │
│  └─────────────────────┘                                    │
│                              ┌─────────────────────┐        │
│                              │ 내 메시지 (우측)     │        │
│                              └─────────────────────┘        │
│  ...                                                        │
├─────────────────────────────────────────────────────────────┤
│  [첨부파일 미리보기 영역] - 업로드된 파일 표시                  │
├─────────────────────────────────────────────────────────────┤
│  [메시지 입력 영역]                                          │
│  ┌───────────────────────────────────────────┬────────────┐ │
│  │ 메시지 입력...                             │  [+]  [전송]│ │
│  └───────────────────────────────────────────┴────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 컴포넌트 구조

**파일 구조 (의사 페이지):**
```
app/src/app/(main)/mypage/leads/[id]/
├── page.tsx (탭 구조 + 상태 관리)
├── components/
│   ├── MessagesTab.tsx (대화 탭 컨테이너)
│   ├── MessageList.tsx (메시지 목록)
│   ├── MessageBubble.tsx (개별 메시지)
│   ├── MessageInput.tsx (입력 + 첨부)
│   ├── MessageAttachments.tsx (첨부파일 목록)
│   ├── StatusHistory.tsx (기존)
│   └── Attachments.tsx (기존)
└── hooks/
    └── useMessageRead.ts (읽음 표시 훅)
```

**파일 구조 (업체 페이지):**
```
app/src/app/(main)/partner/leads/[id]/
├── page.tsx (탭 구조 + 상태 관리)
├── components/
│   ├── MessagesTab.tsx (대화 탭 컨테이너)
│   ├── StatusChangeModal.tsx (기존)
│   ├── StatusHistory.tsx (기존)
│   └── Attachments.tsx (기존)
```

> 공통 컴포넌트 (MessageList, MessageBubble, MessageInput, MessageAttachments)는 의사 페이지에 생성하고 업체 페이지에서 import하여 재사용

**분리 기준:**
- page.tsx: 200줄 이하 (탭 상태 + 레이아웃만)
- MessagesTab.tsx: 메시지 조회/발송 로직 + 읽음 표시
- MessageList.tsx: 메시지 목록 렌더링
- MessageBubble.tsx: 단일 메시지 UI
- MessageInput.tsx: 입력 + 첨부파일 업로드

### 3.6 상태 및 피드백

| 상태 | UI 표현 |
|------|---------|
| 초기 (메시지 없음) | "아직 대화가 없습니다. 첫 메시지를 보내보세요!" |
| 로딩 | 스켈레톤 (메시지 목록) |
| 발송 중 | 전송 버튼 스피너 + 비활성화 |
| 발송 성공 | 메시지 목록에 새 메시지 추가 + 입력창 초기화 |
| 발송 실패 | 토스트 에러 메시지 "메시지 전송에 실패했습니다" |
| 새 메시지 수신 | 목록 갱신 (폴링 또는 refetch) |
| 읽음 표시 | 메시지 하단에 "읽음 HH:mm" 또는 체크 아이콘 |

**UX 편의 기능:**
- 엔터키 전송: Shift+Enter는 줄바꿈, Enter는 전송
- 스크롤 위치: 새 메시지 발송/수신 시 하단으로 자동 스크롤
- 읽음 표시 자동: 대화 탭 진입 시 안 읽은 메시지 자동 읽음 처리

### 3.7 상태 관리

- **서버 상태**: React Query
  - 쿼리 키: `["lead-messages", leadId]`
  - mutation: `sendMessage`, `markAsRead`
  - staleTime: 30초 (폴링 대신 stale 시 refetch)
- **클라이언트 상태**: useState (탭 인덱스, 입력 텍스트, 첨부파일 목록)
- **URL 상태**: 사용하지 않음 (탭 상태는 클라이언트 상태로 관리)

### 3.8 API Client

- 파일: `app/src/api-client/leads.ts`
- 메서드:
  - `getMessages(leadId, query): Promise<LeadMessagesListResponse>` - 메시지 목록 조회
  - `sendMessage(leadId, body): Promise<LeadMessageResponse>` - 메시지 발송
  - `markMessagesAsRead(leadId, body): Promise<void>` - 읽음 표시

## 4. 데이터 모델

### 4.1 lead_messages

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 메시지 ID |
| lead_id | uuid | FK(leads), NOT NULL, ON DELETE CASCADE | 리드 ID |
| sender_id | uuid | FK(profiles), NOT NULL | 발신자 ID |
| content | text | NOT NULL | 메시지 내용 |
| read_at | timestamptz | NULL | 읽음 시간 (NULL이면 안 읽음) |
| created_at | timestamptz | NOT NULL, default now() | 생성 시간 |

- 인덱스: `idx_lead_messages_lead_id_created_at` (lead_id, created_at ASC)
- 인덱스: `idx_lead_messages_sender_id` (sender_id)

### 4.2 lead_message_attachments

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 첨부 ID |
| message_id | uuid | FK(lead_messages), NOT NULL, ON DELETE CASCADE | 메시지 ID |
| file_id | uuid | FK(files), NOT NULL, ON DELETE RESTRICT | 파일 ID |
| created_at | timestamptz | NOT NULL, default now() | 생성 시간 |

- 인덱스: `idx_lead_message_attachments_message_id` (message_id)

### 4.3 기존 테이블 변경

- `notification_type` enum: `lead_message_received` 값 추가
- `file_purpose` enum: `lead_message_attachment` 값 추가

### 4.4 RLS 정책

**lead_messages:**

```
-- SELECT: 관리자 또는 리드 참여자
lead_messages_select_policy:
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = lead_id
      AND (l.doctor_user_id = auth.uid() OR is_vendor_owner(l.vendor_id))
    )
  )

-- INSERT: 리드 참여자이고 본인이 발신자
lead_messages_insert_policy:
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = lead_id
      AND (l.doctor_user_id = auth.uid() OR is_vendor_owner(l.vendor_id))
    )
  )

-- UPDATE: 발신자가 아닌 참여자만 (읽음 표시)
lead_messages_update_policy:
  USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = lead_id
      AND (l.doctor_user_id = auth.uid() OR is_vendor_owner(l.vendor_id))
    )
  )
  WITH CHECK (read_at IS NOT NULL)
```

**lead_message_attachments:**

```
-- SELECT: lead_messages와 동일 조건
lead_message_attachments_select_policy:
  USING (
    EXISTS (
      SELECT 1 FROM lead_messages m
      JOIN leads l ON l.id = m.lead_id
      WHERE m.id = message_id
      AND (is_admin() OR l.doctor_user_id = auth.uid() OR is_vendor_owner(l.vendor_id))
    )
  )

-- INSERT: 메시지 발신자와 동일 조건
lead_message_attachments_insert_policy:
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lead_messages m
      WHERE m.id = message_id
      AND m.sender_id = auth.uid()
    )
  )
```

### 4.5 마이그레이션

- 파일: `app/supabase/migrations/XXX_lead_messages.ts`
- 롤백(down) 전략:
  1. RLS 정책 삭제
  2. 인덱스 삭제
  3. lead_message_attachments 테이블 삭제
  4. lead_messages 테이블 삭제
  5. enum 값 제거 (주의: 사용 중인 데이터 확인 필요)

## 5. API 설계

### 5.1 GET /api/leads/[id]/messages

| 항목 | 값 |
| --- | --- |
| 메서드/경로 | `GET /api/leads/{id}/messages` |
| 권한 | `withAuth` (RLS가 참여자/관리자 필터링) |
| 요청 스키마 | Query: `LeadMessagesListQuerySchema` |
| 응답 스키마 | `LeadMessagesListResponseSchema` |

**Query 파라미터:**
- `page`: number (기본 1, 최소 1)
- `pageSize`: number (기본 20, 최소 1, 최대 50)

**응답 (200):**
- `code`: "success"
- `data.items`: LeadMessageView[]
- `data.page`: number
- `data.pageSize`: number
- `data.total`: number (전체 메시지 수)

**에러 응답:**
- 400: Zod 검증 실패
- 401: 인증 실패
- 404: 리드 없음

### 5.2 POST /api/leads/[id]/messages

| 항목 | 값 |
| --- | --- |
| 메서드/경로 | `POST /api/leads/{id}/messages` |
| 권한 | `withAuth` + 참여자 검증 (관리자 제외) |
| 요청 스키마 | Body: `LeadMessageCreateBodySchema` |
| 응답 스키마 | `LeadMessageResponseSchema` |

**Body 파라미터:**
- `content`: string (필수, 최소 1자, 최대 5000자)
- `attachmentFileIds`: string[] (선택, 최대 5개, 각 UUID)

**응답 (201):**
- `code`: "success"
- `data.message`: LeadMessageView

**에러 응답:**
- 400: Zod 검증 실패, 빈 메시지
- 401: 인증 실패
- 403: 관리자는 메시지 작성 불가, 리드 참여자 아님
- 404: 리드 없음
- 429: Rate limit 초과 (분당 10건)

### 5.3 PATCH /api/leads/[id]/messages/read

| 항목 | 값 |
| --- | --- |
| 메서드/경로 | `PATCH /api/leads/{id}/messages/read` |
| 권한 | `withAuth` + 참여자 검증 |
| 요청 스키마 | Body: `LeadMessageReadPatchBodySchema` |
| 응답 스키마 | 204 No Content |

**Body 파라미터:**
- `messageIds`: string[] (필수, 최소 1개, 각 UUID)

**응답 (204):** No Content

**에러 응답:**
- 400: Zod 검증 실패
- 401: 인증 실패
- 403: 자신이 보낸 메시지는 읽음 표시 불가
- 404: 리드 없음, 메시지 없음

## 6. 서비스/도메인 계층

### 6.1 message-service.ts

**getMessages(supabase, leadId, query, userId):**
- 입력: SupabaseClient, leadId(string), query(LeadMessagesListQuery), userId(string)
- 반환: { items: LeadMessageView[], page, pageSize, total }
- 동작:
  1. 리드 존재 및 참여자 검증
  2. Repository `fetchMessages()` 호출
  3. Mapper 변환 후 반환

**sendMessage(supabase, leadId, body, userId):**
- 입력: SupabaseClient, leadId(string), body(LeadMessageCreateBody), userId(string)
- 반환: LeadMessageView
- 동작:
  1. 리드 존재 및 참여자 검증
  2. 관리자 여부 확인 -> 관리자면 `forbidden()` 반환
  3. Rate limit 확인 (분당 10건)
  4. Repository `insertMessage()` 호출
  5. 첨부파일 있으면 `insertMessageAttachments()` 호출
  6. 알림 발송 (비동기, 실패해도 메시지는 저장됨)
  7. Mapper 변환 후 반환
- 트랜잭션: 메시지 + 첨부파일 저장은 하나의 트랜잭션
- 에러: 리드 없음(404), 관리자(403), 참여자 아님(403), Rate limit(429)

**markAsRead(supabase, leadId, messageIds, userId):**
- 입력: SupabaseClient, leadId(string), messageIds(string[]), userId(string)
- 반환: void
- 동작:
  1. 리드 존재 및 참여자 검증
  2. 본인이 보낸 메시지 제외 필터링
  3. Repository `updateMessagesReadAt()` 호출
- 에러: 리드 없음(404), 참여자 아님(403)

### 6.2 message-repository.ts

**fetchMessages(supabase, leadId, page, pageSize):**
- 반환: { rows: LeadMessageRow[], total: number }
- 쿼리: lead_messages + lead_message_attachments JOIN
- 정렬: created_at ASC (오래된 것부터)
- 페이지네이션: offset = (page - 1) * pageSize

**insertMessage(supabase, payload):**
- 반환: LeadMessageRow
- 페이로드: { lead_id, sender_id, content }

**insertMessageAttachments(supabase, messageId, fileIds):**
- 반환: void
- bulk insert

**updateMessagesReadAt(supabase, messageIds, readAt):**
- 반환: void
- 조건: sender_id != auth.uid() (RLS에서도 검증)

**checkMessageRateLimit(supabase, userId, leadId):**
- 반환: boolean (true = 제한 초과)
- 쿼리: 최근 1분 내 해당 리드의 메시지 수 카운트

### 6.3 message-mapper.ts

**mapMessageRow(row, attachments):**
- 입력: LeadMessageRow, LeadMessageAttachmentRow[]
- 반환: LeadMessageView

### 6.4 notification/service.ts 확장

**sendLeadMessageNotification(params):**
- 입력: { recipientUserId, senderName, leadId, messagePreview }
- 동작:
  1. 수신자 알림 설정 조회
  2. lead_enabled, email_enabled, kakao_enabled 확인
  3. Email + 카카오 병렬 발송 (기존 패턴 참조)
  4. notification_deliveries 로그 기록
- 참조: `sendVerificationResult()` 패턴 (service.ts:262)

## 7. 테스트 전략

| 구분 | 시나리오 | 도구 |
| --- | --- | --- |
| 통합 | 메시지 목록 조회 (페이지네이션) | Vitest + Supertest |
| 통합 | 메시지 발송 (첨부파일 포함) | Vitest + Supertest |
| 통합 | 읽음 표시 (bulk) | Vitest + Supertest |
| 통합 | 권한 검증 (관리자 작성 불가) | Vitest + Supertest |
| 통합 | Rate limit 검증 | Vitest + Supertest |

### 검증 명령

```bash
pnpm lint
pnpm type-check
pnpm test -- lead-messages
```

## 8. 운영/배포

- 마이그레이션 적용 순서:
  1. DB 마이그레이션 (테이블, RLS, 인덱스, enum)
  2. `pnpm db:gen` 실행 (타입 재생성)
  3. 백엔드 코드 배포
  4. 프론트엔드 코드 배포
- 롤백 절차:
  1. 프론트엔드 이전 버전 배포
  2. 백엔드 이전 버전 배포
  3. 마이그레이션 롤백 (데이터 손실 주의)
- 기능 플래그: 불필요 (기존 리드 시스템에 탭 추가이므로 점진적 노출 가능)

## 9. 백로그

- [ ] 실시간 웹소켓 기반 메시지 수신
- [ ] 동일 리드 내 다중 알림 병합
- [ ] 메시지 검색 기능
- [ ] 관리자 대화 참여 기능
- [ ] closed/canceled 상태 리드 메시지 작성 정책 검토

## Progress Log (append-only)

### 2026-01-30T16:00:00Z schema-implementer

**완료 태스크**: SCHEMA-1, SCHEMA-2
**생성/수정 파일**:
- `app/src/lib/schema/lead.ts` (UPDATE)
- `app/supabase/migrations/20260130160000_lead_messages.sql` (CREATE)

**검증 결과**: type-check PASS
**다음**: backend-implementer, frontend-implementer 실행 가능
