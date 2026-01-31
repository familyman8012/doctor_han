# 감사 로그/변경 기록 시스템 재정비 TSD

> 기반 문서: `app/doc/domains/audit/logs/prd.md:1`
> 참고 코드: `app/src/server/report/service.ts:27-36`, `app/supabase/migrations/20251218190000_p0_schema.sql:99-107,575-586`

## 0. 변경 요약 (파일 단위)

| 파일 | 변경 | 변경 내용 요약 |
| --- | --- | --- |
| `app/supabase/migrations/20260131200000_audit_logs_index_rls.sql` | CREATE | audit_logs 인덱스 5개 추가, RLS 정책 수정 |
| `app/src/lib/schema/audit.ts` | CREATE | 감사 로그 조회 스키마 신규 |
| `app/src/server/audit/utils.ts` | CREATE | safeInsertAuditLog 공통 함수 |
| `app/src/server/audit/service.ts` | CREATE | 감사 로그 목록 조회 서비스 |
| `app/src/server/audit/mapper.ts` | CREATE | 감사 로그 DTO 매핑 |
| `app/src/server/report/service.ts` | UPDATE | safeInsertAuditLog를 audit/utils에서 import |
| `app/src/app/api/admin/audit-logs/route.ts` | CREATE | 감사 로그 목록 조회 API |
| `app/src/app/api/profile/route.ts` | UPDATE | profile.create, profile.update 감사 로그 삽입 |
| `app/src/app/api/vendors/me/route.ts` | UPDATE | vendor.create, vendor.update 감사 로그 삽입 |
| `app/src/app/api/files/signed-download/route.ts` | UPDATE | file.download 감사 로그 삽입 (인증 서류만) |
| `app/src/app/(main)/admin/layout.tsx` | UPDATE | 사이드바에 "감사 로그" 메뉴 추가 |
| `app/src/app/(main)/admin/audit-logs/page.tsx` | CREATE | 감사 로그 조회 페이지 |
| `app/src/api-client/admin.ts` | UPDATE | getAuditLogs 메서드 추가 |

## 0.1 영향 범위 매트릭스 (Impact Matrix)

| 레이어 | 변경 여부 | 관련 파일(대표) | 근거 |
| --- | --- | --- | --- |
| UI (Pages/Components/Stores/Hooks) | UPDATE | `app/src/app/(main)/admin/audit-logs/page.tsx`, `app/src/app/(main)/admin/layout.tsx` | 신규 페이지/메뉴 추가 |
| API Route | UPDATE | `app/src/app/api/admin/audit-logs/route.ts`, `app/src/app/api/profile/route.ts:12-147`, `app/src/app/api/vendors/me/route.ts:109-222`, `app/src/app/api/files/signed-download/route.ts:12-37` | 신규 API + 기존 API에 감사 로그 삽입 추가 |
| API Client | UPDATE | `app/src/api-client/admin.ts:31-147` | getAuditLogs 메서드 추가 |
| Schema (Zod) | UPDATE | `app/src/lib/schema/audit.ts` | 신규 스키마 생성 |
| Service | UPDATE | `app/src/server/audit/service.ts`, `app/src/server/report/service.ts:27-36` | 신규 서비스 + 기존 import 변경 |
| Repo/DB (+ Migration) | UPDATE | `app/supabase/migrations/20260131200000_audit_logs_index_rls.sql` | 인덱스 추가, RLS 정책 수정 |
| Auth/Security/RLS | UPDATE | `app/supabase/migrations/20251218190000_p0_schema.sql:575-586` | 기존 admin-only insert를 authenticated로 확장 |
| Integrations/Cache | NO CHANGE | - | 외부 연동 없음 |
| Config/Middleware/Env | NO CHANGE | - | 설정 변경 없음 |
| Tests | NO CHANGE | - | PRD에서 테스트 범위 미정의 |

## 0.2 추가로 읽은 파일 (Read Set)

| 파일 | 라인 | 참조 이유 |
| --- | --- | --- |
| `app/src/app/(main)/admin/reports/page.tsx` | 1-353 | nuqs 기반 필터/페이지네이션 UI 패턴 참조 |
| `app/src/lib/schema/common.ts` | 1-13 | zPaginationQuery, zUuid 참조 |
| `app/src/server/file/signed-download.ts` | 53-205 | 인증 서류 다운로드 시 파일 purpose 확인 패턴 참조 |

## 0.3 Step-by-Step Implementation Tasks

| ID | Layer | File | Action | Description | Depends On |
|----|-------|------|--------|-------------|------------|
| SCHEMA-1 | Migration | `app/supabase/migrations/20260131200000_audit_logs_index_rls.sql` | CREATE | 인덱스 5개 추가 + RLS 정책 수정 | - |
| SCHEMA-2 | Schema | `app/src/lib/schema/audit.ts` | CREATE | 감사 로그 조회 스키마 | - |
| BACKEND-1 | Utils | `app/src/server/audit/utils.ts` | CREATE | safeInsertAuditLog 공통 함수 | SCHEMA-1 |
| BACKEND-2 | Service | `app/src/server/audit/service.ts` | CREATE | 목록 조회 서비스 | SCHEMA-1, SCHEMA-2 |
| BACKEND-3 | Mapper | `app/src/server/audit/mapper.ts` | CREATE | Row->DTO 매핑 | SCHEMA-2 |
| BACKEND-4 | Service | `app/src/server/report/service.ts` | UPDATE | safeInsertAuditLog import 변경 | BACKEND-1 |
| BACKEND-5 | API | `app/src/app/api/admin/audit-logs/route.ts` | CREATE | 목록 조회 API | BACKEND-2, BACKEND-3 |
| BACKEND-6 | API | `app/src/app/api/profile/route.ts` | UPDATE | profile.create/update 감사 로그 | BACKEND-1 |
| BACKEND-7 | API | `app/src/app/api/vendors/me/route.ts` | UPDATE | vendor.create/update 감사 로그 | BACKEND-1 |
| BACKEND-8 | API | `app/src/app/api/files/signed-download/route.ts` | UPDATE | file.download 감사 로그 (인증 서류만) | BACKEND-1 |
| FRONTEND-1 | Layout | `app/src/app/(main)/admin/layout.tsx` | UPDATE | 사이드바 메뉴 추가 | - |
| FRONTEND-2 | Page | `app/src/app/(main)/admin/audit-logs/page.tsx` | CREATE | 감사 로그 조회 페이지 | SCHEMA-2 |
| FRONTEND-3 | API-Client | `app/src/api-client/admin.ts` | UPDATE | getAuditLogs 메서드 추가 | BACKEND-5 |

## 0.4 Parallelization Strategy

### 실행 모드

**Conservative (권장)**: Backend 완료 후 Frontend 시작

### 실행 단계

| Phase | Tasks | Executor | Mode |
|-------|-------|----------|------|
| 1 | SCHEMA-1, SCHEMA-2 | schema-implementer | Both |
| 2 | BACKEND-1 ~ BACKEND-8 | backend-implementer | Both |
| 3 | FRONTEND-1 ~ FRONTEND-3 | frontend-implementer | Conservative: Phase 2 완료 후 |
| 4 | Integration | main | Both |

### 파일 소유권

| Pattern | Owner | Others |
|---------|-------|--------|
| `app/supabase/migrations/**` | schema-implementer | READ-ONLY |
| `app/src/lib/schema/**` | schema-implementer | READ-ONLY |
| `app/src/server/**` | backend-implementer | READ-ONLY |
| `app/src/app/api/**` | backend-implementer | READ-ONLY |
| `app/src/app/(main)/**` | frontend-implementer | READ-ONLY |
| `app/src/api-client/**` | frontend-implementer | READ-ONLY |

## 1. 범위

- **포함**
  - audit_logs 테이블 인덱스 5개 추가
  - RLS 정책 수정 (authenticated 사용자도 자신의 로그 삽입 가능)
  - safeInsertAuditLog 공통 모듈 생성 및 기존 코드 리팩터링
  - 신규 이벤트 5종 추가 (profile.create, profile.update, vendor.create, vendor.update, file.download)
  - `/admin/audit-logs` 통합 조회 UI 신규 구성
- **제외**
  - profile.delete (탈퇴 API 미구현)
  - 로그 보존 정책/아카이빙
  - 로그 CSV 내보내기

## 2. 시스템 개요

### 2.1 아키텍처 / 경계

```
┌───────────────────────────────────────────────────────────────────────┐
│                         Frontend                                       │
│  /admin/audit-logs (page.tsx)                                         │
│    - nuqs로 URL 상태 관리                                              │
│    - React Query로 데이터 페칭                                         │
└───────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────────┐
│                       API Client                                       │
│  api-client/admin.ts                                                  │
│    - getAuditLogs(query)                                              │
└───────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────────┐
│                       API Routes                                       │
│  GET /api/admin/audit-logs  - 목록 조회 (withRole admin)               │
│  POST /api/profile          - profile.create 로그 삽입                 │
│  PATCH /api/profile         - profile.update 로그 삽입                 │
│  POST /api/vendors/me       - vendor.create 로그 삽입                  │
│  PATCH /api/vendors/me      - vendor.update 로그 삽입                  │
│  GET /api/files/signed-download - file.download 로그 삽입 (인증 서류)   │
└───────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────────┐
│                       Server Layer                                     │
│  server/audit/utils.ts    - safeInsertAuditLog 공통 함수               │
│  server/audit/service.ts  - listAuditLogs 조회 서비스                  │
│  server/audit/mapper.ts   - Row -> DTO 매핑                            │
└───────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────────┐
│                       Supabase (Postgres)                              │
│  audit_logs 테이블                                                     │
│    - 인덱스 5개 (created_at, action, target_type, actor_user_id, 복합) │
│    - RLS: SELECT=admin, INSERT=authenticated(actor_user_id=auth.uid()) │
└───────────────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름

**조회 흐름:**
1. UI (page.tsx) -> API Client (getAuditLogs)
2. API Client -> API Route (GET /api/admin/audit-logs)
3. API Route -> Service (listAuditLogs)
4. Service -> Supabase (audit_logs SELECT)
5. Mapper -> Response DTO

**삽입 흐름:**
1. API Route (profile/vendor/file) -> safeInsertAuditLog
2. safeInsertAuditLog -> Supabase (audit_logs INSERT)
3. 실패 시 console.error, 메인 로직은 계속 진행

## 3. UI/UX 설계

### 3.1 해결할 문제 (PRD 기반)

- **핵심 문제**: 관리자가 사용자 활동(가입, 프로필 수정, 인증 서류 다운로드 등)을 통합 조회할 수 없음
- **핵심 니즈**: 기간/액션/대상유형으로 필터링하여 감사 로그 빠른 검색
- **성공 기준**: 검색 p95 < 500ms, 필터/페이지네이션 정상 동작

### 3.2 정보 구조 (Information Architecture)

**핵심 정보 (반드시 표시):**
- 일시 (created_at)
- 액션 유형 (action)
- 대상 유형 (target_type)
- 행위자 (actor_user_id -> display_name, email)

**부가 정보 (확장/호버 시 표시):**
- 대상 ID (target_id)
- 메타데이터 (metadata)

**정보 그룹핑:**
- 시간순 정렬 (최신순)
- 액션/대상유형별 필터

### 3.3 흐름(Flow) 설계

**메인 플로우:**
```
[페이지 진입] → [기본 필터로 목록 로드] → [필터 조정] → [검색 버튼/Enter] → [결과 확인] → [페이지 이동]
```

**예외/이탈 루트:**
- 검색 결과 없음 -> "검색 결과가 없습니다" + 필터 조건 안내
- API 에러 -> 토스트 메시지

**단계 최소화:**
- 목표까지 가는 클릭 수: 3회 이하 (필터 선택 -> 검색 -> 결과 확인)

### 3.4 레이아웃 및 시각적 위계

**레이아웃 선택 + 근거:**
- 목록 형태: **테이블 형식 리스트**
- 근거: 여러 속성(일시, 액션, 대상, 행위자)을 한 눈에 비교해야 하므로 행 기반 레이아웃 적합

**시각적 위계 (중요도순):**
1. **Primary**: 검색 버튼
2. **Secondary**: 필터 버튼들 (액션, 대상유형)
3. **Information**: 검색 결과 목록

**영역 구분 (ASCII 레이아웃):**
```
┌─────────────────────────────────────────────────────────────┐
│  [필터 영역] - 상단 고정                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [액션 필터 버튼들] [대상유형 필터 버튼들]                  ││
│  │ [기간 선택] [행위자 검색 Input] [검색 버튼]               ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  [결과 영역] - 메인, 스크롤                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 일시 | 액션 | 대상 | 행위자                               ││
│  │ ─────────────────────────────────────────────────────── ││
│  │ 2026.01.31 10:00 | profile.create | profile | 홍길동     ││
│  │ 2026.01.31 09:30 | vendor.update | vendor | 김업체       ││
│  │ ...                                                      ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  [페이지네이션] - 하단                                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 컴포넌트 구조

**파일 구조:**
```
admin/audit-logs/
├── page.tsx (200줄 이하, 레이아웃 + 상태 조합)
└── constants.ts (ACTION_OPTIONS, TARGET_TYPE_OPTIONS 등)
```

**컴포넌트 명명 규칙:**
- 별도 컴포넌트 분리 불필요 (단순 목록 UI)
- 기존 UI 컴포넌트 재사용: Button, Input, Badge, Spinner, Empty, Pagination

**분리 기준:**
- page.tsx: 200줄 이하
- 상수/옵션: constants.ts로 분리

### 3.6 상태 및 피드백

| 상태 | UI 표현 |
|------|---------|
| 초기 | 기본 필터로 목록 로드 |
| 로딩 | Spinner (중앙) |
| 빈 결과 | Empty 컴포넌트 "검색 결과가 없습니다" |
| 에러 | 토스트 메시지 (전역 에러 핸들러) |
| 성공 | 목록 렌더링 |

**UX 편의 기능:**
- 엔터키 검색: 예
- 체크박스 일괄 선택: 아니오 (조회 전용)
- 키보드 단축키: 없음

### 3.7 상태 관리

- **서버 상태**: React Query 사용
  - 쿼리 키: `["admin", "audit-logs", action, targetType, actorId, startDate, endDate, page]`
- **클라이언트 상태**: 검색 입력 임시 저장 (useState)
- **URL 상태**: nuqs 사용
  - `action`: 액션 필터 (기본값 "all")
  - `type`: 대상유형 필터 (기본값 "all")
  - `q`: 행위자 검색어
  - `startDate`: 시작일
  - `endDate`: 종료일
  - `page`: 페이지 번호 (기본값 1)

### 3.8 API Client

- 파일: `app/src/api-client/admin.ts`
- 메서드: `getAuditLogs(params: AdminAuditLogListQuery): Promise<AdminAuditLogListResponse>`

## 4. 데이터 모델

### 4.1 audit_logs 테이블 (기존)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 로그 ID |
| actor_user_id | uuid | NOT NULL, FK profiles(id) | 행위자 사용자 ID |
| action | text | NOT NULL | 액션 유형 (domain.action) |
| target_type | text | NOT NULL | 대상 유형 |
| target_id | uuid | nullable | 대상 ID |
| metadata | jsonb | NOT NULL, default '{}' | 추가 데이터 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |

### 4.2 인덱스 추가 (마이그레이션)

| 인덱스 | 컬럼 | 용도 |
|--------|------|------|
| `idx_audit_logs_created_at` | created_at DESC | 기간별 조회 |
| `idx_audit_logs_action` | action | 액션 유형별 조회 |
| `idx_audit_logs_target_type` | target_type | 대상 유형별 조회 |
| `idx_audit_logs_actor` | actor_user_id | 행위자별 조회 |
| `idx_audit_logs_target` | (target_type, target_id) | 대상별 조회 (복합) |

- 마이그레이션: `app/supabase/migrations/20260131200000_audit_logs_index_rls.sql`
- 롤백(down) 전략: DROP INDEX CONCURRENTLY

### 4.3 RLS 정책 수정

**현재 (변경 전):**
- SELECT: admin만
- INSERT: admin이고 actor_user_id = auth.uid()

**변경 후:**
- SELECT: admin만 (유지)
- INSERT: authenticated이고 actor_user_id = auth.uid()

## 5. API 설계

### 5.1 GET /api/admin/audit-logs

| 항목 | 내용 |
| --- | --- |
| 메서드/경로 | `GET /api/admin/audit-logs` |
| 권한 | admin (withRole guard) |
| 요청 스키마 | `AdminAuditLogListQuerySchema` (Query) |
| 응답 스키마 | `AdminAuditLogListResponseSchema` |

**Query 스키마 (`AdminAuditLogListQuerySchema`):**

| 필드 | 타입 | 검증 | 설명 |
|------|------|------|------|
| action | string | optional | 액션 필터 |
| targetType | string | optional | 대상유형 필터 |
| actorId | string | optional, uuid | 행위자 ID 필터 |
| startDate | string | optional, YYYY-MM-DD | 시작일 |
| endDate | string | optional, YYYY-MM-DD | 종료일 |
| page | number | optional, default 1, min 1 | 페이지 번호 |
| pageSize | number | optional, default 20, max 100 | 페이지 크기 |

**응답 스키마 (`AdminAuditLogListResponseSchema`):**

| 필드 | 타입 | 설명 |
|------|------|------|
| code | "success" | 성공 코드 |
| data.items | AuditLogView[] | 감사 로그 목록 |
| data.page | number | 현재 페이지 |
| data.pageSize | number | 페이지 크기 |
| data.total | number | 전체 개수 |

**AuditLogView:**

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string (uuid) | 로그 ID |
| action | string | 액션 유형 |
| targetType | string | 대상 유형 |
| targetId | string or null | 대상 ID |
| metadata | object | 추가 데이터 |
| createdAt | string (ISO) | 생성 시각 |
| actor | { id, displayName, email } | 행위자 정보 |

**에러 응답:**

| 상태 | 조건 |
|------|------|
| 400 | Zod 검증 실패 |
| 401 | 미인증 |
| 403 | admin이 아님 |
| 500 | 내부 서버 오류 |

**페이지네이션:**
- page: 1부터 시작
- pageSize: 기본 20, 최대 100
- 정렬: created_at DESC (안정적 정렬)
- total: 필터 조건에 맞는 전체 개수

## 6. 서비스/도메인 계층

### 6.1 safeInsertAuditLog (`app/src/server/audit/utils.ts`)

```
async function safeInsertAuditLog(
    supabase: SupabaseClient<Database>,
    payload: TablesInsert<"audit_logs">,
    context: string,
): Promise<void>
```

- 입력: supabase 클라이언트, 삽입 페이로드, 컨텍스트 문자열
- 동작: audit_logs에 INSERT, 실패 시 console.error만 출력
- 반환: void (에러가 발생해도 메인 로직은 계속 진행)

### 6.2 listAuditLogs (`app/src/server/audit/service.ts`)

```
async function listAuditLogs(
    supabase: SupabaseClient<Database>,
    query: AdminAuditLogListQuery,
): Promise<{ items: AuditLogView[], total: number }>
```

- 입력: supabase 클라이언트, 조회 쿼리
- 동작:
  1. audit_logs JOIN profiles (actor 정보)
  2. 필터 적용 (action, targetType, actorId, startDate, endDate)
  3. 페이지네이션 (range)
  4. 정렬 (created_at DESC)
  5. count 쿼리로 total 조회
- 반환: { items: AuditLogView[], total: number }
- 에러: internalServerError

### 6.3 mapAuditLogRow (`app/src/server/audit/mapper.ts`)

```
function mapAuditLogRow(row: AuditLogRowWithActor): AuditLogView
```

- 입력: DB Row (audit_logs + profiles JOIN)
- 반환: AuditLogView DTO

### 6.4 기존 서비스 변경

- `app/src/server/report/service.ts`:
  - 기존 safeInsertAuditLog 함수 제거
  - `import { safeInsertAuditLog } from "@/server/audit/utils"` 추가

## 7. 테스트 전략

| 구분 | 시나리오 | 도구 |
| --- | --- | --- |
| 단위 | safeInsertAuditLog 에러 시 throw 안 함 | Vitest |
| 통합 | GET /api/admin/audit-logs 필터/페이지네이션 | Supertest |

### 검증 명령

```bash
pnpm lint
pnpm type-check
pnpm db:gen
```

## 8. 운영/배포

- 마이그레이션 적용 순서:
  1. 마이그레이션 (인덱스 추가, RLS 정책 수정)
  2. 서버 코드 배포
  3. 프론트엔드 코드 배포
- 롤백 절차:
  1. 프론트엔드 롤백 (메뉴 제거)
  2. 서버 코드 롤백 (감사 로그 삽입 제거)
  3. 마이그레이션 롤백 (인덱스 DROP, RLS 정책 복원)
- 인덱스 추가 시 CONCURRENTLY 옵션 사용하여 잠금 최소화

## 9. 백로그

- [ ] 로그 보존 정책 (90일 이후 아카이빙)
- [ ] 로그 CSV 내보내기
- [ ] profile.delete 감사 로그 (탈퇴 API 구현 시)
- [ ] 실시간 로그 스트리밍 (관리자 대시보드)

## Progress Log (append-only)

### 2026-01-31T20:00:00Z schema-implementer

**완료 태스크**: SCHEMA-1, SCHEMA-2
**생성/수정 파일**:
- `app/supabase/migrations/20260131200000_audit_logs_index_rls.sql` (CREATE)
- `app/src/lib/schema/audit.ts` (CREATE)

**검증 결과**: type-check PASS, db:gen SKIP (로컬 DB 미연결)
**다음**: backend-implementer, frontend-implementer 실행 가능
