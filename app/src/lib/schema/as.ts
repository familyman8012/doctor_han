import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";

const AnyObjectSchema = z.object({}).passthrough();

export const AsRequestCreateDTOSchema = AnyObjectSchema;
export type AsRequestCreateDTO = z.infer<typeof AsRequestCreateDTOSchema>;

export const AsAdminRequestPatchDTOSchema = AnyObjectSchema;
export type AsAdminRequestPatchDTO = z.infer<typeof AsAdminRequestPatchDTOSchema>;

export const AsAdminRequestListQuerySchema = AnyObjectSchema;
export type AsAdminRequestListQuery = z.infer<typeof AsAdminRequestListQuerySchema>;

export const AsSessionInfoSchema = AnyObjectSchema.nullable();
export type AsSessionInfo = z.infer<typeof AsSessionInfoSchema>;

export const SuccessEnvelopeSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.unknown(),
    message: z.string().optional(),
});

export type AsRequestCreateResponse = z.infer<typeof SuccessEnvelopeSchema>;
export type AsSmsChallengeCreateResponse = z.infer<typeof SuccessEnvelopeSchema>;
export type AsSmsChallengeVerifyResponse = z.infer<typeof SuccessEnvelopeSchema>;
export type AsAdminRequestListResponse = z.infer<typeof SuccessEnvelopeSchema>;
export type AsAdminRequestDetail = z.infer<typeof SuccessEnvelopeSchema>;

