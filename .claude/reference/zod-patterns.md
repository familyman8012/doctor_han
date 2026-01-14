# Zod 스키마 패턴 (DTO/Validation)

Medihub는 **Zod를 “API 계약(Contract)”의 단일 출처**로 사용합니다.

## 0) 파일 구조(실제)

- `app/src/lib/schema/common.ts`: 공통 스키마(`zUuid`, `zPaginationQuery` 등)
- `app/src/lib/schema/<domain>.ts`: 도메인별 DTO/Query/Response 스키마

## 1) 핵심 원칙

1. **입력은 반드시 파싱**: Query/Body를 스키마로 `parse`한 결과만 사용합니다.
2. **불필요한 분할 금지**: 도메인 스키마는 “1 파일 응집”을 우선합니다(YAGNI).
3. **Fail-fast**: `.strict()`로 예상치 못한 필드를 차단합니다(필요한 경우만 예외).

## 2) 공통 스키마 재사용

```ts
import { z } from "zod";

export const zUuid = z.string().uuid();
export const zNonEmptyString = z.string().trim().min(1);

export const zPaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
```

## 3) Query 스키마 패턴

- `z.coerce`는 “Query 문자열 → 타입” 변환에 사용합니다.
- 교차 필드 검증은 `.refine()`로 수행합니다.
- 페이징은 `.merge(zPaginationQuery)`로 합칩니다.

```ts
export const VendorListQuerySchema = z
  .object({
    q: z.string().trim().min(1).optional(),
    sort: z.enum(["newest", "rating"]).default("newest"),
  })
  .merge(zPaginationQuery)
  .strict();
```

## 4) Body 스키마 패턴

- Create/Upsert는 필수 필드 중심.
- Patch는 optional 중심 + “수정할 필드 없음”을 `.refine()`로 막습니다(필요 시).

```ts
export const VendorPatchBodySchema = z
  .object({
    name: zNonEmptyString.optional(),
    status: z.enum(["draft", "active", "inactive"]).optional(),
  })
  .refine((v) => v.name !== undefined || v.status !== undefined, { message: "수정할 필드가 없습니다." })
  .strict();
```

## 5) Response 스키마 패턴 (표준 응답 포맷)

`API_SUCCESS_CODE`를 사용해 성공 응답을 표준화합니다.

```ts
import { API_SUCCESS_CODE } from "@/lib/api/types";

export const VendorDetailResponseSchema = z.object({
  code: z.literal(API_SUCCESS_CODE),
  data: z.object({
    vendor: VendorDetailSchema,
  }),
  message: z.string().optional(),
});
```

## 6) 체크리스트

- [ ] `.strict()`를 적용했는가?
- [ ] Query/Body가 스키마로 파싱되는가?
- [ ] 교차 필드 제약이 `.refine()`로 표현되는가?
- [ ] API Response 포맷(`code/data/message`)이 일관적인가?

