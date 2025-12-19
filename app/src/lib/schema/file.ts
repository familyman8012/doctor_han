import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zUuid } from "./common";

export const FileDirectUploadDataSchema = z.object({
    id: zUuid,
    bucket: zNonEmptyString,
    path: zNonEmptyString,
});

export const FileDirectUploadResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: FileDirectUploadDataSchema,
    message: z.string().optional(),
});

export type FileDirectUploadResponse = z.infer<typeof FileDirectUploadResponseSchema>;

export const FileUsageSchema = z.object({
    id: zUuid,
    fileId: zUuid,
    domain: zNonEmptyString,
    entityId: zNonEmptyString,
    createdAt: z.string(),
});

export const FileUsageListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(FileUsageSchema),
    }),
    message: z.string().optional(),
});

export type FileUsageListResponse = z.infer<typeof FileUsageListResponseSchema>;

