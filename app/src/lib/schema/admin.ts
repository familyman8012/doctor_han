import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { CategoryViewSchema } from "./category";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";
import { ProfileRoleSchema, ProfileStatusSchema, ProfileViewSchema } from "./profile";
import { VendorStatusSchema } from "./vendor";
import { DoctorVerificationViewSchema, VendorVerificationViewSchema, VerificationStatusSchema } from "./verification";

export const AdminVerificationTypeSchema = z.enum(["doctor", "vendor"]);
export type AdminVerificationType = z.infer<typeof AdminVerificationTypeSchema>;

export const AdminVerificationListQuerySchema = z
    .object({
        type: AdminVerificationTypeSchema,
        status: VerificationStatusSchema.optional(),
        q: z.string().trim().min(1).optional(),
    })
    .merge(zPaginationQuery)
    .strict();

export type AdminVerificationListQuery = z.infer<typeof AdminVerificationListQuerySchema>;

export const AdminDoctorVerificationListItemSchema = z.object({
    type: z.literal("doctor"),
    user: ProfileViewSchema,
    verification: DoctorVerificationViewSchema,
});

export type AdminDoctorVerificationListItem = z.infer<typeof AdminDoctorVerificationListItemSchema>;

export const AdminVendorVerificationListItemSchema = z.object({
    type: z.literal("vendor"),
    user: ProfileViewSchema,
    verification: VendorVerificationViewSchema,
});

export type AdminVendorVerificationListItem = z.infer<typeof AdminVendorVerificationListItemSchema>;

export const AdminDoctorVerificationListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        type: z.literal("doctor"),
        items: z.array(AdminDoctorVerificationListItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type AdminDoctorVerificationListResponse = z.infer<typeof AdminDoctorVerificationListResponseSchema>;

export const AdminVendorVerificationListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        type: z.literal("vendor"),
        items: z.array(AdminVendorVerificationListItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type AdminVendorVerificationListResponse = z.infer<typeof AdminVendorVerificationListResponseSchema>;

export const AdminVerificationListResponseSchema = z.union([
    AdminDoctorVerificationListResponseSchema,
    AdminVendorVerificationListResponseSchema,
]);

export type AdminVerificationListResponse = z.infer<typeof AdminVerificationListResponseSchema>;

export const AdminVerificationApproveBodySchema = z
    .object({
        type: AdminVerificationTypeSchema.optional(),
    })
    .strict();

export type AdminVerificationApproveBody = z.infer<typeof AdminVerificationApproveBodySchema>;

export const AdminVerificationRejectBodySchema = z
    .object({
        type: AdminVerificationTypeSchema.optional(),
        reason: zNonEmptyString,
    })
    .strict();

export type AdminVerificationRejectBody = z.infer<typeof AdminVerificationRejectBodySchema>;

export const AdminDoctorVerificationActionResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        type: z.literal("doctor"),
        verification: DoctorVerificationViewSchema,
    }),
    message: z.string().optional(),
});

export type AdminDoctorVerificationActionResponse = z.infer<typeof AdminDoctorVerificationActionResponseSchema>;

export const AdminVendorVerificationActionResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        type: z.literal("vendor"),
        verification: VendorVerificationViewSchema,
    }),
    message: z.string().optional(),
});

export type AdminVendorVerificationActionResponse = z.infer<typeof AdminVendorVerificationActionResponseSchema>;

export const AdminVerificationActionResponseSchema = z.union([
    AdminDoctorVerificationActionResponseSchema,
    AdminVendorVerificationActionResponseSchema,
]);

export type AdminVerificationActionResponse = z.infer<typeof AdminVerificationActionResponseSchema>;

export const AdminUserListQuerySchema = z
    .object({
        role: ProfileRoleSchema.optional(),
        status: ProfileStatusSchema.optional(),
        q: z.string().trim().min(1).optional(),
    })
    .merge(zPaginationQuery)
    .strict();

export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>;

export const AdminUserListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(ProfileViewSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>;

export const AdminVendorListQuerySchema = z
    .object({
        status: VendorStatusSchema.optional(),
        q: z.string().trim().min(1).optional(),
    })
    .merge(zPaginationQuery)
    .strict();

export type AdminVendorListQuery = z.infer<typeof AdminVendorListQuerySchema>;

export const AdminVendorListItemSchema = z.object({
    id: zUuid,
    ownerUserId: zUuid,
    owner: ProfileViewSchema,
    name: z.string(),
    summary: z.string().nullable(),
    regionPrimary: z.string().nullable(),
    regionSecondary: z.string().nullable(),
    priceMin: z.number().int().nullable(),
    priceMax: z.number().int().nullable(),
    status: VendorStatusSchema,
    ratingAvg: z.number().nullable(),
    reviewCount: z.number().int(),
    vendorVerification: VendorVerificationViewSchema.nullable(),
    categories: z.array(CategoryViewSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type AdminVendorListItem = z.infer<typeof AdminVendorListItemSchema>;

export const AdminVendorListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(AdminVendorListItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type AdminVendorListResponse = z.infer<typeof AdminVendorListResponseSchema>;

export const AdminCategoryCreateBodySchema = z
    .object({
        parentId: zUuid.optional().nullable(),
        name: zNonEmptyString,
        slug: zNonEmptyString,
        sortOrder: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
    })
    .strict();

export type AdminCategoryCreateBody = z.infer<typeof AdminCategoryCreateBodySchema>;

export const AdminCategoryPatchBodySchema = z
    .object({
        parentId: zUuid.optional().nullable(),
        name: zNonEmptyString.optional(),
        slug: zNonEmptyString.optional(),
        sortOrder: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
    })
    .strict()
    .refine(
        (value) =>
            value.parentId !== undefined ||
            value.name !== undefined ||
            value.slug !== undefined ||
            value.sortOrder !== undefined ||
            value.isActive !== undefined,
        { message: "수정할 필드가 없습니다." },
    );

export type AdminCategoryPatchBody = z.infer<typeof AdminCategoryPatchBodySchema>;

export const AdminCategoryResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        category: CategoryViewSchema,
    }),
    message: z.string().optional(),
});

export type AdminCategoryResponse = z.infer<typeof AdminCategoryResponseSchema>;

export const AdminCategoryDeleteResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        id: zUuid,
    }),
    message: z.string().optional(),
});

export type AdminCategoryDeleteResponse = z.infer<typeof AdminCategoryDeleteResponseSchema>;

