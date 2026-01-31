# 감사 로그 시스템 재정비 - 코드 리뷰

> 리뷰 일시: 2026-01-31
> 리뷰 대상: 감사 로그(Audit Log) 시스템 재정비 기능 구현
> 리뷰 기준: Medihub 코드 컨벤션 (CLAUDE.md, api-patterns.md, service-patterns.md, supabase-patterns.md, zod-patterns.md)

## 1. 요약

| 구분 | 결과 |
|------|------|
| 전체 평가 | PASS |
| Critical 이슈 | 0건 |
| Major 이슈 | 1건 |
| Minor 이슈 | 2건 |
| 개선 제안 | 3건 |

---

## 2. 파일별 리뷰

### 2.1 Migration: `app/supabase/migrations/20260131200000_audit_logs_index_rls.sql`

**평가: PASS**

**장점:**
- CONCURRENTLY 옵션을 사용하여 프로덕션 환경에서 잠금 최소화
- 인덱스 이름이 명확하고 일관성 있음 (`idx_audit_logs_*`)
- RLS 정책이 `actor_user_id = auth.uid()` 조건으로 자신의 로그만 삽입 가능하도록 설정

**확인 사항:**
- 인덱스 5개 추가: created_at, action, target_type, actor_user_id, (target_type, target_id) 복합
- RLS INSERT 정책: admin-only에서 authenticated로 확장 (자신의 actor_user_id만)

---

### 2.2 Schema: `app/src/lib/schema/audit.ts`

**평가: PASS**

**장점:**
- Zod 스키마 패턴 준수 (`.strict()` 사용하지 않았으나 Query 스키마는 optional 필드가 많아 적절)
- `zPaginationQuery` 재사용으로 페이지네이션 일관성 유지
- 날짜 검증에 regex 패턴 사용 (`/^\d{4}-\d{2}-\d{2}$/`)
- Response 스키마에 `API_SUCCESS_CODE` 리터럴 타입 사용

**Minor 이슈 #1:**
- `AuditLogViewSchema.metadata`가 `z.object({}).passthrough()`로 정의되어 있음
- 권장: `z.record(z.unknown())`로 변경하면 타입 추론이 더 명확함

```typescript
// 현재
metadata: z.object({}).passthrough(),

// 권장
metadata: z.record(z.string(), z.unknown()),
```

---

### 2.3 Server Utils: `app/src/server/audit/utils.ts`

**평가: PASS**

**장점:**
- `"server-only"` import로 클라이언트 번들 방지
- 에러 발생 시 throw하지 않고 console.error로만 로깅 (PRD 요구사항 준수)
- context 파라미터로 로그 추적 용이

**확인 사항:**
- 메인 로직 실패를 방지하기 위해 에러를 삼킴 - 의도된 동작

---

### 2.4 Server Service: `app/src/server/audit/service.ts`

**평가: PASS**

**장점:**
- `"server-only"` import 사용
- `internalServerError` 표준 에러 함수 사용
- Supabase 에러 처리 시 `{ message, code }` 형식으로 details 전달
- JOIN 쿼리로 actor 정보를 한 번에 조회 (N+1 방지)
- `count: "exact"` 옵션으로 전체 개수 조회
- 날짜 필터에서 시작일/종료일 시간 범위를 명확하게 처리 (`T00:00:00.000Z`, `T23:59:59.999Z`)

**패턴 준수 확인:**
```typescript
// 표준 에러 처리 패턴 준수
if (error) {
    throw internalServerError("감사 로그를 조회할 수 없습니다.", {
        message: error.message,
        code: error.code,
    });
}
```

---

### 2.5 Server Mapper: `app/src/server/audit/mapper.ts`

**평가: PASS**

**장점:**
- `"server-only"` import 사용
- Row -> DTO 변환 명확하게 분리
- snake_case -> camelCase 변환 일관성 유지
- 타입 정의 (`AuditLogRowWithActor`)가 명확함

---

### 2.6 API Route: `app/src/app/api/admin/audit-logs/route.ts`

**평가: PASS**

**장점:**
- `withApi` + `withRole(["admin"])` 패턴 준수
- Zod `.parse()` 사용으로 입력 검증
- `ok()` 응답 함수 사용
- Query 파라미터 파싱 패턴 일관성 유지

**패턴 준수 확인:**
```typescript
// 표준 API Route 패턴
export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const query = AdminAuditLogListQuerySchema.parse({...});
        const { items, total } = await listAuditLogs(ctx.supabase, query);
        return ok({...});
    }),
);
```

---

### 2.7 API Route Update: `app/src/app/api/profile/route.ts`

**평가: PASS**

**장점:**
- `safeInsertAuditLog` 공통 함수 사용
- profile.create, profile.update 이벤트 기록
- metadata에 의미 있는 정보 포함 (role, changedFields)
- 변경 사항이 있을 때만 로그 삽입 (changedFields.length > 0)

---

### 2.8 API Route Update: `app/src/app/api/vendors/me/route.ts`

**평가: PASS**

**장점:**
- vendor.create, vendor.update 이벤트 기록
- metadata에 name, changedFields 포함
- categoryIds 변경도 changedFields에 포함

---

### 2.9 API Route Update: `app/src/app/api/files/signed-download/route.ts`

**평가: PASS (조건부)**

**장점:**
- 인증 서류(`doctor_license`, `vendor_business_license`)만 감사 로그 기록
- 로그인 사용자만 기록 (`if (user && VERIFICATION_FILE_PURPOSES.includes(purpose))`)

**Major 이슈 #1:**
- `withApi`를 사용하지만 `withAuth`/`withRole` guard를 사용하지 않음
- 현재 코드는 비인증 사용자도 signed URL을 요청할 수 있음
- `createAuthorizedSignedDownloadUrl` 내부에서 권한 검증을 수행하는 것으로 보이나, 명시적 guard가 없음

```typescript
// 현재 구현
export const GET = withApi(async (req: NextRequest) => {
    // withAuth/withRole 없이 직접 supabase 클라이언트 생성
    const supabase = await createSupabaseServerClient();
    const { data: userResult } = await supabase.auth.getUser();
    // ...
});
```

**확인 필요:**
- `createAuthorizedSignedDownloadUrl` 함수 내부에서 적절한 권한 검증이 이루어지는지 확인 필요
- 만약 공개 파일도 지원해야 한다면 현재 구현이 의도된 것일 수 있음

---

### 2.10 Server Service Update: `app/src/server/report/service.ts`

**평가: PASS**

**변경 사항:**
- `safeInsertAuditLog`를 `@/server/audit/utils`에서 import하도록 변경
- 기존 로직 유지, import 경로만 변경

---

### 2.11 Frontend Layout: `app/src/app/(main)/admin/layout.tsx`

**평가: PASS**

**장점:**
- "감사 로그" 메뉴 항목 추가 (`/admin/audit-logs`)
- FileText 아이콘 사용으로 의미 전달
- 기존 NAV_ITEMS 배열 패턴 유지

---

### 2.12 Frontend Page: `app/src/app/(main)/admin/audit-logs/page.tsx`

**평가: PASS**

**장점:**
- React Query 직접 사용 (커스텀 Hook 래핑 금지 규칙 준수)
- nuqs로 URL 상태 관리
- 검색은 버튼/Enter submit으로만 트리거 (즉시 검색 금지 규칙 준수)
- Spinner, Empty, Pagination 등 기존 UI 컴포넌트 재사용
- 필터 상태와 입력 상태 분리 (`search` vs `searchInput`)

**Minor 이슈 #2:**
- `getTargetTypeBadge` 함수에서 `colors` 타입에 `"neutral"`이 포함되어 있지 않음
- 실제로 사용되지 않는 fallback이지만 타입 일관성을 위해 수정 권장

```typescript
// 현재
const colors: Record<string, "purple" | "teal" | "orange" | "info" | "success"> = {...};
// neutral은 colors 객체에 없음
return <Badge color={colors[type] ?? "neutral"} ...>
```

---

### 2.13 API Client: `app/src/api-client/admin.ts`

**평가: PASS**

**장점:**
- 타입 안전한 API 클라이언트 메서드 추가
- 기존 패턴과 일관성 유지

---

## 3. 패턴 준수 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| API Route: `withApi` 사용 | PASS | 모든 API Route에서 사용 |
| API Route: `ok/created/fail` 응답 | PASS | 표준 응답 함수 사용 |
| 입력 검증: Zod `.parse()` | PASS | Query/Body 모두 검증 |
| 권한/인가: `withRole` guard | PASS | admin API에 적용 |
| Supabase 에러 처리 | PASS | `internalServerError` + `{ message, code }` |
| Frontend: React Query 직접 사용 | PASS | 커스텀 Hook 없음 |
| Frontend: Server Actions 금지 | PASS | API Route만 사용 |
| Frontend: URL 상태는 nuqs | PASS | 모든 필터에 적용 |
| RLS 정책 | PASS | authenticated + actor_user_id 조건 |

---

## 4. 보안 점검

| 항목 | 상태 | 비고 |
|------|------|------|
| 감사 로그 조회: admin only | PASS | `withRole(["admin"])` |
| 감사 로그 삽입: 본인 로그만 | PASS | RLS `actor_user_id = auth.uid()` |
| 민감 정보 노출 | PASS | metadata에 비밀번호 등 민감 정보 미포함 |
| SQL Injection | PASS | Supabase 쿼리 빌더 사용 |

---

## 5. 성능 점검

| 항목 | 상태 | 비고 |
|------|------|------|
| 인덱스 | PASS | 주요 조회 컬럼에 인덱스 추가 |
| N+1 쿼리 | PASS | JOIN으로 actor 정보 조회 |
| 페이지네이션 | PASS | range 쿼리 사용 |
| 정렬 안정성 | PASS | created_at DESC |

---

## 6. 개선 제안

### 제안 #1: Action 필터 UX 개선
현재 action 필터가 도메인 기반(profile, vendor 등)으로 되어 있지만, 실제 action 값은 `profile.create`, `profile.update` 형식입니다. 필터 적용 시 `action.startsWith()` 패턴 매칭이 필요합니다.

현재 구현:
```typescript
// page.tsx
action: action === "all" ? undefined : action,

// service.ts
if (query.action) {
    qb = qb.eq("action", query.action);
}
```

서버에서 `eq("action", query.action)` 대신 `like("action", `${query.action}.%`)` 또는 prefix 검색을 사용하면 도메인 기반 필터링이 가능합니다.

### 제안 #2: 감사 로그 상세 보기
현재 목록에서 metadata를 표시하지 않습니다. 행 클릭 시 상세 모달이나 드로어로 metadata를 확인할 수 있으면 관리자 경험이 향상됩니다.

### 제안 #3: Export 기능 준비
후속 백로그에 CSV 내보내기가 있습니다. API 설계 시 `format=csv` 쿼리 파라미터를 고려하면 추후 확장이 용이합니다.

---

## 7. 결론

감사 로그 시스템 재정비 구현이 PRD/TSD 요구사항을 충족하며, Medihub 코드 컨벤션을 전반적으로 잘 준수하고 있습니다.

**Critical 이슈 없음**, Major 이슈 1건(파일 다운로드 API 권한 검증 명확화 필요)은 `createAuthorizedSignedDownloadUrl` 함수 내부 검증 로직 확인 후 판단이 필요합니다.

Minor 이슈 2건은 타입 안전성 개선 사항으로 선택적으로 적용할 수 있습니다.

---

## 8. 리뷰 상세

### 생성/수정된 파일 목록 (최종 확인)

| 파일 | 상태 | 평가 |
|------|------|------|
| `app/supabase/migrations/20260131200000_audit_logs_index_rls.sql` | CREATE | PASS |
| `app/src/lib/schema/audit.ts` | CREATE | PASS |
| `app/src/server/audit/utils.ts` | CREATE | PASS |
| `app/src/server/audit/service.ts` | CREATE | PASS |
| `app/src/server/audit/mapper.ts` | CREATE | PASS |
| `app/src/server/report/service.ts` | UPDATE | PASS |
| `app/src/app/api/admin/audit-logs/route.ts` | CREATE | PASS |
| `app/src/app/api/profile/route.ts` | UPDATE | PASS |
| `app/src/app/api/vendors/me/route.ts` | UPDATE | PASS |
| `app/src/app/api/files/signed-download/route.ts` | UPDATE | PASS (조건부) |
| `app/src/app/(main)/admin/layout.tsx` | UPDATE | PASS |
| `app/src/app/(main)/admin/audit-logs/page.tsx` | CREATE | PASS |
| `app/src/api-client/admin.ts` | UPDATE | PASS |
