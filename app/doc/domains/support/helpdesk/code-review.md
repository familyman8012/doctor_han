# Code Review: support/helpdesk

> 리뷰 일시: 2026-01-31
> 리뷰 범위: 고객지원 헬프데스크 기능 전체 구현

## 리뷰 요약

| 등급 | 개수 |
|------|------|
| Critical | 0 |
| Important | 4 |
| Suggestion | 6 |

**전체 평가**: 프로젝트 표준을 잘 따르고 있으며 PRD/TSD 요구사항을 충실히 구현함. 몇 가지 개선 사항이 있으나 치명적인 문제는 없음.

---

## Critical (0건)

없음.

---

## Important (4건)

### IMP-1: 트랜잭션 원자성 미보장

**파일**: `/app/src/server/support/service.ts`
**위치**: `createTicket`, `sendAdminMessage`, `reopenTicket` 함수

**문제**:
PRD 6절 NFR에서 "상태 변경 + 메시지 저장 + 이력 기록은 트랜잭션으로 원자성 보장" 명시.
현재 구현에서는 `insertTicket`, `insertStatusHistory` 등이 별도 쿼리로 실행되어 중간에 실패 시 데이터 불일치 발생 가능.

```typescript
// createTicket 함수 (service.ts:76-93)
const ticketRow = await insertTicket(supabase, {...});
// 여기서 실패하면 티켓은 생성되었으나 이력은 없음
await insertStatusHistory(supabase, {...});
```

**권장 수정**:
Supabase의 `rpc` 호출로 PostgreSQL function을 만들어 트랜잭션 처리하거나, 최소한 try-catch로 보상 로직 추가.

---

### IMP-2: Rate Limit 우회 가능성

**파일**: `/app/src/server/support/repository.ts`
**위치**: `checkTicketRateLimit` 함수 (라인 32-54)

**문제**:
Rate limit 체크와 티켓 생성 사이에 TOCTOU(Time-of-Check to Time-of-Use) 경합 조건 존재. 동시 요청 시 5건 제한 우회 가능.

```typescript
// 체크 시점
const isRateLimited = await checkTicketRateLimit(supabase, userId);
// 티켓 생성 시점 - 이 사이에 다른 요청이 티켓 생성 가능
const ticketRow = await insertTicket(supabase, {...});
```

**권장 수정**:
DB 레벨에서 CHECK 제약조건 또는 Trigger로 강제하거나, SELECT FOR UPDATE 패턴 적용.

---

### IMP-3: 관리자 메시지 전송 시 closed 상태 체크 누락

**파일**: `/app/src/server/support/service.ts`
**위치**: `sendAdminMessage` 함수 (라인 422-473)

**문제**:
사용자 메시지 전송(`sendUserMessage`)은 closed 상태 체크가 있으나, 관리자 메시지 전송에는 해당 체크가 없음.
관리자는 closed 티켓에도 메시지를 보낼 수 있는 것인지 명확하지 않음 (TSD 5.2절에 따르면 관리자는 모든 티켓에 메시지 발송 가능하나, closed 상태에 대한 명시 없음).

```typescript
// sendUserMessage (라인 198-201)
if (ticketRow.status === "closed") {
    throw badRequest("종료된 티켓에는 메시지를 보낼 수 없습니다.");
}

// sendAdminMessage - closed 체크 없음
```

**권장 수정**:
PRD/TSD에서 의도를 명확히 하고, closed 티켓에 관리자도 메시지 불가면 체크 추가. 가능하다면 주석으로 의도 명시.

---

### IMP-4: reopenTicket에서 상태 이력 기록 시 admin client 사용

**파일**: `/app/src/server/support/service.ts`
**위치**: `reopenTicket` 함수 (라인 274-281)

**문제**:
사용자가 티켓 재오픈 시 상태 이력 기록을 위해 `createSupabaseAdminClient()`를 사용하여 RLS를 우회함. 이는 RLS 정책(`is_admin()` 체크)과 충돌.

```typescript
// 사용자인데 admin client로 상태 이력 기록
const adminSupabase = createSupabaseAdminClient();
await insertStatusHistory(adminSupabase, {...});
```

**근본 원인**:
`support_ticket_status_history` 테이블의 RLS 정책이 `is_admin()` 체크만 있어서 사용자가 직접 기록 불가.

**권장 수정**:
1. RLS 정책에 "사용자가 본인 티켓 재오픈 시 이력 기록 가능" 조건 추가, 또는
2. PostgreSQL Trigger로 상태 변경 시 자동 이력 기록 (권장)

---

## Suggestion (6건)

### SUG-1: N+1 쿼리 문제 - 티켓 목록 조회

**파일**: `/app/src/server/support/service.ts`
**위치**: `getMyTickets` 함수 (라인 132-138)

**현재**:
```typescript
const items = await Promise.all(
    rows.map(async (row) => {
        const [unreadCount, lastMessagePreview] = await Promise.all([
            getUnreadCount(supabase, row.id, userId),
            getLastMessagePreview(supabase, row.id),
        ]);
        return mapTicketToListItem(row, unreadCount, lastMessagePreview);
    }),
);
```

**권장**:
PostgreSQL 서브쿼리 또는 윈도우 함수로 한 번에 조회하도록 최적화. 페이지당 20건이면 40개의 추가 쿼리 발생.

---

### SUG-2: 검색 기능 제한 - 제목만 검색

**파일**: `/app/src/server/support/repository.ts`
**위치**: `fetchAdminTickets` 함수 (라인 208-211)

**현재**:
```typescript
// For search, we need to filter by title or user info
// This is a simplified approach - title search only
query = query.ilike("title", `%${q}%`);
```

**TSD 명세**: "q?: z.string().trim().min(1), // 제목/사용자명 검색"

**권장**:
사용자명/이메일 검색도 지원하도록 OR 조건 추가. 현재 주석에도 "simplified approach"로 명시되어 있으므로 후속 개선 필요.

---

### SUG-3: 알림 발송 대상 - 첫 번째 관리자만

**파일**: `/app/src/server/support/service.ts`
**위치**: `sendTicketCreatedNotification` 함수 (라인 499-500)

**현재**:
```typescript
// Send notification to first admin (simplified for now)
const adminId = adminIds[0];
```

**권장**:
모든 관리자에게 알림 발송하거나, 담당자 배정 시스템 구현 전까지 최소한 2-3명에게 발송. 현재는 첫 번째 관리자만 받음.

---

### SUG-4: FAQ 검색 연동 - 카테고리별 필터 미적용

**파일**: `/app/src/app/(main)/mypage/support/new/page.tsx`
**위치**: 라인 35-43

**PRD 5.6절**: "카테고리 선택 -> 해당 카테고리 FAQ 목록 표시 -> 검색 -> 해결 안 됨 -> 티켓 생성"

**현재**:
- FAQ 검색은 전체 검색만 지원
- 카테고리 선택은 티켓 생성 폼에서만 가능

**권장**:
FAQ 검색 단계에서 카테고리 선택 UI 추가, 해당 카테고리로 필터링된 FAQ 표시.

---

### SUG-5: 메시지 컴포넌트 위치 - 공유 컴포넌트로 이동 고려

**파일**: `/app/src/app/(main)/mypage/support/components/*.tsx`

**현재**:
`MessageList`, `MessageInput`, `MessageBubble` 등이 mypage/support/components에 있고, admin/support와 partner/support에서 import.

**권장**:
공통 사용 컴포넌트는 `app/src/components/widgets/` 또는 `app/src/app/(main)/_shared/` 등으로 이동하여 명시적 공유 의도 표현.

---

### SUG-6: 감사 로그 미구현

**PRD 6절 NFR**: "감사 로그 필수: `support_ticket.create`, `support_ticket.status_change`, `support_ticket.resolve`"

**현재 상태**:
`console.log`/`console.error`로 로깅하고 있으나, 별도 감사 로그 테이블이나 구조화된 로그 시스템 미구현.

**권장**:
감사 로그 테이블 생성 또는 기존 audit_logs 테이블 활용하여 필수 이벤트 기록.

---

## 패턴 준수 확인

### API Route 패턴 체크

| 항목 | 상태 | 비고 |
|------|------|------|
| `withApi` 래퍼 사용 | PASS | 모든 API Route에서 사용 |
| `ok/created/fail` 응답 | PASS | 표준 응답 형식 사용 |
| 입력 검증 Zod `.parse()` | PASS | Query/Body 모두 parse 사용 |
| 동적 라우트 타입 정의 | PASS | `RouteParams` 타입 정의됨 |

### 권한/인가 체크

| 항목 | 상태 | 비고 |
|------|------|------|
| 사용자 API - `withAuth` | PASS | `/api/support/**` |
| 관리자 API - `withRole(["admin"])` | PASS | `/api/admin/support/**` |
| RLS 정책 적용 | PASS | 모든 테이블에 RLS 활성화 |

### Supabase 에러 처리

| 항목 | 상태 | 비고 |
|------|------|------|
| 에러 시 `internalServerError` 사용 | PASS | repository.ts 전체 |
| 에러 상세 정보 포함 | PASS | `message`, `code` 전달 |

### Frontend 패턴 체크

| 항목 | 상태 | 비고 |
|------|------|------|
| React Query 직접 사용 | PASS | 커스텀 Hook 래핑 없음 |
| Server Actions 금지 | PASS | API Route만 사용 |
| nuqs URL 상태 관리 | PASS | 필터/페이지네이션에 적용 |

---

## 구현 완성도

### PRD 요구사항 대비 구현 상태

| 요구사항 | 상태 | 비고 |
|----------|------|------|
| 5.1 티켓 생성 | DONE | SLA 자동 설정 포함 |
| 5.2 메시지 스레드 | DONE | 읽음 표시 포함 |
| 5.3 티켓 상태 관리 | DONE | 4단계 상태 전이 |
| 5.4 상태 변경 이력 | DONE | 이력 테이블 구현 |
| 5.5 SLA 관리 | DONE | 24h/72h 고정 SLA |
| 5.6 FAQ 연동 | PARTIAL | 카테고리별 필터 미구현 |
| 5.7 알림 | PARTIAL | 이메일 구현, 카카오 일부 |
| 5.8 UI 진입점 | DONE | 모든 레이아웃 업데이트됨 |
| 5.9 API | DONE | 모든 엔드포인트 구현 |
| 5.10 권한/보안 | DONE | RLS + API 가드 적용 |

---

## 파일별 상세 리뷰

### Schema/Migration

**`20260131140000_support_helpdesk.sql`**
- Enum, 테이블, 인덱스, RLS 정책 모두 TSD 명세와 일치
- SLA 관련 partial index 적절히 적용
- `updated_at` trigger 설정됨

**`20260131150000_support_tickets_reopen_policy.sql`**
- 사용자 재오픈 정책 별도 마이그레이션으로 분리 (적절함)
- resolved -> open 전이만 허용하는 RLS 정책 올바르게 구현

### Backend

**`repository.ts`**
- 표준 Supabase 쿼리 패턴 준수
- relation 조회 시 FK 명시 적절
- 에러 처리 일관성 있음

**`service.ts`**
- 도메인 로직 분리 잘 됨
- 알림 발송이 non-blocking (catch로 처리)
- Important 이슈 3건 발견 (위 참조)

**`mapper.ts`**
- SLA 상태 계산 로직 명확
- null 처리 적절

### API Routes

**모든 Route 파일**
- `withApi` + `withAuth`/`withRole` 패턴 일관됨
- Zod parse 사용
- 적절한 HTTP 메서드 및 상태 코드 반환

### Frontend

**페이지 구조**
- mypage/partner/admin 각각 적절한 페이지 구성
- 컴포넌트 재사용 적절 (TicketListItem, MessageList 등)

**상태 관리**
- React Query queryKey 일관성 있음
- mutation 성공 시 invalidateQueries 적절

**UX**
- 로딩/에러/빈 상태 처리됨
- 폴링(30초) 구현됨

---

## 결론

고객지원 헬프데스크 기능은 프로젝트 표준을 따르며 PRD/TSD 요구사항을 대부분 충족함. Important 이슈 4건은 데이터 일관성 및 보안 관련이므로 우선 검토 권장. Suggestion 6건은 성능 최적화 및 UX 개선 관련으로 후속 작업으로 진행 가능.
