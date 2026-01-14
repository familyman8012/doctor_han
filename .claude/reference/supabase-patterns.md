# Supabase 패턴 (DB/RLS/Types)

이 문서는 Medihub의 Supabase 사용 규칙(마이그레이션, 타입 생성, 클라이언트 분리, RLS)을 정리합니다.

## 0) 핵심 원칙

1. **DB 쿼리는 서버에서만**: 브라우저에서 Supabase(DB) 직접 호출 금지(예외: Auth/Storage).
2. **SQL 마이그레이션이 단일 출처**: 스키마 변경은 `app/supabase/migrations/*.sql`로만 수행합니다.
3. **권한은 RLS가 최종 방어선**: API 가드(서버) + RLS/Policy(DB) 이중 방어.

## 1) 마이그레이션 (SQL)

- 위치: `app/supabase/migrations/*.sql`
- 생성: `cd app && pnpm db:new -- "<name>"`
- 적용: `cd app && pnpm db:migrate`
- 로컬 초기화: `cd app && pnpm db:reset`

### 불변 규칙

- **이미 적용된(커밋된) 마이그레이션 파일은 수정하지 않습니다.**
  - 필요하면 “새 마이그레이션”으로 정정합니다(히스토리 보존).

## 2) 타입 생성 (database.types.ts)

- 생성 스크립트: `cd app && pnpm db:gen`
- 출력 파일: `app/src/lib/database.types.ts`
- 로컬 DB 기반 생성: `cd app && pnpm db:gen -- --local` (사전 조건: `pnpm db:start`)

### 주의사항

- `database.types.ts`는 **자동 생성 파일**이며 수동 편집 금지입니다.
- 마이그레이션 후 타입을 반드시 재생성합니다.

## 3) Supabase 클라이언트 분리

### Server Client (쿠키 세션)

- 파일: `app/src/server/supabase/server.ts`
- 사용처: `app/src/app/api/**/route.ts`, `app/src/server/**`

```ts
import { createSupabaseServerClient } from "@/server/supabase/server";
const supabase = await createSupabaseServerClient();
```

### Browser Client (Auth/Storage 제한)

- 파일: `app/src/server/supabase/browser.ts`
- 사용처: 로그인/로그아웃, 파일 업로드(서명 URL), 세션 확인 등

```ts
import { getSupabaseBrowserClient } from "@/server/supabase/browser";
const supabase = getSupabaseBrowserClient();
```

### Admin Client (service_role)

- 파일: `app/src/server/supabase/admin.ts`
- 목적: RLS를 우회해야 하는 서버 전용 작업(관리자/배치 등)
- **절대 브라우저로 번들되지 않도록** `server-only`를 유지합니다.

```ts
import { createSupabaseAdminClient } from "@/server/supabase/admin";
const supabase = createSupabaseAdminClient();
```

## 4) 쿼리 패턴 (Repository 중심)

Medihub는 “도메인별 server 모듈”로 쿼리를 모읍니다.

- 예: `app/src/server/vendor/repository.ts`
- 예: `app/src/server/vendor/mapper.ts`

### 기본 규칙

- API Route에서 복잡한 쿼리를 직접 만들기보다, 재사용 가능하면 `repository.ts`로 이동합니다.
- DB row → API DTO 변환은 `mapper.ts`에서 수행합니다.

### 에러 처리

- Supabase 에러는 그대로 흘리지 말고, `ApiError`로 변환해 메시지/코드를 통제합니다.

예시(요약):

```ts
const { data, error } = await supabase.from("vendors").select("*").eq("id", id).maybeSingle();
if (error) {
  throw internalServerError("업체를 조회할 수 없습니다.", { message: error.message, code: error.code });
}
```

## 5) RLS/Policy 가이드(요약)

정책은 마이그레이션 SQL에서 선언합니다.

- “누가 어떤 row에 접근 가능한가?”를 DB에서 강제합니다.
- API 가드는 UX/성능/명확한 에러 메시지를 위해 존재하지만, 보안은 RLS가 최종 책임집니다.

권장 체크리스트:

- 테이블별 `enable row level security`
- role별 `select/insert/update/delete` 정책 정의
- `service_role` 사용 범위 최소화(필요한 API에만)

