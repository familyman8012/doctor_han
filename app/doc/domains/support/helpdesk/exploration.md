# Exploration Report: support/helpdesk

## 탐색 일시
2026-01-31

## 탐색 범위
헬프데스크(고객지원) 기능 - 1:1 문의 티켓 + SLA + FAQ 연동

---

## 1. 레이어별 관련 파일

### 1.1 UI Layer

| 파일 | 용도 | 재사용 |
|------|------|--------|
| `app/src/app/(main)/mypage/layout.tsx` | 마이페이지 탭 네비게이션 | ✅ 확장 (support 탭 추가) |
| `app/src/app/(main)/partner/layout.tsx` | 파트너센터 탭 네비게이션 | ✅ 확장 (support 탭 추가) |
| `app/src/app/(main)/admin/layout.tsx` | 관리자 사이드바 메뉴 | ✅ 확장 (support 메뉴 추가) |
| `app/src/app/(main)/mypage/leads/[id]/components/MessagesTab.tsx` | 메시지 스레드 탭 | ✅ 참조 패턴 |
| `app/src/app/(main)/mypage/leads/[id]/components/MessageBubble.tsx` | 메시지 버블 UI | ✅ 재사용 가능 |
| `app/src/app/(main)/mypage/leads/[id]/components/MessageList.tsx` | 메시지 목록 UI | ✅ 참조 패턴 |
| `app/src/app/(main)/admin/reports/page.tsx` | 신고 관리 목록 | ✅ 참조 패턴 |
| `app/src/app/(main)/admin/reports/components/ReportDetailModal.tsx` | 신고 상세 모달 | ✅ 참조 패턴 |
| `app/src/app/(main)/admin/help-center/page.tsx` | FAQ/공지 관리 | ✅ 참조 (FAQ 검색 연동) |

### 1.2 API Layer

| 파일 | 용도 | 재사용 |
|------|------|--------|
| `app/src/app/api/leads/[id]/messages/route.ts` | 리드 메시지 CRUD | ✅ 참조 패턴 |
| `app/src/app/api/admin/reports/route.ts` | 신고 목록 조회 | ✅ 참조 패턴 |
| `app/src/app/api/admin/reports/[id]/resolve/route.ts` | 신고 처리 | ✅ 참조 패턴 |
| `app/src/app/api/help/articles/route.ts` | FAQ 조회 | ✅ FAQ 연동 시 사용 |

### 1.3 Server Layer

| 파일 | 용도 | 재사용 |
|------|------|--------|
| `app/src/server/lead/message-service.ts` | 메시지 비즈니스 로직 | ✅ 참조 패턴 |
| `app/src/server/lead/message-repository.ts` | 메시지 DB 접근 | ✅ 참조 패턴 |
| `app/src/server/report/service.ts` | 신고 처리 로직 | ✅ 참조 (상태 전이) |
| `app/src/server/notification/service.ts` | 알림 발송 | ✅ 재사용 |
| `app/src/server/notification/repository.ts` | 알림 설정/로그 | ✅ 재사용 |
| `app/src/server/auth/guards.ts` | 권한 가드 | ✅ 재사용 |
| `app/src/server/api/response.ts` | API 응답 유틸 | ✅ 재사용 |

### 1.4 Schema Layer

| 파일 | 용도 | 재사용 |
|------|------|--------|
| `app/src/lib/schema/lead.ts` | 리드/메시지 스키마 | ✅ 참조 패턴 |
| `app/src/lib/schema/report.ts` | 신고/제재 스키마 | ✅ 참조 (상태 enum) |
| `app/src/lib/schema/help-center.ts` | FAQ/카테고리 스키마 | ✅ 카테고리 연동 |
| `app/src/lib/schema/notification.ts` | 알림 타입 스키마 | ✅ 확장 (신규 타입) |
| `app/src/lib/schema/common.ts` | 공통 스키마 유틸 | ✅ 재사용 |

### 1.5 DB Layer (Migrations)

| 파일 | 용도 | 재사용 |
|------|------|--------|
| `app/supabase/migrations/20260130160000_lead_messages.sql` | 메시지 테이블 | ✅ 참조 패턴 |
| `app/supabase/migrations/20260130000000_reports_sanctions.sql` | 신고 상태 전이 | ✅ 참조 패턴 |
| `app/supabase/migrations/20260130011528_help_center.sql` | FAQ 카테고리 | ✅ 카테고리 연동 |
| `app/supabase/migrations/20260117120000_notification_settings.sql` | 알림 설정 | ✅ 알림 타입 확장 |

### 1.6 API Client Layer

| 파일 | 용도 | 재사용 |
|------|------|--------|
| `app/src/api-client/client.ts` | Axios 설정 | ✅ 재사용 |
| `app/src/api-client/leads.ts` | 리드 API 클라이언트 | ✅ 참조 패턴 |
| `app/src/api-client/help-center.ts` | FAQ API 클라이언트 | ✅ FAQ 연동 |
| `app/src/api-client/admin.ts` | 관리자 API 클라이언트 | ✅ 확장 |

---

## 2. PENDING Matrix

모든 레이어는 PENDING 상태로, PRD 기반 판정은 Phase 3에서 수행.

| Layer | Status | 관련 파일 수 | 비고 |
|-------|--------|-------------|------|
| DB Migration | PENDING | 1 신규 | support_tickets 테이블 생성 필요 |
| Zod Schema | PENDING | 1 신규 | support.ts 생성 필요 |
| Server (Service/Repo/Mapper) | PENDING | 3 신규 | support/ 디렉토리 생성 필요 |
| API Routes | PENDING | 4+ 신규 | /api/support/*, /api/admin/support/* |
| API Client | PENDING | 1 신규 | support.ts 생성 필요 |
| UI (Pages) | PENDING | 3 신규 | mypage/support, partner/support, admin/support |
| UI (Components) | PENDING | 5+ 신규 | 티켓 목록, 상세, 메시지 스레드 등 |

---

## 3. 주요 패턴 발견

### 3.1 상태 전이 패턴 (Report 시스템 참조)
```typescript
// 티켓 상태
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

// 상태 전이 이력 (lead_status_history 패턴)
support_ticket_status_history: {
  ticket_id, from_status, to_status, changed_by, note, created_at
}
```

### 3.2 메시지 스레드 패턴 (Lead Messages 참조)
```typescript
// 티켓 응답 테이블
support_ticket_messages: {
  id, ticket_id, sender_id, content, is_admin, read_at, created_at
}
```

### 3.3 SLA 패턴 (신규)
```typescript
// 티켓 테이블에 SLA 관련 필드
support_tickets: {
  ...
  first_response_at: timestamptz | null,
  resolved_at: timestamptz | null,
  sla_first_response_due: timestamptz,  // created_at + 24h
  sla_resolution_due: timestamptz,       // created_at + 72h
}
```

### 3.4 FAQ 카테고리 연동 (Help Center 참조)
```typescript
// 기존 help_categories 테이블 재사용
support_tickets: {
  category_id: UUID (FK → help_categories.id)
}
```

### 3.5 알림 발송 패턴 (Notification Service 재사용)
```typescript
// 신규 알림 타입 추가
type NotificationType =
  | ... 기존 타입들
  | "support_ticket_created"      // 티켓 생성 (관리자에게)
  | "support_ticket_response"     // 응답 수신 (사용자에게)
  | "support_ticket_resolved";    // 해결 완료 (사용자에게)
```

---

## 4. Planner 참고사항

### 4.1 재사용 가능한 핵심 패턴
1. **메시지 스레드**: `MessagesTab`, `MessageBubble`, `MessageList` 컴포넌트 구조 재사용
2. **상태 배지**: `Badge` 컴포넌트 + 상태별 색상 매핑
3. **목록/필터**: nuqs 기반 URL 상태 관리 + React Query 조합
4. **권한 가드**: `withAuth()`, `withRole(["admin"])` 패턴
5. **알림 발송**: `sendVerificationResultEmail`, `sendKakaoAlimtalk` 재사용

### 4.2 신규 생성 필요 항목
1. **DB Migration**: `support_tickets`, `support_ticket_messages`, `support_ticket_status_history`
2. **Zod Schema**: `app/src/lib/schema/support.ts`
3. **Server Module**: `app/src/server/support/{repository,service,mapper}.ts`
4. **API Routes**:
   - `POST /api/support/tickets` - 티켓 생성
   - `GET /api/support/tickets` - 내 티켓 목록
   - `GET /api/support/tickets/[id]` - 티켓 상세
   - `POST /api/support/tickets/[id]/messages` - 메시지 발송
   - `GET /api/admin/support/tickets` - 관리자 티켓 목록
   - `PATCH /api/admin/support/tickets/[id]/status` - 상태 변경
5. **UI Pages**:
   - `/mypage/support` - 의사 문의함
   - `/partner/support` - 업체 문의함
   - `/admin/support` - 관리자 티켓 관리

### 4.3 성능 고려사항
- 티켓 목록: 페이지네이션 필수 (기본 20개)
- 메시지 로딩: 무한 스크롤 또는 페이지네이션
- SLA 계산: DB 레벨에서 계산 (인덱스 활용)

### 4.4 RLS 정책 설계
```sql
-- 사용자: 본인 티켓만
using (user_id = auth.uid())

-- 관리자: 전체 접근
using (public.is_admin())
```

---

## 5. 기존 코드 의존성

### 5.1 활용할 기존 테이블
- `help_categories`: FAQ 카테고리 (티켓 분류용)
- `profiles`: 사용자 정보 (역할, 이메일, 이름)
- `notification_settings`: 알림 설정 확인
- `notification_deliveries`: 알림 발송 로그

### 5.2 활용할 기존 함수
- `is_admin()`: 관리자 권한 확인
- `auth.uid()`: 현재 사용자 ID
- `notification-service.ts`: 이메일/카카오 발송

### 5.3 확장할 기존 Enum
- `notification_type`: 티켓 관련 타입 추가 필요

---

## 6. 요약

헬프데스크 기능은 기존 신고 시스템(상태 전이)과 리드 메시지 시스템(메시지 스레드)의 패턴을 조합하여 구현 가능합니다.

**핵심 구현 포인트:**
1. 티켓 테이블 + 메시지 테이블 + 상태 이력 테이블
2. FAQ 카테고리 연동 (기존 help_categories 재사용)
3. 고정 SLA (24h 최초 응답, 72h 해결)
4. 이메일 + 카카오 알림 (기존 인프라 재사용)
5. 사용자 UI (mypage/partner) + 관리자 UI (admin)
