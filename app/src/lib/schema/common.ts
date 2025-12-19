import { z } from "zod";

export const zUuid = z.string().uuid();

export const zNonEmptyString = z.string().trim().min(1);

export const zPaginationQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof zPaginationQuery>;

