# Zod 스키마 템플릿 (Medihub)

이 문서는 `app/src/lib/schema/<domain>.ts` 작성 시 사용할 템플릿입니다.

## 1) 최소 템플릿(도메인 파일)

```ts
import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";

// 1) Enum
export const <Domain>StatusSchema = z.enum(["draft", "active", "inactive"]);
export type <Domain>Status = z.infer<typeof <Domain>StatusSchema>;

// 2) View / DTO
export const <Domain>ListItemSchema = z.object({
  id: zUuid,
  name: z.string(),
});
export type <Domain>ListItem = z.infer<typeof <Domain>ListItemSchema>;

export const <Domain>DetailSchema = <Domain>ListItemSchema.extend({
  description: z.string().nullable(),
});
export type <Domain>Detail = z.infer<typeof <Domain>DetailSchema>;

// 3) Query
export const <Domain>ListQuerySchema = z
  .object({
    q: z.string().trim().min(1).optional(),
  })
  .merge(zPaginationQuery)
  .strict();
export type <Domain>ListQuery = z.infer<typeof <Domain>ListQuerySchema>;

// 4) Body (Create/Upsert)
export const <Domain>CreateBodySchema = z
  .object({
    name: zNonEmptyString,
    description: z.string().trim().min(1).optional().nullable(),
  })
  .strict();
export type <Domain>CreateBody = z.infer<typeof <Domain>CreateBodySchema>;

// 5) Body (Patch)
export const <Domain>PatchBodySchema = z
  .object({
    name: zNonEmptyString.optional(),
    description: z.string().trim().min(1).optional().nullable(),
    status: <Domain>StatusSchema.optional(),
  })
  .refine((v) => Object.values(v).some((x) => typeof x !== "undefined"), { message: "수정할 필드가 없습니다." })
  .strict();
export type <Domain>PatchBody = z.infer<typeof <Domain>PatchBodySchema>;

// 6) Response
export const <Domain>ListResponseSchema = z.object({
  code: z.literal(API_SUCCESS_CODE),
  data: z.object({
    items: z.array(<Domain>ListItemSchema),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  }),
  message: z.string().optional(),
});
export type <Domain>ListResponse = z.infer<typeof <Domain>ListResponseSchema>;
```

## 2) 체크리스트

- [ ] Query/Body 모두 `.strict()`가 붙었는가?
- [ ] 공통 스키마(`zUuid`, `zPaginationQuery`)를 재사용하는가?
- [ ] Response 포맷이 `code/data/message`로 통일되는가?

