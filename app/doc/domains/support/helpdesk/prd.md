# 고객지원 헬프데스크 PRD

> 참조: `app/src/server/lead/message-service.ts:1`, `app/src/lib/schema/help-center.ts:1`, `app/src/server/notification/service.ts:1`
> 본 문서는 기존 리드 메시지 시스템, 신고/제재 시스템, FAQ/헬프센터 시스템을 기반으로 고객지원 헬프데스크 기능을 정의한다.

## 1. 배경 및 문제 정의

현재 플랫폼에는 의사/업체가 관리자에게 직접 문의할 수 있는 공식 채널이 없다. 사용자들은 FAQ만으로 해결되지 않는 문제가 발생할 때 외부 채널(이메일, 전화 등)에 의존해야 하며, 이로 인해 다음 문제가 발생한다:

- 문의 이력이 플랫폼 외부에 분산되어 추적 불가
- 문의 처리 현황 파악 어려움으로 사용자 불만 증가
- 응답 시간(SLA) 관리 및 고객지원 품질 측정 불가
- FAQ와 1:1 문의가 연동되지 않아 반복 문의 발생

기존 FAQ 시스템(`help_categories`, `help_articles`)은 정보 제공만 지원하며, 해결되지 않는 문제에 대한 에스컬레이션 경로가 없다. (근거: `app/doc/domains/support/helpdesk/exploration.md:191-194`)

## 2. 목표 (Goals)

1. **1:1 문의 티켓 시스템** - 의사/업체 모두 관리자에게 1:1 문의 티켓을 생성할 수 있는 공식 채널 제공
2. **메시지 스레드 기반 소통** - 사용자와 관리자가 티켓별로 여러 번 메시지를 주고받을 수 있는 대화형 지원 구현
3. **FAQ 카테고리 연동** - 기존 `help_categories` 테이블을 재사용하여 티켓 분류 및 FAQ 검색 유도
4. **FAQ 검색 유도** - 티켓 생성 전 FAQ 검색을 유도하여 셀프 서비스 해결률 향상
5. **고정 SLA 정책** - 24시간 내 최초 응답, 72시간 내 해결 목표로 응답 품질 관리
6. **4단계 티켓 상태 관리** - open -> in_progress -> resolved/closed 상태 전이로 처리 현황 가시화
7. **상태 변경 이력 관리** - 모든 상태 변경을 이력 테이블에 기록하여 SLA 분석 및 책임 추적 가능
8. **다채널 알림** - 이메일 + 카카오톡 알림으로 티켓 생성/응답/해결 시 적시 안내

## 3. 비범위 (Non-Goals)

- 우선순위별 SLA (단일 SLA로 시작, 후속 단계에서 긴급/일반 분류 가능)
- 담당자 배정 시스템 (모든 관리자가 모든 티켓 처리 가능, 후속 단계로 미룸)
- 자동 응답 봇/AI 챗봇 (후속 단계로 미룸)
- 첨부파일 지원 (후속 단계로 미룸)
- 만족도 평가 (후속 단계로 미룸)
- 실시간 웹소켓 (폴링/리프레시 기반으로 구현)

## 4. 주요 사용자 및 시나리오

| 사용자 | 시나리오 | 기대 결과 |
|--------|----------|-----------|
| 의사 | FAQ에서 해결되지 않는 문제가 있어 1:1 문의를 남긴다 | 티켓이 생성되고 관리자에게 알림이 발송된다 |
| 업체 | 정산 관련 문의를 위해 티켓을 생성하고 카테고리를 선택한다 | 적절한 카테고리로 분류된 티켓이 생성된다 |
| 의사/업체 | 관리자의 답변에 추가 질문을 남긴다 | 메시지가 스레드에 추가되고 관리자에게 알림이 발송된다 |
| 의사/업체 | 내 문의 내역과 처리 상태를 확인한다 | 티켓 목록에서 상태(접수/처리중/해결)를 확인할 수 있다 |
| 관리자 | 접수된 티켓 목록을 조회하고 SLA 위반 여부를 확인한다 | SLA 상태(정상/임박/위반)가 표시된 티켓 목록을 확인한다 |
| 관리자 | 티켓을 열어 사용자 문의에 답변한다 | 답변이 전송되고 사용자에게 알림이 발송된다 |
| 관리자 | 문제가 해결되어 티켓을 종료한다 | 티켓 상태가 resolved로 변경되고 사용자에게 알림이 발송된다 |
| 시스템 | 상태가 변경될 때마다 이력을 기록한다 | 상태 변경 이력 테이블에 변경 사유와 담당자가 기록된다 |

## 5. 기능 요구사항

### 5.1 티켓 생성

- 의사/업체 모두 티켓 생성 가능
- 티켓 생성 시 필수 입력: 카테고리(help_categories 연동), 제목, 본문
- 티켓 생성 전 FAQ 검색 화면 노출 (검색 후 "해결되지 않았어요" 버튼으로 티켓 생성 진입)
- 티켓 생성 시 SLA 기한 자동 설정
  - `sla_first_response_due`: 생성 시점 + 24시간
  - `sla_resolution_due`: 생성 시점 + 72시간
- 생성 시 초기 상태: `open`

### 5.2 메시지 스레드

- 사용자(의사/업체)와 관리자가 티켓 내에서 메시지를 주고받을 수 있음
- 메시지 작성자 구분: `is_admin` 플래그로 관리자 여부 표시
- 메시지별 읽음 표시(`read_at`) 지원
- 메시지 수정/삭제 불가 (감사 추적성 보장)
- 기존 리드 메시지 패턴 재사용
  - 근거: `app/src/server/lead/message-service.ts:1`, `app/src/app/(main)/mypage/leads/[id]/components/MessagesTab.tsx:1`

### 5.3 티켓 상태 관리

- 4단계 상태 전이
  - `open`: 접수됨 (사용자가 티켓 생성)
  - `in_progress`: 처리중 (관리자가 첫 응답 작성 시 자동 전환 또는 수동 변경)
  - `resolved`: 해결됨 (관리자가 해결 처리)
  - `closed`: 종료됨 (사용자가 해결 확인 또는 일정 기간 후 자동 종료)
- 관리자 첫 응답 시 `first_response_at` 기록 및 상태 자동 전환(open -> in_progress)
- 해결 처리 시 `resolved_at` 기록
- 사용자는 `resolved` 상태 티켓을 재오픈(-> open) 가능

### 5.4 상태 변경 이력

- 모든 상태 변경은 `support_ticket_status_history` 테이블에 기록
- 기록 항목: ticket_id, from_status, to_status, changed_by(user_id), note(선택), created_at
- SLA 분석 및 책임 추적에 활용
  - 근거: 신고 시스템 상태 전이 패턴 (`app/doc/domains/admin/report-sanction/exploration.md:97-105`)

### 5.5 SLA 관리

- 고정 SLA 정책
  - 최초 응답: 24시간 이내
  - 해결: 72시간 이내
- 티켓 목록에서 SLA 상태 표시
  - 정상: SLA 기한 내
  - 임박: SLA 기한 4시간 이내
  - 위반: SLA 기한 초과
- SLA 위반 시 별도 알림 없음 (관리자 목록에서 필터/정렬로 확인)

### 5.6 FAQ 연동

- 기존 `help_categories` 테이블 재사용하여 티켓 분류
  - 근거: `app/supabase/migrations/20260130011528_help_center.sql:1`
- 티켓 생성 전 FAQ 검색 화면 제공
  - 카테고리 선택 -> 해당 카테고리 FAQ 목록 표시 -> 검색 -> 해결 안 됨 -> 티켓 생성
- FAQ 검색은 기존 `/api/help/articles` API 활용
  - 근거: `app/src/app/api/help/articles/route.ts:1`

### 5.7 알림

- 기존 통합 메시징 서비스 활용
  - 근거: `app/src/server/notification/service.ts:1`
- 신규 알림 타입 추가
  - `support_ticket_created`: 티켓 생성 시 관리자에게 발송
  - `support_ticket_response`: 응답 수신 시 상대방에게 발송 (사용자 응답 -> 관리자, 관리자 응답 -> 사용자)
  - `support_ticket_resolved`: 티켓 해결 시 사용자에게 발송
- 발송 채널: 이메일 + 카카오톡 알림톡
- 사용자별 알림 설정(`notification_settings`) 존중

### 5.8 UI 진입점 (상세 설계는 TSD)

- **경로**:
  - 의사: `/mypage/support`
  - 업체: `/partner/support`
  - 관리자: `/admin/support`
- **진입점**:
  - 의사/업체: 마이페이지/파트너센터 탭 네비게이션에 '문의하기' 탭 추가
    - 근거: `app/src/app/(main)/mypage/layout.tsx:1`, `app/src/app/(main)/partner/layout.tsx:1`
  - 관리자: 관리자 사이드바에 '고객지원' 메뉴 추가
    - 근거: `app/src/app/(main)/admin/layout.tsx:1`
- **주요 화면**:
  - 사용자: 내 티켓 목록 + FAQ 검색 + 티켓 생성 + 티켓 상세(메시지 스레드)
  - 관리자: 전체 티켓 목록(필터/정렬) + 티켓 상세(메시지 스레드/상태 변경)
- **레퍼런스**: 리드 메시지 UI 패턴, 신고 관리 UI 패턴 참조

### 5.9 API / 데이터

- 필요한 API 엔드포인트:
  - `POST /api/support/tickets` - 티켓 생성
  - `GET /api/support/tickets` - 내 티켓 목록 조회
  - `GET /api/support/tickets/[id]` - 티켓 상세 조회
  - `POST /api/support/tickets/[id]/messages` - 메시지 발송
  - `PATCH /api/support/tickets/[id]/messages/read` - 읽음 표시 (bulk)
  - `GET /api/admin/support/tickets` - 관리자 티켓 목록 조회 (필터: 상태, 카테고리, SLA 상태)
  - `GET /api/admin/support/tickets/[id]` - 관리자 티켓 상세 조회 (상태 이력 포함)
  - `PATCH /api/admin/support/tickets/[id]/status` - 티켓 상태 변경
- 신규 테이블:
  - `support_tickets` - 티켓 정보
  - `support_ticket_messages` - 티켓 메시지
  - `support_ticket_status_history` - 상태 변경 이력

### 5.10 권한/보안

- 사용자 API:
  - 티켓 생성: 로그인 사용자(의사/업체)
  - 티켓 조회: 본인 티켓만
  - 메시지 작성: 본인 티켓만
- 관리자 API:
  - 모든 API에 `withRole(["admin"])` 가드 적용
    - 근거: `app/src/server/auth/guards.ts:1`
- RLS 정책:
  - `support_tickets` 테이블
    - SELECT: `user_id = auth.uid()` OR `is_admin()`
    - INSERT: `user_id = auth.uid()`
    - UPDATE: `is_admin()` (상태 변경)
  - `support_ticket_messages` 테이블
    - SELECT: 참여자 조건 OR `is_admin()`
    - INSERT: 참여자 조건 (사용자는 본인 티켓, 관리자는 전체)
    - UPDATE: 읽음 표시만 (`sender_id != auth.uid()`)
  - `support_ticket_status_history` 테이블
    - SELECT: `is_admin()`
    - INSERT: `is_admin()` (시스템/관리자만)

## 6. 비기능 요구사항 (NFR)

- 성능/응답성:
  - (API) 티켓 목록 조회 p95 응답 시간: 300ms 이하
  - (목록 API) 페이지네이션: `page`, `pageSize` (기본 20, 최대 50), 정렬 키: `created_at` DESC (최신순)
  - (프론트) 검색 트리거: 버튼/Enter submit (입력 즉시 검색 금지)
  - (데이터 규모 가정) 예상 티켓 수: 월 50~200건, 최대 연간 5,000건
  - (데이터 규모 가정) 티켓당 예상 메시지 수: 5~20개 (최대 100개 가정)
- 안정성/복구:
  - 알림 발송 실패 시 기존 재시도 로직 활용 (Exponential backoff, 최대 3회)
  - 메시지 발송은 DB 저장 후 알림 발송 (알림 실패해도 메시지는 저장됨)
  - 상태 변경 + 메시지 저장 + 이력 기록은 트랜잭션으로 원자성 보장
- 관측(로그/감사/지표):
  - 감사 로그 필수: `support_ticket.create`, `support_ticket.status_change`, `support_ticket.resolve`
  - 장애 분석을 위한 로그 키: `ticket_id`, `user_id`, `category_id`, `status`

## 7. 엣지 케이스

- 이미 resolved/closed 상태 티켓에 사용자가 메시지 작성 시도 -> resolved 상태는 재오픈(open) 후 작성 가능, closed 상태는 작성 불가
- 관리자가 없는 시간(공휴일/야간)에 티켓 생성 -> SLA는 영업일 기준이 아닌 절대 시간 기준 (1차 릴리스)
- 동일 사용자가 동일 카테고리로 동일 내용 중복 티켓 생성 -> 중복 체크 없음 (관리자가 수동으로 병합/종료)
- 티켓 생성 직후 사용자가 탈퇴 -> 티켓은 유지되나 응답 불가 상태로 관리자가 종료 처리
- SLA 기한 직전에 응답 후 다시 사용자 응답 대기 -> SLA는 최초 응답/해결 기준, 이후 응답은 SLA 대상 아님

## 8. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 스팸/도배 티켓 | 관리자 업무 과부하 | Rate limiting 적용 (1인당 일 5건 제한) |
| SLA 위반 누적 | 고객 불만 증가 | 관리자 목록에 SLA 위반 필터/정렬 제공, 위반 건 상단 노출 |
| 관리자 부재 시 응답 지연 | SLA 위반, 고객 불만 | 1차 릴리스는 단일 SLA로 운영, 후속에서 영업시간 기반 SLA 고려 |
| FAQ와 티켓 카테고리 불일치 | 분류 혼란 | help_categories 테이블 재사용으로 일관성 유지 |

## 9. 롤아웃 / 백로그

1. 1차 릴리스 범위
   - `support_tickets`, `support_ticket_messages`, `support_ticket_status_history` 테이블 생성 및 RLS 정책
   - 사용자 UI (`/mypage/support`, `/partner/support`)
     - 내 티켓 목록, 티켓 생성(FAQ 검색 연동), 티켓 상세(메시지 스레드)
   - 관리자 UI (`/admin/support`)
     - 전체 티켓 목록(필터/정렬), 티켓 상세(메시지 스레드/상태 변경)
   - 이메일 + 카카오톡 알림
   - 고정 SLA (24h/72h)

2. 후속 백로그 항목
   - [ ] 첨부파일 지원
   - [ ] 만족도 평가 (티켓 종료 시 별점/피드백)
   - [ ] 담당자 배정 시스템
   - [ ] 우선순위별 SLA (긴급/일반)
   - [ ] 영업시간 기반 SLA 계산
   - [ ] 자동 응답 템플릿
   - [ ] 티켓 병합 기능
   - [ ] 고객지원 통계 대시보드

## 10. 오픈 이슈 / 결정 필요

- [ ] (선택) resolved 상태에서 일정 기간(7일) 후 자동 closed 전환 여부 - 1차는 수동 종료만
- [ ] (선택) 관리자별 티켓 할당/담당자 표시 여부 - 1차는 미구현, 후속에서 검토
- [ ] (선택) SLA 기준을 영업시간으로 변경할지 - 1차는 절대 시간 기준
