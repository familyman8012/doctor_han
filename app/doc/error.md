# ### 3-1. 공통 (응답/에러/권한/검증) — MVP 규약

목표: 프론트(React Query 중앙 에러 처리 + `src/api-client/client.ts` 인터셉터)와 1:1 호환되는 **BFF 표준**을 확정한다.

---

## 1) 공통 응답/에러 포맷 (확정)

### 1-1. 성공 응답
- HTTP: `200` / `201`
- Body:
  - `code: "0000"`
  - `data: T`
  - `message?: string` (선택)

예시:
```json
{ "code": "0000", "data": { "items": [] } }
```

### 1-2. 실패 응답
- HTTP: `4xx` / `5xx`
- Body:
  - `code: string`
  - `message: string`
  - `details?: unknown` (선택)

예시:
```json
{ "code": "4000", "message": "잘못된 요청", "details": [{ "path": ["name"], "message": "Required" }] }
```

### 1-3. `details` 규칙
- 입력 검증(Zod) 실패: `details = ZodError["errors"]`
- 비즈니스/도메인 실패: `details = 추가 컨텍스트(필드, 충돌 원인, 제약조건 등)`
- 외부/서버 오류: `details`는 운영상 필요한 최소 정보만(PII/민감정보 금지)

왜 이렇게?
- 현재 axios 인터셉터가 `response.data.code !== "0000"`이면 reject 처리하므로, **성공도 `code:"0000"`로 통일**하면 예외 케이스가 사라진다.
- 프론트 중앙 에러 핸들러가 `code/message/details`를 소비하므로, **API도 동일 키로 통일**하는 게 가장 비용이 낮다.

---

## 2) 에러 코드/HTTP 매핑 (확정)

> 코드 형식은 숫자 문자열을 기본으로 하며, 프론트의 중앙 에러 처리기와 충돌 없이 유지한다.

| code | HTTP | 의미 | 프론트 기본 UX |
|---:|---:|---|---|
| `0000` | 200/201 | 성공 | 정상 처리 |
| `4000` | 400 | 입력 검증 실패(Zod) | 토스트(유효성 메시지) |
| `4040` | 404 | 리소스 없음 | 토스트(없음 안내) |
| `4090` | 409 | 충돌/중복 | 토스트(중복/충돌 안내) |
| `5000` | 500 | 서버 내부 오류 | 토스트(일시적 오류) |
| `8999` | 401 | 인증 필요/세션 없음 | 토스트 → 로그아웃 → `/` 이동 |
| `8991` | 403 | 권한 없음(role mismatch 등) | 토스트 → `/` 이동 |
| `8001` | 403 | **승인 필요(검수 미통과/대기)** | 토스트 → **`/verification` 이동(로그아웃 금지)** |

### 2-1. `8001` UX 결정 (로그아웃 vs 승인 대기 화면)
`8001`은 “인증 실패”가 아니라 “계정 상태(승인/검수)” 문제이므로 **로그아웃시키지 않는다.**

- ✅ 채택: **승인 대기/반려 안내 화면으로 유도** (`/verification`)
- ❌ 미채택: 강제 로그아웃

이유:
- 사용자는 **로그인된 상태**에서 서류 업로드/재제출/반려 사유 확인이 필요하다.
- 로그아웃은 문제 원인(승인 대기)을 흐리고, 반복 로그인만 유발해 이탈/CS를 늘린다.
- 보안 관점에서도, `8001` 대상 사용자는 이미 세션을 가진 사용자이며 RLS/권한 가드가 차단해야 할 것은 “민감 기능(리드 생성 등)”이지 “세션 자체”가 아니다.

주의(무한 리다이렉트 방지):
- `/verification` 페이지 및 관련 API는 `8001`을 다시 반환하지 않도록 설계한다.
  - 예: 승인 대기 상태에서도 접근 가능한 “내 검수 상태 조회/재제출” API는 별도로 허용.

---

## 3) 인증/권한 가드(roles) 헬퍼 (확정)

### 3-1. 기본 원칙
- BFF(API Routes)에서 Supabase 호출 시, 가능하면 **anon key + 사용자 세션**으로 동작하여 RLS를 1차 안전망으로 유지한다.
- `SUPABASE_SERVICE_ROLE_KEY`는 “정말 필요한 서버 전용 작업”에서만 제한적으로 사용한다.

### 3-2. 헬퍼 구성(개념)
- `withAuth`
  - Supabase 세션 기반 인증
  - 세션 없음 → `401` + `code:"8999"`
- `withRole(allowedRoles)`
  - `profiles.role` 확인
  - 불일치 → `403` + `code:"8991"`
- `requireApprovedDoctor`
  - `doctor_verifications.status = approved` 확인
  - 미승인 → `403` + `code:"8001"`
- `requireApprovedVendor`
  - `vendor_verifications.status = approved` 확인
  - 미승인 → `403` + `code:"8001"`

---

## 4) 입력 검증(Zod) 패턴 (확정)

### 4-1. 위치
- `src/lib/schema/**` 에 도메인 단위로 정의
  - 예: `src/lib/schema/vendor.ts`, `src/lib/schema/lead.ts` 등

### 4-2. 라우트에서의 사용 규칙
- Query: `Schema.parse({ ...searchParams })`
- Body: `Schema.parse(await req.json())`
- 라우트는 “검증 → 서비스 호출 → 응답”만 담당하고, 에러 변환/로깅은 공통 핸들러에서 처리한다.

### 4-3. ZodError 처리 규칙
- ZodError → `400` + `code:"4000"` + `details=zod.errors`

---

## 5) 참고(ncos-prototype에서 가져온 형태)

아래 파일들의 패턴을 참고하여 “Zod 검증 + 에러 표준화 + (권한 미들웨어)” 구조를 우리 프로젝트에 맞게 단순화한다.

- 입력 검증/라우트 구성:
  - `/Users/julian/workspace/ncos-prototype/web/src/app/api/order-products/route.ts`
  - `/Users/julian/workspace/ncos-prototype/web/src/app/api/order-products/price-policies/route.ts`
- 에러 표준화:
  - `/Users/julian/workspace/ncos-prototype/web/src/lib/errors/index.ts`
  - `/Users/julian/workspace/ncos-prototype/web/src/server/http/middleware/with-api-error.ts`
- 권한 미들웨어(우리는 role 기반으로 단순화):
  - `/Users/julian/workspace/ncos-prototype/web/src/server/http/middleware/with-permission.ts`

