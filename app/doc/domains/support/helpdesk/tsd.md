# 고객지원 헬프데스크 TSD

> 기반 문서: `app/doc/domains/support/helpdesk/prd.md:1`
> 참고 코드: `app/src/server/lead/message-service.ts:1`, `app/src/lib/schema/help-center.ts:1`, `app/supabase/migrations/20260130160000_lead_messages.sql:1`

## 0. 변경 요약 (파일 단위)

| 파일 | 변경 | 변경 내용 요약 |
| --- | --- | --- |
| `app/supabase/migrations/YYYYMMDDHHMMSS_support_helpdesk.sql` | CREATE | support_tickets, support_ticket_messages, support_ticket_status_history 테이블 + RLS + enum 확장 |
| `app/src/lib/schema/support.ts` | CREATE | 티켓/메시지/상태 Zod 스키마 정의 |
| `app/src/lib/schema/notification.ts` | UPDATE | notification_type에 support 관련 타입 추가 |
| `app/src/server/support/repository.ts` | CREATE | 티켓/메시지 DB 접근 함수 |
| `app/src/server/support/service.ts` | CREATE | 티켓 생성/상태 변경/메시지 발송 비즈니스 로직 |
| `app/src/server/support/mapper.ts` | CREATE | Row -> DTO 변환 함수 |
| `app/src/app/api/support/tickets/route.ts` | CREATE | 사용자 티켓 생성/목록 조회 |
| `app/src/app/api/support/tickets/[id]/route.ts` | CREATE | 사용자 티켓 상세 조회 |
| `app/src/app/api/support/tickets/[id]/messages/route.ts` | CREATE | 사용자 메시지 발송 |
| `app/src/app/api/support/tickets/[id]/messages/read/route.ts` | CREATE | 메시지 읽음 표시 |
| `app/src/app/api/support/tickets/[id]/reopen/route.ts` | CREATE | 사용자 티켓 재오픈 |
| `app/src/app/api/admin/support/tickets/route.ts` | CREATE | 관리자 티켓 목록 조회 |
| `app/src/app/api/admin/support/tickets/[id]/route.ts` | CREATE | 관리자 티켓 상세 조회 |
| `app/src/app/api/admin/support/tickets/[id]/status/route.ts` | CREATE | 관리자 상태 변경 |
| `app/src/app/api/admin/support/tickets/[id]/messages/route.ts` | CREATE | 관리자 메시지 발송 |
| `app/src/api-client/support.ts` | CREATE | 사용자용 API 클라이언트 |
| `app/src/api-client/admin.ts` | UPDATE | 관리자 support API 함수 추가 |
| `app/src/app/(main)/mypage/layout.tsx` | UPDATE | NAV_ITEMS에 support 탭 추가 |
| `app/src/app/(main)/partner/layout.tsx` | UPDATE | NAV_ITEMS에 support 탭 추가 |
| `app/src/app/(main)/admin/layout.tsx` | UPDATE | NAV_ITEMS에 고객지원 메뉴 추가 |
| `app/src/app/(main)/mypage/support/page.tsx` | CREATE | 의사 문의함 페이지 |
| `app/src/app/(main)/mypage/support/[id]/page.tsx` | CREATE | 의사 티켓 상세 페이지 |
| `app/src/app/(main)/mypage/support/new/page.tsx` | CREATE | 의사 티켓 생성 페이지 |
| `app/src/app/(main)/partner/support/page.tsx` | CREATE | 업체 문의함 페이지 |
| `app/src/app/(main)/partner/support/[id]/page.tsx` | CREATE | 업체 티켓 상세 페이지 |
| `app/src/app/(main)/partner/support/new/page.tsx` | CREATE | 업체 티켓 생성 페이지 |
| `app/src/app/(main)/admin/support/page.tsx` | CREATE | 관리자 티켓 목록 페이지 |
| `app/src/app/(main)/admin/support/[id]/page.tsx` | CREATE | 관리자 티켓 상세 페이지 |

## 0.1 영향 범위 매트릭스 (Impact Matrix)

| 레이어 | 변경 여부 | 관련 파일(대표) | 근거 |
| --- | --- | --- | --- |
| UI (Pages/Components) | UPDATE | `app/src/app/(main)/mypage/layout.tsx:12-19`, `app/src/app/(main)/partner/layout.tsx:11-17`, `app/src/app/(main)/admin/layout.tsx:11-18` | NAV_ITEMS 배열에 support 경로 추가 필요 |
| API Route | CREATE | `app/src/app/api/support/**`, `app/src/app/api/admin/support/**` | 신규 엔드포인트 생성 |
| API Client | UPDATE | `app/src/api-client/admin.ts` | 관리자 support API 함수 추가 |
| Schema (Zod) | CREATE | `app/src/lib/schema/support.ts` | 신규 스키마 파일 생성 |
| Service | CREATE | `app/src/server/support/service.ts` | 신규 서비스 모듈 생성 |
| Repo/DB (+ Migration) | CREATE | `app/supabase/migrations/YYYYMMDDHHMMSS_support_helpdesk.sql` | 신규 테이블 3개 + RLS 정책 |
| Auth/Security/RLS | UPDATE | `app/supabase/migrations/YYYYMMDDHHMMSS_support_helpdesk.sql` | support_tickets, support_ticket_messages, support_ticket_status_history RLS 정책 추가 |
| Integrations/Cache | UPDATE | `app/src/server/notification/service.ts` | support 관련 알림 발송 함수 추가 (기존 패턴 재사용) |
| Config/Middleware/Env | NO CHANGE | - | 환경 변수/미들웨어 변경 없음 |
| Tests | CREATE | `app/src/tests/unit/support.test.ts` | 단위 테스트 추가 (선택) |

## 0.2 추가로 읽은 파일 (Read Set)

| 파일 | 라인 | 참조 이유 |
| --- | --- | --- |
| `app/src/server/lead/message-service.ts` | 1 | 메시지 스레드 패턴 참조 |
| `app/supabase/migrations/20260130160000_lead_messages.sql` | 1-111 | RLS 정책 패턴 참조 |
| `app/supabase/migrations/20260130000000_reports_sanctions.sql` | 1-143 | 상태 전이 패턴 참조 |
| `app/supabase/migrations/20260130011528_help_center.sql` | 16-25 | help_categories 테이블 구조 확인 |
| `app/src/lib/schema/report.ts` | 1-255 | 상태 enum, 목록/상세 스키마 패턴 참조 |
| `app/src/lib/schema/help-center.ts` | 1-200 | 카테고리 스키마 패턴 참조 |
| `app/src/server/auth/guards.ts` | 109-119 | withRole 가드 패턴 확인 |
| `app/src/server/notification/service.ts` | 1-430 | 알림 발송 패턴 확인 |

## 0.3 Step-by-Step Implementation Tasks

| ID | Layer | File | Action | Description | Depends On |
|----|-------|------|--------|-------------|------------|
| SCHEMA-1 | Migration | `app/supabase/migrations/YYYYMMDDHHMMSS_support_helpdesk.sql` | CREATE | support_tickets, support_ticket_messages, support_ticket_status_history 테이블 + enum + RLS | - |
| SCHEMA-2 | Schema | `app/src/lib/schema/support.ts` | CREATE | 티켓/메시지/상태 Zod 스키마 | - |
| SCHEMA-3 | Schema | `app/src/lib/schema/notification.ts` | UPDATE | notification_type에 support 타입 추가 | - |
| BACKEND-1 | Repository | `app/src/server/support/repository.ts` | CREATE | 티켓/메시지 CRUD 함수 | SCHEMA-1, SCHEMA-2 |
| BACKEND-2 | Mapper | `app/src/server/support/mapper.ts` | CREATE | Row -> DTO 변환 함수 | SCHEMA-2 |
| BACKEND-3 | Service | `app/src/server/support/service.ts` | CREATE | 비즈니스 로직 (상태 전이, SLA, 알림) | BACKEND-1, BACKEND-2 |
| BACKEND-4 | API | `app/src/app/api/support/tickets/route.ts` | CREATE | 사용자 티켓 생성/목록 | BACKEND-3 |
| BACKEND-5 | API | `app/src/app/api/support/tickets/[id]/route.ts` | CREATE | 사용자 티켓 상세 | BACKEND-3 |
| BACKEND-6 | API | `app/src/app/api/support/tickets/[id]/messages/route.ts` | CREATE | 사용자 메시지 발송 | BACKEND-3 |
| BACKEND-7 | API | `app/src/app/api/support/tickets/[id]/messages/read/route.ts` | CREATE | 메시지 읽음 표시 | BACKEND-3 |
| BACKEND-8 | API | `app/src/app/api/support/tickets/[id]/reopen/route.ts` | CREATE | 사용자 티켓 재오픈 | BACKEND-3 |
| BACKEND-9 | API | `app/src/app/api/admin/support/tickets/route.ts` | CREATE | 관리자 티켓 목록 | BACKEND-3 |
| BACKEND-10 | API | `app/src/app/api/admin/support/tickets/[id]/route.ts` | CREATE | 관리자 티켓 상세 | BACKEND-3 |
| BACKEND-11 | API | `app/src/app/api/admin/support/tickets/[id]/status/route.ts` | CREATE | 관리자 상태 변경 | BACKEND-3 |
| BACKEND-12 | API | `app/src/app/api/admin/support/tickets/[id]/messages/route.ts` | CREATE | 관리자 메시지 발송 | BACKEND-3 |
| FRONTEND-1 | API-Client | `app/src/api-client/support.ts` | CREATE | 사용자용 API 클라이언트 | BACKEND-4~8 |
| FRONTEND-2 | API-Client | `app/src/api-client/admin.ts` | UPDATE | 관리자 support API 함수 추가 | BACKEND-9~12 |
| FRONTEND-3 | Layout | `app/src/app/(main)/mypage/layout.tsx` | UPDATE | NAV_ITEMS에 support 탭 추가 | - |
| FRONTEND-4 | Layout | `app/src/app/(main)/partner/layout.tsx` | UPDATE | NAV_ITEMS에 support 탭 추가 | - |
| FRONTEND-5 | Layout | `app/src/app/(main)/admin/layout.tsx` | UPDATE | NAV_ITEMS에 고객지원 메뉴 추가 | - |
| FRONTEND-6 | UI | `app/src/app/(main)/mypage/support/page.tsx` | CREATE | 의사 문의함 페이지 | FRONTEND-1, SCHEMA-2 |
| FRONTEND-7 | UI | `app/src/app/(main)/mypage/support/[id]/page.tsx` | CREATE | 의사 티켓 상세 페이지 | FRONTEND-1, SCHEMA-2 |
| FRONTEND-8 | UI | `app/src/app/(main)/mypage/support/new/page.tsx` | CREATE | 의사 티켓 생성 페이지 | FRONTEND-1, SCHEMA-2 |
| FRONTEND-9 | UI | `app/src/app/(main)/partner/support/page.tsx` | CREATE | 업체 문의함 페이지 | FRONTEND-1, SCHEMA-2 |
| FRONTEND-10 | UI | `app/src/app/(main)/partner/support/[id]/page.tsx` | CREATE | 업체 티켓 상세 페이지 | FRONTEND-1, SCHEMA-2 |
| FRONTEND-11 | UI | `app/src/app/(main)/partner/support/new/page.tsx` | CREATE | 업체 티켓 생성 페이지 | FRONTEND-1, SCHEMA-2 |
| FRONTEND-12 | UI | `app/src/app/(main)/admin/support/page.tsx` | CREATE | 관리자 티켓 목록 페이지 | FRONTEND-2, SCHEMA-2 |
| FRONTEND-13 | UI | `app/src/app/(main)/admin/support/[id]/page.tsx` | CREATE | 관리자 티켓 상세 페이지 | FRONTEND-2, SCHEMA-2 |
| FRONTEND-14 | Components | `app/src/app/(main)/mypage/support/components/*.tsx` | CREATE | 티켓 목록/상세/메시지 컴포넌트 | SCHEMA-2 |
| FRONTEND-15 | Components | `app/src/app/(main)/admin/support/components/*.tsx` | CREATE | 관리자 티켓 목록/상세/상태변경 컴포넌트 | SCHEMA-2 |

## 0.4 Parallelization Strategy

### 실행 모드

| 모드 | 특징 | 권장 상황 |
|------|------|----------|
| **Conservative (기본)** | Backend 완료 후 Frontend 시작 | 대부분의 경우, API 스펙 변경 가능성 있을 때 |
| **Aggressive** | Backend+Frontend 병렬 시작 | 시간 우선, API 스펙 확정 시 |

### 실행 단계 (Conservative 기본값)

| Phase | Tasks | Executor | Mode |
|-------|-------|----------|------|
| 1 | SCHEMA-1, SCHEMA-2, SCHEMA-3 | schema-implementer | Both |
| 2 | BACKEND-1~12 | backend-implementer | Both |
| 3a | FRONTEND-1~2, FRONTEND-3~5 (layout만) | frontend-implementer | Aggressive: Phase 2와 병렬 |
| 3b | FRONTEND-6~15 | frontend-implementer | Conservative: Phase 2 완료 후 |
| 4 | Integration | main | Both |

**Conservative 흐름**: Phase 1 -> Phase 2 -> Phase 3b -> Phase 4
**Aggressive 흐름**: Phase 1 -> Phase 2 + 3a (병렬) -> Phase 3b -> Phase 4

### 파일 소유권 (충돌 방지)

| Pattern | Owner | Others |
|---------|-------|--------|
| `app/src/lib/schema/**` | schema-implementer | READ-ONLY |
| `app/supabase/migrations/**` | schema-implementer | READ-ONLY |
| `app/src/server/support/**` | backend-implementer | READ-ONLY |
| `app/src/app/api/**` | backend-implementer | READ-ONLY |
| `app/src/app/(main)/**` | frontend-implementer | READ-ONLY |
| `app/src/api-client/**` | frontend-implementer | READ-ONLY |

## 1. 범위

- **포함**
  - 1:1 문의 티켓 생성/조회/상태 관리
  - 티켓별 메시지 스레드 (사용자-관리자)
  - FAQ 카테고리 연동 (help_categories 재사용)
  - 고정 SLA (24h 최초 응답, 72h 해결)
  - 상태 변경 이력 기록
  - 이메일 + 카카오톡 알림
  - 사용자 UI (/mypage/support, /partner/support)
  - 관리자 UI (/admin/support)

- **제외**
  - 우선순위별 SLA
  - 담당자 배정 시스템
  - 자동 응답 봇/AI 챗봇
  - 첨부파일 지원
  - 만족도 평가
  - 실시간 웹소켓

## 2. 시스템 개요

### 2.1 아키텍처 / 경계

```
┌───────────────┐     ┌─────────────────┐     ┌────────────────┐
│  API Routes   │ --> │    Service      │ --> │   Repository   │
│ (/api/...)    │     │ (도메인 규칙)    │     │  (Supabase)    │
└───────────────┘     └─────────────────┘     └────────────────┘
                              │
                              v
                      ┌─────────────────┐
                      │  Notification   │
                      │    Service      │
                      └─────────────────┘
```

- UI: `app/src/app/(main)/mypage/support/**`, `app/src/app/(main)/partner/support/**`, `app/src/app/(main)/admin/support/**`
- API: `app/src/app/api/support/**`, `app/src/app/api/admin/support/**`
- API Client: `app/src/api-client/support.ts`, `app/src/api-client/admin.ts`
- Schema (Zod): `app/src/lib/schema/support.ts`
- Service: `app/src/server/support/service.ts`
- Repository: `app/src/server/support/repository.ts`
- Mapper: `app/src/server/support/mapper.ts`
- Auth/Security: `app/src/server/auth/guards.ts`, RLS policies

### 2.2 데이터 흐름

**티켓 생성 흐름:**
1. UI -> `POST /api/support/tickets` (withAuth)
2. API -> Service: 티켓 생성 + SLA 기한 설정 + 상태 이력 기록
3. Service -> Repository: DB INSERT (트랜잭션)
4. Service -> NotificationService: 관리자에게 알림 발송
5. Mapper -> Response

**관리자 응답 흐름:**
1. UI -> `POST /api/admin/support/tickets/[id]/messages` (withRole admin)
2. API -> Service: 메시지 저장 + first_response_at 업데이트 + 상태 전이 (open -> in_progress)
3. Service -> Repository: DB INSERT/UPDATE (트랜잭션)
4. Service -> NotificationService: 사용자에게 알림 발송

## 3. UI/UX 설계

### 3.1 해결할 문제 (PRD 기반)

- **핵심 문제**: 사용자가 FAQ로 해결되지 않는 문제를 관리자에게 직접 문의할 공식 채널이 없음
- **핵심 니즈**: FAQ 검색 -> 미해결 시 티켓 생성 -> 관리자 응답 확인 -> 해결 확인
- **성공 기준**: 문의 이력 플랫폼 내 관리, SLA 준수율 측정 가능

### 3.2 정보 구조 (Information Architecture)

**핵심 정보 (반드시 표시):**
- 티켓 목록: 제목, 카테고리, 상태, 생성일시, 최근 메시지 요약
- 티켓 상세: 제목, 카테고리, 상태, 메시지 스레드
- 관리자 목록 추가: SLA 상태(정상/임박/위반), 사용자 정보

**부가 정보 (확장/상세 시 표시):**
- 티켓 상세: SLA 기한, 상태 변경 이력 (관리자만)
- 관리자 상세: 상태 변경 이력, 사용자 이메일/역할

**정보 그룹핑:**
- 사용자: 내 티켓 목록 (상태별 필터)
- 관리자: 전체 티켓 목록 (상태/카테고리/SLA 필터)

### 3.3 흐름(Flow) 설계

**사용자 메인 플로우:**
```
[문의하기 탭 진입] -> [내 티켓 목록] -> [새 문의 버튼] -> [FAQ 검색 화면]
   -> [해결 안 됨 버튼] -> [티켓 작성 폼] -> [제출] -> [티켓 상세]
```

**관리자 메인 플로우:**
```
[고객지원 메뉴 진입] -> [티켓 목록 (필터/정렬)] -> [티켓 클릭]
   -> [티켓 상세 + 메시지 스레드] -> [답변 작성] -> [상태 변경 (필요 시)]
```

**예외/이탈 루트:**
- FAQ에서 해결됨 -> 티켓 생성 없이 종료
- 티켓 생성 취소 -> 목록으로 복귀
- resolved 상태에서 추가 문의 -> 재오픈 후 메시지 작성
- closed 상태에서 추가 문의 -> 새 티켓 생성 유도

**단계 최소화:**
- 티켓 생성: 4회 이하 (진입 -> FAQ 검색 -> 미해결 -> 폼 작성 -> 제출)
- 관리자 응답: 3회 이하 (목록 -> 상세 -> 답변 작성)

### 3.4 레이아웃 및 시각적 위계

**레이아웃 선택 + 근거:**
- 목록 형태: **테이블** (데스크톱) / **카드 리스트** (모바일)
- 근거: 티켓 목록은 상태/카테고리/날짜 등 여러 컬럼 비교 필요, 관리자는 SLA 정보도 한눈에 확인

**시각적 위계 (중요도순):**
1. **Primary**: 새 문의 버튼, 답변 작성 버튼, 상태 변경 버튼
2. **Secondary**: 필터/검색, 재오픈 버튼
3. **Information**: 티켓 목록, 메시지 스레드

**영역 구분 (사용자 티켓 목록):**
```
┌─────────────────────────────────────────────────────────────┐
│  [헤더: 문의하기] + [새 문의 버튼]                            │
├─────────────────────────────────────────────────────────────┤
│  [필터 영역: 상태 탭 (전체/접수/처리중/해결/종료)]             │
├─────────────────────────────────────────────────────────────┤
│  [티켓 목록 영역]                                            │
│  - 제목 + 카테고리 + 상태 배지 + 생성일 + 최근 메시지          │
│  - 클릭 시 상세 페이지 이동                                  │
├─────────────────────────────────────────────────────────────┤
│  [페이지네이션]                                              │
└─────────────────────────────────────────────────────────────┘
```

**영역 구분 (사용자 티켓 상세):**
```
┌─────────────────────────────────────────────────────────────┐
│  [헤더: 티켓 제목] + [상태 배지] + [재오픈 버튼 (resolved)]   │
├─────────────────────────────────────────────────────────────┤
│  [티켓 정보: 카테고리, 생성일, 상태]                          │
├─────────────────────────────────────────────────────────────┤
│  [메시지 스레드 영역]                                        │
│  - 메시지 버블 (사용자: 우측, 관리자: 좌측)                   │
│  - 시간순 정렬 (오래된 순)                                   │
├─────────────────────────────────────────────────────────────┤
│  [메시지 입력 영역] (closed 상태면 비활성화)                  │
│  - 텍스트 입력 + 전송 버튼                                   │
└─────────────────────────────────────────────────────────────┘
```

**영역 구분 (관리자 티켓 목록):**
```
┌─────────────────────────────────────────────────────────────┐
│  [헤더: 고객지원]                                            │
├─────────────────────────────────────────────────────────────┤
│  [필터 영역]                                                 │
│  - 상태: 전체/접수/처리중/해결/종료                           │
│  - 카테고리: help_categories 드롭다운                        │
│  - SLA: 전체/정상/임박/위반                                  │
├─────────────────────────────────────────────────────────────┤
│  [티켓 테이블]                                               │
│  - 제목 | 카테고리 | 사용자 | 상태 | SLA 상태 | 생성일        │
│  - SLA 위반: 빨간색 배지, 임박: 노란색 배지                   │
├─────────────────────────────────────────────────────────────┤
│  [페이지네이션]                                              │
└─────────────────────────────────────────────────────────────┘
```

**영역 구분 (관리자 티켓 상세):**
```
┌─────────────────────────────────────────────────────────────┐
│  [헤더: 티켓 제목] + [상태 배지]                              │
├─────────────────────────────────────────────────────────────┤
│  [티켓 정보]                                                 │
│  - 카테고리, 사용자 정보, 생성일, SLA 기한                    │
│  - 상태 변경 버튼 (드롭다운: in_progress/resolved/closed)     │
├─────────────────────────────────────────────────────────────┤
│  [메시지 스레드 영역]                                        │
│  - 메시지 버블 (사용자: 좌측, 관리자: 우측)                   │
├─────────────────────────────────────────────────────────────┤
│  [메시지 입력 영역]                                          │
│  - 텍스트 입력 + 전송 버튼                                   │
├─────────────────────────────────────────────────────────────┤
│  [상태 변경 이력] (접기/펼치기)                               │
│  - 변경 시간 | 이전 상태 -> 새 상태 | 변경자 | 메모            │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 컴포넌트 구조

**사용자 페이지 구조:**
```
mypage/support/
├── page.tsx (티켓 목록)
├── [id]/
│   └── page.tsx (티켓 상세 + 메시지 스레드)
├── new/
│   └── page.tsx (티켓 생성 - FAQ 검색 + 폼)
└── components/
    ├── TicketListItem.tsx (티켓 목록 아이템)
    ├── TicketStatusBadge.tsx (상태 배지)
    ├── MessageThread.tsx (메시지 스레드)
    ├── MessageBubble.tsx (메시지 버블)
    ├── MessageInput.tsx (메시지 입력)
    ├── FAQSearch.tsx (FAQ 검색 + 미해결 버튼)
    └── TicketForm.tsx (티켓 생성 폼)
```

**관리자 페이지 구조:**
```
admin/support/
├── page.tsx (티켓 목록)
├── [id]/
│   └── page.tsx (티켓 상세 + 메시지 + 상태 변경)
└── components/
    ├── TicketTable.tsx (티켓 테이블)
    ├── TicketFilters.tsx (필터 UI)
    ├── SLAStatusBadge.tsx (SLA 상태 배지)
    ├── StatusChangeDropdown.tsx (상태 변경 드롭다운)
    └── StatusHistory.tsx (상태 변경 이력)
```

**컴포넌트 명명 규칙:**
- 형태 중립적: `TicketListItem`, `MessageThread`
- 상태 명시: `TicketStatusBadge`, `SLAStatusBadge`

**분리 기준:**
- page.tsx: 200줄 이하 (레이아웃 + 상태 조합)
- 복잡한 UI 로직: components/ 폴더로 분리
- partner/support는 mypage/support 컴포넌트 공유 가능 (import)

### 3.6 상태 및 피드백

| 상태 | UI 표현 |
|------|---------|
| 초기 (데이터 없음) | "아직 문의 내역이 없습니다. 새 문의를 시작해보세요." |
| 로딩 | 스켈레톤 (목록/상세) / 스피너 (버튼) |
| 빈 결과 | "검색 결과가 없습니다" + 필터 초기화 안내 |
| 에러 | 토스트 메시지 (전역 에러 핸들러) |
| 성공 | 토스트 ("문의가 접수되었습니다", "답변이 전송되었습니다") |

**UX 편의 기능:**
- 엔터키 전송: 예 (Shift+Enter 줄바꿈)
- 상태 필터: 탭 UI (사용자), 드롭다운 (관리자)
- 키보드 단축키: 없음

### 3.7 상태 관리

- **서버 상태**: React Query
  - 쿼리 키: `["support", "tickets"]`, `["support", "tickets", id]`, `["admin", "support", "tickets"]`
  - mutation: `createTicket`, `sendMessage`, `changeStatus`, `reopenTicket`
- **클라이언트 상태**: 불필요 (React Query로 충분)
- **URL 상태**: nuqs
  - 사용자: `status` (필터)
  - 관리자: `status`, `categoryId`, `slaStatus`, `page`, `pageSize`

### 3.8 API Client

**사용자용 (`app/src/api-client/support.ts`):**
- `fetchMyTickets(query)`: 내 티켓 목록
- `fetchTicketDetail(id)`: 티켓 상세
- `createTicket(body)`: 티켓 생성
- `sendMessage(ticketId, content)`: 메시지 발송
- `markMessagesAsRead(ticketId)`: 읽음 표시
- `reopenTicket(ticketId)`: 티켓 재오픈

**관리자용 (`app/src/api-client/admin.ts` 확장):**
- `fetchAdminTickets(query)`: 관리자 티켓 목록
- `fetchAdminTicketDetail(id)`: 관리자 티켓 상세
- `sendAdminMessage(ticketId, content)`: 관리자 메시지 발송
- `changeTicketStatus(ticketId, status, note?)`: 상태 변경

## 4. 데이터 모델

### 4.1 support_ticket_status (Enum)

```sql
create type public.support_ticket_status as enum (
    'open',        -- 접수됨
    'in_progress', -- 처리중
    'resolved',    -- 해결됨
    'closed'       -- 종료됨
);
```

### 4.2 support_tickets

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 티켓 ID |
| user_id | uuid | FK -> profiles(id), NOT NULL | 티켓 생성자 |
| category_id | uuid | FK -> help_categories(id), NOT NULL | FAQ 카테고리 |
| title | text | NOT NULL | 제목 |
| content | text | NOT NULL | 본문 (최초 메시지) |
| status | support_ticket_status | NOT NULL, default 'open' | 현재 상태 |
| first_response_at | timestamptz | NULL | 최초 응답 시각 |
| resolved_at | timestamptz | NULL | 해결 시각 |
| sla_first_response_due | timestamptz | NOT NULL | 최초 응답 SLA 기한 (created_at + 24h) |
| sla_resolution_due | timestamptz | NOT NULL | 해결 SLA 기한 (created_at + 72h) |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |

- 인덱스:
  - `idx_support_tickets_user_id` (user_id)
  - `idx_support_tickets_status` (status)
  - `idx_support_tickets_category_id` (category_id)
  - `idx_support_tickets_sla_first_response_due` (sla_first_response_due) WHERE status = 'open'
  - `idx_support_tickets_sla_resolution_due` (sla_resolution_due) WHERE status IN ('open', 'in_progress')

### 4.3 support_ticket_messages

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 메시지 ID |
| ticket_id | uuid | FK -> support_tickets(id) ON DELETE CASCADE, NOT NULL | 티켓 ID |
| sender_id | uuid | FK -> profiles(id), NOT NULL | 발신자 ID |
| content | text | NOT NULL | 메시지 내용 |
| is_admin | boolean | NOT NULL, default false | 관리자 발신 여부 |
| read_at | timestamptz | NULL | 읽음 시각 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |

- 인덱스:
  - `idx_support_ticket_messages_ticket_id_created_at` (ticket_id, created_at ASC)
  - `idx_support_ticket_messages_sender_id` (sender_id)

### 4.4 support_ticket_status_history

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 이력 ID |
| ticket_id | uuid | FK -> support_tickets(id) ON DELETE CASCADE, NOT NULL | 티켓 ID |
| from_status | support_ticket_status | NULL | 이전 상태 (최초 생성 시 NULL) |
| to_status | support_ticket_status | NOT NULL | 변경된 상태 |
| changed_by | uuid | FK -> profiles(id), NOT NULL | 변경자 ID |
| note | text | NULL | 변경 사유 (선택) |
| created_at | timestamptz | NOT NULL, default now() | 변경 시각 |

- 인덱스:
  - `idx_support_ticket_status_history_ticket_id` (ticket_id)

### 4.5 notification_type 확장

기존 `notification_type` enum에 다음 값 추가:
- `support_ticket_created`: 티켓 생성 시 관리자에게 발송
- `support_ticket_response`: 응답 수신 시 상대방에게 발송
- `support_ticket_resolved`: 티켓 해결 시 사용자에게 발송

- 마이그레이션: `app/supabase/migrations/YYYYMMDDHHMMSS_support_helpdesk.sql`
- 롤백(down) 전략: 테이블 DROP + enum 값 삭제 (ALTER TYPE ... DROP VALUE는 PostgreSQL에서 직접 지원하지 않으므로 테이블 데이터 먼저 삭제 필요)

### 4.6 RLS 정책

**support_tickets:**
- SELECT: `user_id = auth.uid() OR public.is_admin()`
- INSERT: `user_id = auth.uid()` (본인만 티켓 생성)
- UPDATE: `public.is_admin()` (관리자만 상태 변경)

**support_ticket_messages:**
- SELECT: `EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.is_admin()))`
- INSERT:
  - 사용자: `EXISTS (...) AND sender_id = auth.uid() AND is_admin = false`
  - 관리자: `public.is_admin() AND is_admin = true`
- UPDATE: `sender_id != auth.uid()` (읽음 표시용, 본인 메시지 제외)

**support_ticket_status_history:**
- SELECT: `public.is_admin()`
- INSERT: `public.is_admin()` (시스템/관리자만)

## 5. API 설계

### 5.1 사용자 API

#### POST /api/support/tickets

- 권한: `withAuth` (doctor 또는 vendor)
- 요청 스키마: `SupportTicketCreateBodySchema`
  ```
  {
    categoryId: zUuid,
    title: zNonEmptyString.max(100),
    content: zNonEmptyString.max(2000)
  }
  ```
- 응답 스키마: `SupportTicketDetailResponseSchema`
  - 201 Created: 티켓 상세 반환
  - 400 Bad Request: Zod 검증 실패
  - 429 Too Many Requests: Rate limit 초과 (1인당 일 5건)

#### GET /api/support/tickets

- 권한: `withAuth`
- 쿼리 스키마: `SupportTicketListQuerySchema`
  ```
  {
    status?: TicketStatusSchema, // open | in_progress | resolved | closed
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20)
  }
  ```
- 응답 스키마: `SupportTicketListResponseSchema`
  - 200 OK: `{ items: [...], page, pageSize, total }`
- 정렬: `created_at DESC` (최신순)

#### GET /api/support/tickets/[id]

- 권한: `withAuth` + 본인 티켓만
- 응답 스키마: `SupportTicketDetailResponseSchema`
  ```
  {
    ticket: SupportTicketViewSchema,
    messages: SupportTicketMessageViewSchema[]
  }
  ```
  - 200 OK: 티켓 상세 + 메시지 목록
  - 404 Not Found: 티켓 없음 또는 권한 없음

#### POST /api/support/tickets/[id]/messages

- 권한: `withAuth` + 본인 티켓만 + closed 상태 불가
- 요청 스키마: `SupportMessageCreateBodySchema`
  ```
  {
    content: zNonEmptyString.max(2000)
  }
  ```
- 응답 스키마: `SupportMessageCreateResponseSchema`
  - 201 Created: 생성된 메시지 반환
  - 400 Bad Request: closed 상태에서 메시지 작성 시도
  - 404 Not Found: 티켓 없음 또는 권한 없음

#### PATCH /api/support/tickets/[id]/messages/read

- 권한: `withAuth` + 본인 티켓만
- 요청 스키마: 없음 (본인이 받은 메시지 전체 읽음 처리)
- 응답 스키마: `{ code: "OK", data: { count: number } }`
  - 200 OK: 읽음 처리된 메시지 수

#### POST /api/support/tickets/[id]/reopen

- 권한: `withAuth` + 본인 티켓만 + resolved 상태만
- 요청 스키마: 없음
- 응답 스키마: `SupportTicketDetailResponseSchema`
  - 200 OK: 재오픈된 티켓
  - 400 Bad Request: resolved 상태가 아님

### 5.2 관리자 API

#### GET /api/admin/support/tickets

- 권한: `withRole(["admin"])`
- 쿼리 스키마: `AdminSupportTicketListQuerySchema`
  ```
  {
    status?: TicketStatusSchema,
    categoryId?: zUuid,
    slaStatus?: z.enum(["normal", "warning", "violated"]),
    q?: z.string().trim().min(1), // 제목/사용자명 검색
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20)
  }
  ```
- 응답 스키마: `AdminSupportTicketListResponseSchema`
  - 200 OK: `{ items: [...], page, pageSize, total }`
- 정렬: `created_at DESC` (기본), SLA 위반 건은 상단 노출 옵션

#### GET /api/admin/support/tickets/[id]

- 권한: `withRole(["admin"])`
- 응답 스키마: `AdminSupportTicketDetailResponseSchema`
  ```
  {
    ticket: AdminSupportTicketViewSchema,
    messages: SupportTicketMessageViewSchema[],
    statusHistory: SupportTicketStatusHistoryViewSchema[]
  }
  ```
  - 200 OK: 티켓 상세 + 메시지 + 상태 이력
  - 404 Not Found: 티켓 없음

#### PATCH /api/admin/support/tickets/[id]/status

- 권한: `withRole(["admin"])`
- 요청 스키마: `AdminTicketStatusChangeBodySchema`
  ```
  {
    status: z.enum(["in_progress", "resolved", "closed"]),
    note?: z.string().max(500)
  }
  ```
- 응답 스키마: `AdminSupportTicketDetailResponseSchema`
  - 200 OK: 변경된 티켓 상세
  - 400 Bad Request: 잘못된 상태 전이 (예: closed -> open)

#### POST /api/admin/support/tickets/[id]/messages

- 권한: `withRole(["admin"])`
- 요청 스키마: `SupportMessageCreateBodySchema`
  ```
  {
    content: zNonEmptyString.max(2000)
  }
  ```
- 응답 스키마: `SupportMessageCreateResponseSchema`
  - 201 Created: 생성된 메시지 반환
- 부수 효과:
  - 첫 응답 시: `first_response_at` 업데이트
  - open 상태면: `status` -> `in_progress` 자동 전이 + 이력 기록

## 6. 서비스/도메인 계층

### 6.1 SupportService (`app/src/server/support/service.ts`)

- `createTicket(supabase, userId, body)` -> `SupportTicketView`
  - 티켓 생성 + 초기 메시지 저장 + 상태 이력 기록 (open)
  - SLA 기한 설정: `sla_first_response_due = created_at + 24h`, `sla_resolution_due = created_at + 72h`
  - Rate limit 체크: 동일 사용자 당일 5건 초과 시 `badRequest`
  - 알림 발송: 관리자에게 `support_ticket_created`
  - 트랜잭션: 티켓 + 메시지 + 이력 원자성 보장

- `getMyTickets(supabase, userId, query)` -> `{ items, page, pageSize, total }`
  - 본인 티켓 목록 조회 (상태 필터, 페이지네이션)

- `getTicketDetail(supabase, userId, ticketId)` -> `{ ticket, messages }`
  - 본인 티켓 상세 + 메시지 조회
  - 권한 체크: `ticket.user_id === userId`

- `sendUserMessage(supabase, userId, ticketId, content)` -> `SupportMessageView`
  - 사용자 메시지 발송
  - closed 상태면 `badRequest`
  - 알림 발송: 관리자에게 `support_ticket_response`

- `markMessagesAsRead(supabase, userId, ticketId)` -> `number`
  - 상대방(관리자) 메시지 일괄 읽음 처리

- `reopenTicket(supabase, userId, ticketId)` -> `SupportTicketView`
  - resolved -> open 상태 전이 + 이력 기록
  - 권한 체크 + 상태 체크

### 6.2 AdminSupportService (`app/src/server/support/service.ts`)

- `getAdminTickets(supabase, query)` -> `{ items, page, pageSize, total }`
  - 전체 티켓 목록 조회 (필터: 상태, 카테고리, SLA 상태, 검색어)
  - SLA 상태 계산:
    - `normal`: SLA 기한 내
    - `warning`: SLA 기한 4시간 이내
    - `violated`: SLA 기한 초과

- `getAdminTicketDetail(supabase, ticketId)` -> `{ ticket, messages, statusHistory }`
  - 관리자용 티켓 상세 + 메시지 + 상태 이력

- `changeTicketStatus(supabase, adminId, ticketId, status, note?)` -> `AdminSupportTicketView`
  - 상태 변경 + 이력 기록
  - resolved로 변경 시: `resolved_at` 업데이트
  - 알림 발송: 사용자에게 `support_ticket_resolved` (resolved일 때)
  - 트랜잭션: 상태 변경 + 이력 원자성 보장

- `sendAdminMessage(supabase, adminId, ticketId, content)` -> `SupportMessageView`
  - 관리자 메시지 발송 (`is_admin = true`)
  - 첫 응답 시: `first_response_at` 업데이트
  - open 상태면: `in_progress`로 자동 전이 + 이력 기록
  - 알림 발송: 사용자에게 `support_ticket_response`
  - 트랜잭션: 메시지 + 상태 변경 + 이력 원자성 보장

### 6.3 SupportNotificationService (`app/src/server/support/notification.ts`)

기존 `notification-service.ts` 패턴 재사용:

- `sendTicketCreatedNotification(ticket)` -> 관리자에게 이메일/카카오
- `sendTicketResponseNotification(ticket, message, isAdmin)` -> 상대방에게 이메일/카카오
- `sendTicketResolvedNotification(ticket)` -> 사용자에게 이메일/카카오

## 7. 테스트 전략

| 구분 | 시나리오 | 도구 |
| --- | --- | --- |
| 단위 | SLA 계산 로직, 상태 전이 검증 | Vitest |
| 통합 | 티켓 생성 -> 메시지 -> 상태 변경 흐름 | Supertest |
| UI | 티켓 목록/상세 렌더링, 메시지 전송 | Playwright (선택) |

### 검증 명령

```bash
pnpm lint
pnpm type-check
pnpm db:gen  # 마이그레이션 후 타입 생성
```

## 8. 운영/배포

- 마이그레이션 적용 순서:
  1. 마이그레이션 실행: `pnpm db:migrate`
  2. 타입 생성: `pnpm db:gen`
  3. 백엔드 코드 배포
  4. 프론트엔드 코드 배포

- 롤백 절차:
  1. 프론트엔드 이전 버전 배포
  2. 백엔드 이전 버전 배포
  3. 마이그레이션 롤백 (테이블 DROP - 데이터 손실 주의)

- 기능 플래그: 없음 (1차 릴리스에서 전체 공개)

## 9. 백로그

- [ ] 첨부파일 지원
- [ ] 만족도 평가 (티켓 종료 시 별점/피드백)
- [ ] 담당자 배정 시스템
- [ ] 우선순위별 SLA (긴급/일반)
- [ ] 영업시간 기반 SLA 계산
- [ ] 자동 응답 템플릿
- [ ] 티켓 병합 기능
- [ ] 고객지원 통계 대시보드
- [ ] resolved 상태에서 7일 후 자동 closed 전환

## 10. Progress Log (append-only)

### [2026-01-31T14:00:00Z] schema-implementer

**완료 태스크**: SCHEMA-1, SCHEMA-2, SCHEMA-3
**생성/수정 파일**:
- `app/supabase/migrations/20260131140000_support_helpdesk.sql` (CREATE)
- `app/src/lib/schema/support.ts` (CREATE)
- `app/src/lib/schema/notification.ts` (UPDATE)
- `app/src/lib/database.types.ts` (UPDATE - db:gen)

**검증 결과**: type-check PASS, db:gen PASS
**다음**: backend-implementer, frontend-implementer 실행 가능

**상세**:
- SCHEMA-1: 마이그레이션 생성
  - `support_ticket_status` enum (open, in_progress, resolved, closed)
  - `support_tickets` 테이블 + RLS (SELECT: 본인/관리자, INSERT: 본인, UPDATE: 관리자)
  - `support_ticket_messages` 테이블 + RLS (SELECT: 티켓 참여자, INSERT: 사용자/관리자 분리, UPDATE: 읽음 표시)
  - `support_ticket_status_history` 테이블 + RLS (관리자만)
  - `notification_type` enum에 support_ticket_created, support_ticket_response, support_ticket_resolved 추가
  - 인덱스: user_id, status, category_id, SLA 관련 partial index
- SCHEMA-2: Zod 스키마 생성
  - Enum: `SupportTicketStatusSchema`, `SlaStatusSchema`
  - View: `SupportTicketViewSchema`, `SupportTicketListItemSchema`, `AdminSupportTicketViewSchema`, `AdminSupportTicketListItemSchema`, `SupportTicketMessageViewSchema`, `SupportTicketStatusHistoryViewSchema`
  - Body: `SupportTicketCreateBodySchema`, `SupportMessageCreateBodySchema`, `AdminTicketStatusChangeBodySchema`
  - Query: `SupportTicketListQuerySchema`, `AdminSupportTicketListQuerySchema`
  - Response: 목록/상세/생성/메시지 응답 스키마 (사용자/관리자 분리)
- SCHEMA-3: notification.ts 업데이트
  - `NotificationTypeSchema`에 support 관련 3개 타입 추가

### [2026-01-31T14:30:00Z] backend-implementer

**완료 태스크**: BACKEND-1, BACKEND-2, BACKEND-3, BACKEND-4, BACKEND-5, BACKEND-6, BACKEND-7, BACKEND-8, BACKEND-9, BACKEND-10, BACKEND-11, BACKEND-12
**생성/수정 파일**:
- `app/src/server/support/repository.ts` (CREATE)
- `app/src/server/support/mapper.ts` (CREATE)
- `app/src/server/support/service.ts` (CREATE)
- `app/src/app/api/support/tickets/route.ts` (CREATE)
- `app/src/app/api/support/tickets/[id]/route.ts` (CREATE)
- `app/src/app/api/support/tickets/[id]/messages/route.ts` (CREATE)
- `app/src/app/api/support/tickets/[id]/messages/read/route.ts` (CREATE)
- `app/src/app/api/support/tickets/[id]/reopen/route.ts` (CREATE)
- `app/src/app/api/admin/support/tickets/route.ts` (CREATE)
- `app/src/app/api/admin/support/tickets/[id]/route.ts` (CREATE)
- `app/src/app/api/admin/support/tickets/[id]/status/route.ts` (CREATE)
- `app/src/app/api/admin/support/tickets/[id]/messages/route.ts` (CREATE)

**검증 결과**: type-check PASS
**다음**: frontend-implementer 실행 가능

**상세**:
- BACKEND-1: Repository 생성
  - 티켓 CRUD (insertTicket, fetchTicketById, fetchUserTickets, fetchAdminTickets, updateTicketStatus)
  - 메시지 CRUD (fetchTicketMessages, insertMessage, markMessagesAsRead, getUnreadCount, getLastMessagePreview)
  - 상태 이력 (insertStatusHistory, fetchStatusHistory)
  - Rate limit 체크 (일일 5건)
- BACKEND-2: Mapper 생성
  - SLA 상태 계산 함수 (calculateSlaStatus)
  - 티켓 뷰 매퍼 (mapTicketToView, mapTicketToListItem, mapTicketToAdminView, mapTicketToAdminListItem)
  - 메시지 뷰 매퍼 (mapMessageToView)
  - 상태 이력 뷰 매퍼 (mapStatusHistoryToView)
- BACKEND-3: Service 생성
  - 사용자 서비스: createTicket, getMyTickets, getTicketDetail, sendUserMessage, markMessagesAsRead, reopenTicket
  - 관리자 서비스: getAdminTickets, getAdminTicketDetail, changeTicketStatus, sendAdminMessage
  - 알림 발송: sendTicketCreatedNotification, sendTicketResponseNotification, sendTicketResolvedNotification
- BACKEND-4~12: API Routes 생성
  - 사용자: POST/GET /api/support/tickets, GET /api/support/tickets/[id], POST /api/support/tickets/[id]/messages, PATCH /api/support/tickets/[id]/messages/read, POST /api/support/tickets/[id]/reopen
  - 관리자: GET /api/admin/support/tickets, GET /api/admin/support/tickets/[id], PATCH /api/admin/support/tickets/[id]/status, POST /api/admin/support/tickets/[id]/messages
  - Query: `SupportTicketListQuerySchema`, `AdminSupportTicketListQuerySchema`
  - Response: 목록/상세/생성/메시지 응답 스키마 (사용자/관리자 분리)
- SCHEMA-3: notification.ts 업데이트
  - `NotificationTypeSchema`에 support 관련 3개 타입 추가
