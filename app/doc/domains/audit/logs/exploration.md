# Exploration Report: Audit Logs 재정비

## 탐색 일시
2026-01-31

## 탐색 범위
감사 로그(Audit Log) 시스템 전체 재정비를 위한 코드베이스 탐색

---

## 1. 레이어별 관련 파일

### 1.1 Schema Layer
| 파일 | 역할 | 상태 |
|------|------|------|
| `app/src/lib/schema/common.ts` | 공통 스키마 (zUuid, zPaginationQuery) | 참조 |
| `app/src/lib/schema/report.ts` | Report/Sanction 스키마 | 참조 패턴 |
| `app/src/lib/schema/audit.ts` | **감사 로그 스키마** | 신규 생성 필요 |

### 1.2 DB Layer (Migrations)
| 파일 | 역할 | 상태 |
|------|------|------|
| `app/supabase/migrations/20251218190000_p0_schema.sql:99-107` | audit_logs 테이블 정의 | 인덱스 추가 필요 |
| `app/supabase/migrations/20260130000000_reports_sanctions.sql` | Report/Sanction 테이블 | 참조 |
| `app/supabase/migrations/20260131025059_add_resolve_report_rpc.sql` | 감사 로그 삽입 RPC | 참조 패턴 |

### 1.3 Server Layer
| 파일 | 역할 | 상태 |
|------|------|------|
| `app/src/server/report/service.ts:27-36` | safeInsertAuditLog 함수 | 공통 모듈로 이동 필요 |
| `app/src/server/audit/` | **감사 로그 서비스** | 신규 생성 필요 |

### 1.4 API Layer
| 파일 | 역할 | 상태 |
|------|------|------|
| `app/src/app/api/admin/audit-logs/route.ts` | **감사 로그 목록 API** | 신규 생성 필요 |

**기존 감사 로그 삽입 위치:**
| 파일 | 액션 | 비고 |
|------|------|------|
| `app/src/app/api/reviews/[id]/report/route.ts:64-74` | review.report | 유지 |
| `app/src/app/api/admin/reviews/[id]/hide/route.ts:51-61` | review.hide | 유지 |
| `app/src/app/api/admin/reviews/[id]/unhide/route.ts:49-59` | review.unhide | 유지 |
| `app/src/server/report/service.ts:658-671` | report.dismiss | safeInsertAuditLog 사용 |
| `app/src/server/report/service.ts:872-885` | sanction.revoke | safeInsertAuditLog 사용 |
| `app/src/server/report/service.ts:449-581` | report.auto_blind | safeInsertAuditLog 사용 |
| `app/src/app/api/admin/verifications/[id]/approve/route.ts:112-122` | doctor/vendor_verification.approve | 유지 |
| `app/src/app/api/admin/verifications/[id]/reject/route.ts:104-114` | doctor/vendor_verification.reject | 유지 |
| `app/src/app/api/admin/categories/route.ts:55-65` | category.create | 유지 |
| `app/src/app/api/admin/help-center/articles/route.ts:109-119` | help_article.create | 유지 |
| `app/src/app/api/profile/route.ts:12-82` | **profile.create** | 추가 필요 |
| `app/src/app/api/profile/route.ts:84-147` | **profile.update** | 추가 필요 |
| `app/src/app/api/vendors/me/route.ts:88-222` | **vendor.create/update** | 추가 필요 |
| `app/src/app/api/files/signed-download/route.ts` | **file.download** | 추가 필요 (인증 서류만) |

### 1.5 Frontend Layer
| 파일 | 역할 | 상태 |
|------|------|------|
| `app/src/app/(main)/admin/layout.tsx` | 관리자 레이아웃/네비게이션 | 메뉴 추가 필요 |
| `app/src/app/(main)/admin/reports/page.tsx` | 신고 관리 페이지 | 참조 패턴 |
| `app/src/app/(main)/admin/audit-logs/page.tsx` | **감사 로그 조회 페이지** | 신규 생성 필요 |
| `app/src/api-client/admin.ts` | Admin API 클라이언트 | 메서드 추가 필요 |

---

## 2. PENDING Matrix

| 레이어 | 상태 | 변경 예상 |
|--------|------|----------|
| SCHEMA | PENDING | 감사 로그 조회용 스키마 신규 생성 |
| DB | PENDING | 인덱스 추가 마이그레이션 |
| SERVER | PENDING | 감사 로그 서비스/공통 유틸 생성, 기존 API에 로그 삽입 추가 |
| API | PENDING | 감사 로그 조회 API 신규, 기존 API에 로그 삽입 추가 |
| FRONTEND | PENDING | 감사 로그 조회 UI 신규 생성 |

---

## 3. 기존 패턴 분석

### 3.1 audit_logs 테이블 구조
```sql
create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid not null references public.profiles(id) on delete restrict,
    action text not null,           -- 'domain.action' 형식
    target_type text not null,      -- 대상 유형
    target_id uuid,                 -- 대상 ID (nullable)
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);
```

### 3.2 RLS 정책
```sql
-- 관리자만 조회/삽입 가능
create policy audit_logs_admin_select on public.audit_logs
for select to authenticated using (public.is_admin());

create policy audit_logs_admin_insert on public.audit_logs
for insert to authenticated with check (public.is_admin() and actor_user_id = auth.uid());
```

### 3.3 현재 구현된 액션 목록
| 액션 | target_type | 설명 |
|------|------------|------|
| `review.report` | review | 리뷰 신고 |
| `review.hide` | review | 리뷰 블라인드 |
| `review.unhide` | review | 리뷰 블라인드 해제 |
| `report.dismiss` | report | 신고 기각 |
| `report.resolve` | report | 신고 처리 완료 |
| `report.auto_blind` | review | 자동 블라인드 |
| `sanction.create` | sanction | 제재 생성 |
| `sanction.revoke` | sanction | 제재 해제 |
| `doctor_verification.approve` | doctor_verification | 의사 인증 승인 |
| `doctor_verification.reject` | doctor_verification | 의사 인증 거절 |
| `vendor_verification.approve` | vendor_verification | 업체 인증 승인 |
| `vendor_verification.reject` | vendor_verification | 업체 인증 거절 |
| `category.create` | category | 카테고리 생성 |
| `help_article.create` | help_article | 헬프 아티클 생성 |
| `help_article.update` | help_article | 헬프 아티클 수정 |
| `help_article.delete` | help_article | 헬프 아티클 삭제 |

### 3.4 safeInsertAuditLog 패턴
```typescript
// app/src/server/report/service.ts:27-36
async function safeInsertAuditLog(
    supabase: SupabaseClient<Database>,
    payload: TablesInsert<"audit_logs">,
    context: string,
): Promise<void> {
    const { error } = await supabase.from("audit_logs").insert(payload);
    if (error) {
        console.error(`[${context}] audit_logs insert failed`, error);
        // 에러가 발생해도 메인 로직은 계속 진행
    }
}
```

### 3.5 메타데이터 구조 패턴
```typescript
// 신고 처리 시
metadata: { reportId, sanctionType, reason }

// 제재 생성 시
metadata: { sanctionId, targetType, targetId, sanctionType, durationDays }

// 자동 블라인드 시
metadata: { reportId, reviewId, reportCount, result, reason?, step?, error? }

// 인증 승인/거절 시
metadata: { status, reason? }

// 헬프 아티클 CRUD 시
metadata: { title, type, categoryId? }
```

### 3.6 관리자 목록 UI 패턴 (nuqs 사용)
```typescript
// app/src/app/(main)/admin/reports/page.tsx
const [targetType, setTargetType] = useQueryState("type", parseAsString.withDefault("all"));
const [status, setStatus] = useQueryState("status", parseAsString.withDefault("pending"));
const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

// React Query 쿼리 키
queryKey: ["admin", "reports", targetType, status, search, page]
```

### 3.7 페이지네이션 패턴
```typescript
const PAGE_SIZE = 20;

// 응답 구조
{ data: { items: [], page, pageSize, total } }

// 컴포넌트
<Pagination
    pageInfo={[page, PAGE_SIZE]}
    totalCount={total}
    handlePageChange={setPage}
/>
```

### 3.8 권한/인가 패턴
```typescript
// app/src/server/auth/guards.ts
withRole(["admin"], async (ctx) => { ... })
```

---

## 4. 추가 필요 액션 목록

| 액션 | target_type | 삽입 위치 | 설명 |
|------|------------|----------|------|
| `profile.create` | profile | api/profile/route.ts POST | 회원가입 |
| `profile.update` | profile | api/profile/route.ts PATCH | 프로필 수정 |
| `profile.delete` | profile | (미구현) | 회원 탈퇴 |
| `vendor.create` | vendor | api/vendors/me/route.ts POST | 업체 프로필 생성 |
| `vendor.update` | vendor | api/vendors/me/route.ts PATCH | 업체 프로필 수정 |
| `file.download` | verification_file | api/files/signed-download/route.ts | 인증 서류 다운로드 |

---

## 5. 인덱스 추가 필요

현재 audit_logs 테이블에 인덱스가 없음. 추가 필요:
```sql
-- 기간별 조회 (가장 빈번)
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 액션 유형별 조회
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- 대상 유형별 조회
CREATE INDEX idx_audit_logs_target_type ON public.audit_logs(target_type);

-- 행위자별 조회
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_user_id);

-- 대상별 조회 (복합)
CREATE INDEX idx_audit_logs_target ON public.audit_logs(target_type, target_id);
```

---

## 6. UI 컴포넌트 참조

### 6.1 사용할 컴포넌트
- `Badge` - 액션 유형/상태 표시
- `Button` - 필터 버튼 (variant="list"/"listActive")
- `Input` - 검색 입력
- `Spinner` - 로딩 상태
- `Empty` - 빈 데이터
- `Pagination` - 페이지네이션

### 6.2 레이아웃 패턴
```typescript
// 필터 영역
<div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
    <div className="flex flex-wrap gap-2">
        {/* 필터 버튼들 */}
    </div>
    <form className="flex gap-2">
        <Input placeholder="검색" />
        <Button type="submit">검색</Button>
    </form>
</div>

// 데이터 영역
<div className="bg-white rounded-xl border border-gray-200">
    {isLoading ? <Spinner /> : items.length === 0 ? <Empty /> : (
        <div className="grid ...">
            {/* 테이블 */}
        </div>
    )}
</div>
```

---

## 7. Planner 참고사항

### 7.1 핵심 결정 사항
1. **safeInsertAuditLog 이동**: `report/service.ts` → `server/audit/utils.ts`로 이동하여 공통 사용
2. **RLS 정책 수정 필요**: 현재 admin만 insert 가능 → 일반 사용자도 자신의 액션 기록 필요 (profile.create 등)
3. **actor_user_id null 허용 검토**: 시스템 자동 작업 시 actor가 없을 수 있음

### 7.2 성능 고려사항
- 인덱스 추가 필수 (created_at, action, target_type)
- 페이지네이션 20건/페이지
- 기간 필터 필수 (최근 30일 기본값 권장)

### 7.3 UI 레이아웃
- 필터: 기간, 액션 유형, 대상 유형
- 검색: 행위자 이름/이메일 (선택적)
- 정렬: created_at DESC (기본)

### 7.4 권한
- 조회: admin만
- 관리자 네비게이션에 메뉴 추가 필요
