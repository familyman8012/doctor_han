# Exploration Report: 신고/제재 시스템

## 1. 탐색 요약

### 탐색 목표
- 통합 신고 시스템 (리뷰/업체/사용자)
- 자동 블라인드 (5건 이상)
- 3단계 제재 (경고 → 일시정지 → 영구정지)
- 제재 이력 관리 (sanctions 테이블)
- 관리자 신고 심사 UI (/admin/reports)

### 핵심 발견사항
1. **기존 신고 시스템**: 리뷰 신고만 구현됨 (`review_reports` 테이블)
2. **제재 필드 존재**: `profiles.status`, `vendors.status`에 'banned' 상태 있음
3. **감사 로그**: `audit_logs` 테이블로 모든 관리자 액션 추적
4. **관리자 UI 패턴**: `/admin/verifications` 페이지 참고 가능

---

## 2. Pending Matrix

| Layer | Status | Files | Notes |
|-------|--------|-------|-------|
| MIGRATION | PENDING | `app/supabase/migrations/` | reports, sanctions 테이블 신규 생성 |
| SCHEMA | PENDING | `app/src/lib/schema/` | report, sanction Zod 스키마 추가 |
| SERVER | PENDING | `app/src/server/` | report, sanction service/repository 추가 |
| API | PENDING | `app/src/app/api/admin/` | reports API 엔드포인트 추가 |
| UI | PENDING | `app/src/app/(main)/admin/` | reports 페이지 추가 |
| API-CLIENT | PENDING | `app/src/api-client/` | admin.ts에 reports API 함수 추가 |

---

## 3. 레이어별 관련 파일

### 3.1 UI Layer

#### 관리자 레이아웃
- `app/src/app/(main)/admin/layout.tsx` - 사이드바 네비게이션 + 권한 검증
  - 네비게이션 항목: verifications, users, vendors, categories
  - **reports 항목 추가 필요**

#### 관리자 페이지 패턴 (참고)
- `app/src/app/(main)/admin/verifications/page.tsx` - 목록/필터/페이지네이션 패턴
- `app/src/app/(main)/admin/users/page.tsx` - 사용자 목록 테이블
- `app/src/app/(main)/admin/vendors/page.tsx` - 업체 목록 테이블

#### 모달 컴포넌트 (재사용)
- `app/src/components/Modal/Modal.tsx` - 기본 모달
- `app/src/components/Modal/ConfirmModal.tsx` - 확인 모달
- `app/src/app/(main)/admin/verifications/components/DetailModal.tsx` - 상세 모달
- `app/src/app/(main)/admin/verifications/components/RejectModal.tsx` - 사유 입력 모달

#### 기존 신고 UI
- `app/src/app/(main)/vendors/[id]/components/modal/ReviewReportModal.tsx` - 리뷰 신고 모달

#### UI 컴포넌트 (재사용)
- `app/src/components/ui/Button/button.tsx` - variant: primary, secondary, danger, list, listActive
- `app/src/components/ui/Badge/Badge.tsx` - 상태 배지
- `app/src/components/ui/Input/Input.tsx` - 입력 필드
- `app/src/components/ui/Select/Select.tsx` - 드롭다운
- `app/src/components/widgets/Pagination/Pagination.tsx` - 페이지네이션

### 3.2 API Layer

#### 기존 신고 API
- `app/src/app/api/reviews/[id]/report/route.ts` - POST 리뷰 신고
- `app/src/app/api/admin/reviews/[id]/hide/route.ts` - POST 블라인드
- `app/src/app/api/admin/reviews/[id]/unhide/route.ts` - POST 블라인드 해제

#### Admin API 패턴 (참고)
- `app/src/app/api/admin/verifications/route.ts` - GET 목록
- `app/src/app/api/admin/verifications/[id]/approve/route.ts` - POST 승인
- `app/src/app/api/admin/verifications/[id]/reject/route.ts` - POST 반려
- `app/src/app/api/admin/users/route.ts` - GET 사용자 목록
- `app/src/app/api/admin/vendors/route.ts` - GET 업체 목록

### 3.3 Server Layer

#### 권한/인가
- `app/src/server/auth/guards.ts`
  - `withAuth` - 인증 필수
  - `withRole(["admin"])` - admin 권한 필수

#### API 기반
- `app/src/server/api/with-api.ts` - API 래퍼 (에러 처리)
- `app/src/server/api/errors.ts` - 에러 정의 (badRequest, notFound, forbidden 등)
- `app/src/server/api/response.ts` - 응답 포맷 (ok, created, fail)

#### Mapper 패턴
- `app/src/server/admin/mapper.ts` - Admin 데이터 매핑

#### Supabase
- `app/src/server/supabase/server.ts` - Server-side Supabase 클라이언트

### 3.4 Schema Layer

#### 기존 스키마
- `app/src/lib/schema/review.ts`
  - `ReviewReportReasonSchema` - enum (spam, inappropriate, false_info, privacy, other)
  - `ReviewReportBodySchema` - 신고 요청 본문
  - `AdminReviewHideBodySchema` - 블라인드 요청 본문

- `app/src/lib/schema/admin.ts`
  - `AdminUserListQuerySchema` - 사용자 목록 쿼리
  - `AdminVendorListQuerySchema` - 업체 목록 쿼리

- `app/src/lib/schema/profile.ts`
  - `ProfileStatusSchema` - enum (active, inactive, banned)
  - `ProfileRoleSchema` - enum (doctor, vendor, admin)

- `app/src/lib/schema/vendor.ts`
  - `VendorStatusSchema` - enum (draft, active, inactive, banned)

### 3.5 Database Layer

#### 기존 테이블
- `review_reports` - 리뷰 신고
  - columns: id, review_id, reporter_user_id, reason, detail, status, reviewed_by, reviewed_at
  - enums: review_report_reason, review_report_status

- `audit_logs` - 감사 로그
  - columns: id, actor_user_id, action, target_type, target_id, metadata, created_at

- `profiles` - 사용자
  - status: profile_status (active, inactive, banned)

- `vendors` - 업체
  - status: vendor_status (draft, active, inactive, banned)

- `reviews` - 리뷰
  - status: review_status (published, hidden)

#### RLS 정책 패턴
```sql
-- Admin 전체 접근
create policy xxx_admin_all on public.xxx
for all to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

-- 본인만 생성
create policy xxx_insert_own on public.xxx
for insert to authenticated
with check (user_id = auth.uid());
```

### 3.6 API Client Layer

- `app/src/api-client/client.ts` - Axios 설정
- `app/src/api-client/admin.ts` - Admin API 함수
  - getVerifications, approveVerification, rejectVerification
  - getUsers, getVendors
  - **reports 함수 추가 필요**

---

## 4. 기존 패턴 상세

### 4.1 목록 API 패턴
```typescript
// GET /api/admin/xxx
let qb = ctx.supabase.from("xxx").select(..., { count: "exact" });

// 필터링
if (query.status) qb = qb.eq("status", query.status);
if (query.q) {
  const escaped = escapeLike(query.q);
  qb = qb.or(`name.ilike.%${escaped}%,...`);
}

// 페이징
const from = (query.page - 1) * query.pageSize;
const { data, error, count } = await qb.range(from, from + query.pageSize - 1);

// 응답
return ok({
  items: data.map(mapFunction),
  page: query.page,
  pageSize: query.pageSize,
  total: count ?? 0,
});
```

### 4.2 액션 API 패턴
```typescript
// POST /api/admin/xxx/:id/action
// 1. 리소스 조회
const { data } = await ctx.supabase.from("xxx").select("*").eq("id", id).single();

// 2. 상태 검증
if (data.status === "xxx") throw badRequest("이미 처리됨");

// 3. 상태 업데이트
await ctx.supabase.from("xxx").update({ status: "new_status" }).eq("id", id);

// 4. 감사 로그
await ctx.supabase.from("audit_logs").insert({
  actor_user_id: ctx.user.id,
  action: "xxx.action",
  target_type: "xxx",
  target_id: id,
  metadata: { reason, ... }
});

// 5. 응답
return ok({ id });
```

### 4.3 감사 로그 Action Types
```
- review.report     // 리뷰 신고
- review.hide       // 리뷰 블라인드
- review.unhide     // 리뷰 블라인드 해제
- doctor_verification.approve/reject
- vendor_verification.approve/reject
```

### 4.4 관리자 페이지 UI 패턴
```tsx
// 상태 관리
const [type, setType] = useState("xxx");
const [status, setStatus] = useState("pending");
const [search, setSearch] = useState("");
const [page, setPage] = useState(1);

// React Query
const { data, isLoading } = useQuery({
  queryKey: ["admin", "xxx", type, status, search, page],
  queryFn: () => adminApi.getXxx({ type, status, q: search, page, pageSize: 20 }),
});

// 필터 버튼
<Button variant={type === "a" ? "listActive" : "list"} onClick={() => setType("a")}>A</Button>

// 목록
{items.map((item) => (
  <div className="p-4 hover:bg-gray-50" onClick={() => setDetail(item)}>
    <Badge>상태</Badge>
    <span>정보</span>
    <Button onClick={() => handleAction(item)}>액션</Button>
  </div>
))}

// 페이지네이션
<Pagination pageInfo={[page, 20]} totalCount={total} handlePageChange={setPage} />
```

---

## 5. Planner 참고사항

### 5.1 신규 생성 필요
1. **DB 테이블**
   - `reports` - 통합 신고 테이블 (target_type으로 리뷰/업체/사용자 구분)
   - `sanctions` - 제재 이력 테이블

2. **Enum 타입**
   - `report_target_type` - review, vendor, profile
   - `report_status` - pending, reviewing, resolved, dismissed
   - `sanction_type` - warning, suspension, permanent_ban
   - `sanction_status` - active, expired, revoked

3. **API 엔드포인트**
   - GET /api/admin/reports - 신고 목록
   - GET /api/admin/reports/:id - 신고 상세
   - POST /api/admin/reports/:id/review - 신고 심사 시작
   - POST /api/admin/reports/:id/resolve - 신고 처리 완료 (+ 제재)
   - POST /api/admin/reports/:id/dismiss - 신고 기각
   - GET /api/admin/sanctions - 제재 목록
   - POST /api/admin/sanctions/:id/revoke - 제재 해제

4. **UI 페이지**
   - `/admin/reports` - 신고 관리 페이지

### 5.2 기존 코드 수정 필요
1. **Admin 레이아웃**: 네비게이션에 '신고 관리' 항목 추가
2. **신고 API**: 통합 reports 테이블 사용으로 변경 (기존 review_reports는 유지)
3. **자동 블라인드**: 신고 5건 이상 시 트리거 또는 API에서 처리

### 5.3 성능/UX 고려사항
- 신고 목록 페이지네이션 필수
- URL 상태 관리 (nuqs) 권장 - 필터 조건 유지/공유
- 입력 즉시 검색 금지 - 버튼/Enter로만 실행

### 5.4 권한/보안 고려사항
- 모든 신고 관련 API는 admin 권한 필수 (withRole(["admin"]))
- RLS 정책으로 admin만 reports, sanctions 접근 가능
- 모든 제재 액션은 audit_logs에 기록
