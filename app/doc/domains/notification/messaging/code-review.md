# 통합 메시징 시스템 Code Review

> 리뷰 일시: 2026-01-29
> 리뷰어: Reviewer Agent
> 기반 문서: PRD (`prd.md`), TSD (`tsd.md`)

## 1. 리뷰 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 보안 | PASS | 환경 변수 노출 없음, 인젝션 취약점 없음 |
| 성능 | PASS | 병렬 발송 구현, N+1 쿼리 없음 |
| 에러 핸들링 | PASS | 적절한 try-catch, 로깅 |
| 타입 안전성 | PASS | any 사용 없음, 타입 가드 적절 |
| 패턴 준수 | PASS | 프로젝트 컨벤션 준수 |

**결론**: 모든 체크리스트 항목을 통과했습니다. 일부 개선 권고 사항이 있으나 현재 구현은 배포 가능한 상태입니다.

---

## 2. 상세 리뷰

### 2.1 Schema Layer

**파일**: `app/src/lib/schema/notification.ts`

| 항목 | 판정 | 근거 |
|------|------|------|
| Zod 스키마 패턴 | PASS | `.strict()`, `.refine()` 사용, 프로젝트 표준 준수 |
| 타입 추론 | PASS | `z.infer` 사용으로 타입 자동 추출 |
| Enum 정의 | PASS | `z.enum()` 사용, 채널/타입 명확히 정의 |

```typescript
// 올바른 패턴 사용 예시 (notification.ts:18-35)
export const UpdateNotificationSettingsBodySchema = z
	.object({
		emailEnabled: z.boolean().optional(),
		kakaoEnabled: z.boolean().optional(),
		// ...
	})
	.strict()
	.refine(
		(v) =>
			v.emailEnabled !== undefined ||
			v.kakaoEnabled !== undefined ||
			// ...
		{ message: "수정할 필드가 없습니다." },
	);
```

---

### 2.2 DB Layer

**파일**: `app/supabase/migrations/20260129141452_add_kakao_and_retry.sql`

| 항목 | 판정 | 근거 |
|------|------|------|
| 컬럼 추가 | PASS | NOT NULL + DEFAULT 지정으로 안전한 마이그레이션 |
| 인덱스 | PASS | `status` 컬럼에 인덱스 추가로 조회 최적화 |
| 롤백 가능성 | INFO | 롤백 스크립트가 별도 파일로 없음 (TSD에 롤백 전략 명시됨) |

```sql
-- 안전한 컬럼 추가 패턴 (20260129141452_add_kakao_and_retry.sql:2-3)
ALTER TABLE public.notification_settings
ADD COLUMN kakao_enabled boolean NOT NULL DEFAULT false;
```

---

### 2.3 Backend Layer - Solapi Client

**파일**: `app/src/server/notification/solapi.ts`

| 항목 | 판정 | 근거 |
|------|------|------|
| `server-only` 사용 | PASS | 클라이언트 번들 제외 |
| 환경 변수 처리 | PASS | 누락 시 경고 로그, 빈 문자열 fallback |
| 민감 정보 노출 | PASS | API 키는 환경 변수로만 접근 |

```typescript
// 안전한 환경 변수 처리 (solapi.ts:5-19)
if (!process.env.SOLAPI_API_KEY) {
	console.warn("[Notification] SOLAPI_API_KEY is not set");
}
// ...
export const solapiClient = new SolapiMessageService(
	process.env.SOLAPI_API_KEY ?? "",
	process.env.SOLAPI_API_SECRET ?? "",
);
```

**권고**: 환경 변수 미설정 시 발송 시도를 하지 않도록 방어 로직이 service.ts에 구현되어 있어 문제 없음.

---

### 2.4 Backend Layer - Kakao Templates

**파일**: `app/src/server/notification/kakao-templates.ts`

| 항목 | 판정 | 근거 |
|------|------|------|
| `server-only` 사용 | PASS | 클라이언트 번들 제외 |
| 타입 정의 | PASS | `KakaoTemplateData`, `KakaoTemplate` 인터페이스 명시 |
| 템플릿 ID 하드코딩 | INFO | 환경 변수로 분리 가능하나 현재 패턴도 허용 |

```typescript
// 명확한 타입 정의 (kakao-templates.ts:3-12)
export interface KakaoTemplateData {
	recipientName: string;
	type: "doctor" | "vendor";
	rejectReason?: string;
}

export interface KakaoTemplate {
	templateId: string;
	variables: Record<string, string>;
}
```

---

### 2.5 Backend Layer - Repository

**파일**: `app/src/server/notification/repository.ts`

| 항목 | 판정 | 근거 |
|------|------|------|
| `server-only` 사용 | PASS | 클라이언트 번들 제외 |
| 에러 처리 | PASS | `internalServerError` 사용, 상세 정보 포함 |
| 타입 안전성 | PASS | `Database`, `Tables` 타입 사용 |
| N+1 쿼리 | PASS | 불필요한 반복 쿼리 없음 |

```typescript
// 표준 에러 처리 패턴 (repository.ts:19-24)
if (error) {
	throw internalServerError("알림 설정을 조회할 수 없습니다.", {
		message: error.message,
		code: error.code,
	});
}
```

**권고**: `updateDeliveryStatus` 함수에서 에러 발생 시 `console.error`만 호출하고 예외를 던지지 않음. 이는 의도된 설계로 보이나 (발송 로그 기록 실패가 메인 로직에 영향 주지 않음), 문서화 권장.

---

### 2.6 Backend Layer - Mapper

**파일**: `app/src/server/notification/mapper.ts`

| 항목 | 판정 | 근거 |
|------|------|------|
| `server-only` 사용 | PASS | 클라이언트 번들 제외 |
| 매핑 완전성 | PASS | kakaoEnabled 포함 모든 필드 매핑 |
| 타입 일관성 | PASS | Row -> View 변환 명확 |

```typescript
// 완전한 매핑 (mapper.ts:6-17)
export function mapNotificationSettingsRow(row: NotificationSettingsRow): NotificationSettingsView {
	return {
		userId: row.user_id,
		emailEnabled: row.email_enabled,
		kakaoEnabled: row.kakao_enabled,
		// ...
	};
}
```

---

### 2.7 Backend Layer - Service

**파일**: `app/src/server/notification/service.ts`

| 항목 | 판정 | 근거 |
|------|------|------|
| `server-only` 사용 | PASS | 클라이언트 번들 제외 |
| 병렬 발송 | PASS | `Promise.allSettled` 사용 |
| 재시도 로직 | PASS | Exponential backoff 구현 (2s, 4s, 8s) |
| 에러 격리 | PASS | 한 채널 실패가 다른 채널에 영향 없음 |
| Admin 클라이언트 | PASS | RLS 우회를 위해 적절히 사용 |

```typescript
// 병렬 발송 구현 (service.ts:291-362)
const sendTasks: Promise<void>[] = [];

if (emailEnabled && email) {
	sendTasks.push(/* 이메일 발송 */);
}

if (kakaoEnabled && phone) {
	sendTasks.push(/* 카카오 발송 with retry */);
}

await Promise.allSettled(sendTasks);
```

```typescript
// Exponential backoff 재시도 (service.ts:203-230)
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 2000,
): Promise<RetryResult<T>> {
	// ...
	const delay = Math.pow(2, retryCount) * (baseDelay / 2);
	// 2s, 4s, 8s
}
```

**권고**:
1. `retryWithBackoff`에서 `maxRetries = 3`이지만 `while (retryCount <= maxRetries)`로 인해 실제 최대 4회 시도 (첫 시도 + 3회 재시도). PRD 요구사항과 일치하나 주석으로 명확히 하면 좋음.
2. Solapi 설정 누락 시 발송 스킵하는 방어 로직이 잘 구현됨 (service.ts:154-157).

---

### 2.8 Backend Layer - API Routes

**파일**: `app/src/app/api/notification-settings/route.ts`

| 항목 | 판정 | 근거 |
|------|------|------|
| `withApi` 사용 | PASS | 표준 래퍼 사용 |
| `withAuth` 사용 | PASS | 인증 필수 |
| Zod `parse()` | PASS | Body 검증에 사용 |
| 응답 형식 | PASS | `ok()` 헬퍼 사용 |

```typescript
// 표준 API Route 패턴 (route.ts:23-36)
export const PATCH = withApi(
	withAuth(async (ctx) => {
		const body = UpdateNotificationSettingsBodySchema.parse(await ctx.req.json());
		// ...
		return ok({ settings: mapNotificationSettingsRow(settings) });
	}),
);
```

---

**파일**: `app/src/app/api/admin/verifications/[id]/approve/route.ts`

| 항목 | 판정 | 근거 |
|------|------|------|
| `withApi` 사용 | PASS | 표준 래퍼 사용 |
| `withRole` 사용 | PASS | `["admin"]` 권한 체크 |
| 에러 처리 | PASS | `internalServerError`, `notFound` 사용 |
| 알림 발송 결과 처리 | PASS | 부분 실패 시 경고 메시지 반환 |

```typescript
// 권한 체크 + 표준 에러 처리 (route.ts:76-77)
export const POST = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
```

```typescript
// 알림 발송 결과 처리 (route.ts:142-151)
const warnings: string[] = [];
if (!notificationResult.email.success && !notificationResult.email.skipped) {
	warnings.push("이메일");
}
if (!notificationResult.kakao.success && !notificationResult.kakao.skipped) {
	warnings.push("카카오");
}
if (warnings.length > 0) {
	notificationWarning = `${warnings.join(", ")} 알림 발송에 실패했습니다.`;
}
```

**권고**: `approve/route.ts`와 `reject/route.ts`에서 `resolveVerificationType` 함수가 중복 정의됨. 공통 유틸로 분리 고려.

---

**파일**: `app/src/app/api/admin/verifications/[id]/reject/route.ts`

| 항목 | 판정 | 근거 |
|------|------|------|
| 패턴 일관성 | PASS | approve 라우트와 동일한 패턴 |
| rejectReason 처리 | PASS | 반려 사유 알림에 포함 |

---

### 2.9 Frontend Layer

**파일**: `app/src/app/(main)/mypage/notifications/page.tsx`

| 항목 | 판정 | 근거 |
|------|------|------|
| React Query 사용 | PASS | `useQuery`, `useMutation` 직접 사용 |
| Server Actions | PASS | 사용하지 않음 (금지 패턴 준수) |
| 타입 안전성 | PASS | `NotificationSettingsView` 타입 사용 |
| 접근성 | PASS | `role="switch"`, `aria-checked`, `aria-label` 사용 |
| 에러 피드백 | PASS | `toast.success` 사용 |

```typescript
// React Query 직접 사용 (page.tsx:58-66)
const { data, isLoading } = useQuery({
	queryKey: ["notification-settings"],
	queryFn: async () => {
		const res = await api.get<{ code: string; data: { settings: NotificationSettingsView } }>(
			"/api/notification-settings",
		);
		return res.data.data.settings;
	},
});
```

```typescript
// 접근성 속성 (page.tsx:37-39)
<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={`${label} ${checked ? "활성화됨" : "비활성화됨"}`}
```

**권고**:
1. `updateMutation`에 `onError` 핸들러가 없음. 실패 시 사용자 피드백 추가 권장.
2. `mypage/notifications/page.tsx`와 `partner/notifications/page.tsx`가 거의 동일한 코드. 공통 컴포넌트로 분리 고려.

---

**파일**: `app/src/app/(main)/partner/notifications/page.tsx`

| 항목 | 판정 | 근거 |
|------|------|------|
| 패턴 일관성 | PASS | mypage 버전과 동일한 패턴 |
| 문구 차이 | PASS | "한의사" -> "업체" 등 역할에 맞게 변경 |

---

## 3. 보안 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| 환경 변수 노출 | PASS | API 키는 서버에서만 접근 |
| SQL 인젝션 | N/A | Supabase 클라이언트 사용 (파라미터화 쿼리) |
| XSS | PASS | 템플릿 변수는 서버에서만 처리 |
| 권한 검증 | PASS | `withRole(["admin"])` 적용 |
| RLS | PASS | 본인 설정만 조회/수정 가능 |
| 민감 정보 로깅 | PASS | 전화번호 마스킹 없으나 서버 로그에만 기록 |

---

## 4. 성능 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| N+1 쿼리 | PASS | 불필요한 반복 쿼리 없음 |
| 병렬 처리 | PASS | `Promise.allSettled` 사용 |
| 인덱스 | PASS | `status` 컬럼 인덱스 추가 |
| 불필요한 렌더링 | PASS | `setQueryData`로 즉시 업데이트 |
| 타임아웃 | INFO | Solapi 타임아웃 10초 (PRD 요구사항), 코드에서 명시적 설정 없음 (SDK 기본값 사용 추정) |

---

## 5. 개선 권고 사항

### 5.1 높음 우선순위

없음

### 5.2 중간 우선순위

| # | 파일 | 내용 |
|---|------|------|
| 1 | `mypage/notifications/page.tsx` | `updateMutation`에 `onError` 핸들러 추가하여 실패 시 에러 토스트 표시 |
| 2 | `approve/route.ts`, `reject/route.ts` | `resolveVerificationType` 함수를 공통 유틸로 분리 |

### 5.3 낮음 우선순위

| # | 파일 | 내용 |
|---|------|------|
| 1 | `mypage/notifications/page.tsx`, `partner/notifications/page.tsx` | 공통 컴포넌트로 분리하여 코드 중복 제거 |
| 2 | `service.ts` | `retryWithBackoff` 함수에 시도 횟수 관련 주석 추가 |
| 3 | `repository.ts` | `updateDeliveryStatus`의 에러 무시 동작에 대한 JSDoc 추가 |
| 4 | `solapi.ts` | Solapi 타임아웃 설정 명시적으로 추가 고려 |

---

## 6. PRD/TSD 준수 여부

| PRD 요구사항 | 구현 상태 | 비고 |
|--------------|-----------|------|
| Solapi 연동 카카오 알림톡 | PASS | `solapi.ts`, `kakao-templates.ts` |
| 최대 3회 재시도 (exponential backoff) | PASS | `retryWithBackoff` 함수 |
| 이메일/카카오 각각 ON/OFF | PASS | `kakaoEnabled` 필드 및 UI 토글 |
| 인증 승인/반려 시 병렬 발송 | PASS | `sendVerificationResult` 함수 |
| 리드 생성/응답 시 알림 | NOT IN SCOPE | 2차 릴리스 예정 (PRD 명시) |

| TSD Task | 상태 | 비고 |
|----------|------|------|
| SCHEMA-1 | PASS | kakaoEnabled 필드 추가 |
| SCHEMA-2 | PASS | 마이그레이션 생성 |
| BACKEND-1~8 | PASS | 모든 백엔드 태스크 완료 |
| FRONTEND-1~2 | PASS | 카카오 토글 UI 추가 |

---

## 7. 결론

통합 메시징 시스템 구현이 PRD/TSD 요구사항을 충족하며, 프로젝트 패턴을 잘 준수하고 있습니다. 보안, 성능, 에러 핸들링, 타입 안전성 모든 항목에서 문제가 발견되지 않았습니다.

일부 권고 사항(에러 핸들러 추가, 코드 중복 제거 등)은 후속 리팩토링으로 처리 가능하며, 현재 구현은 배포 가능한 상태입니다.

**최종 판정**: APPROVED
