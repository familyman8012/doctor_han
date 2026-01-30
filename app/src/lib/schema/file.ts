import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zUuid } from "./common";

export const FilePurposeSchema = z.enum([
    "doctor_license",
    "vendor_business_license",
    "portfolio",
    "lead_attachment",
    "avatar",
    "review_photo",
    "lead_message_attachment",
]);

export type FilePurpose = z.infer<typeof FilePurposeSchema>;

export const FileViewSchema = z.object({
    id: zUuid,
    ownerUserId: zUuid,
    bucket: z.string(),
    path: z.string(),
    purpose: FilePurposeSchema,
    mimeType: z.string().nullable(),
    sizeBytes: z.number().int().nullable(),
    createdAt: z.string(),
});

export type FileView = z.infer<typeof FileViewSchema>;

export const FileSignedUploadBodySchema = z
    .object({
        purpose: FilePurposeSchema,
        fileName: zNonEmptyString,
        mimeType: z.string().trim().min(1).optional().nullable(),
        sizeBytes: z.coerce.number().int().min(0).optional().nullable(),
    })
    .strict();

export type FileSignedUploadBody = z.infer<typeof FileSignedUploadBodySchema>;

export const FileSignedUploadResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        file: FileViewSchema,
        upload: z.object({
            signedUrl: z.string().url(),
            token: zNonEmptyString,
            bucket: zNonEmptyString,
            path: zNonEmptyString,
        }),
    }),
    message: z.string().optional(),
});

export type FileSignedUploadResponse = z.infer<typeof FileSignedUploadResponseSchema>;

export const FileSignedDownloadQuerySchema = z
    .object({
        fileId: zUuid,
        download: z.string().trim().min(1).optional(),
    })
    .strict();

export type FileSignedDownloadQuery = z.infer<typeof FileSignedDownloadQuerySchema>;

export const FileSignedDownloadResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        signedUrl: z.string().url(),
        expiresIn: z.number().int(),
    }),
    message: z.string().optional(),
});

export type FileSignedDownloadResponse = z.infer<typeof FileSignedDownloadResponseSchema>;
