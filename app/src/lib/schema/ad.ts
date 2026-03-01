import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zPaginationQuery, zUuid } from "./common";

// ============================================
// Enums
// ============================================

export const AdSlotPositionSchema = z.enum(["main", "sub"]);
export type AdSlotPosition = z.infer<typeof AdSlotPositionSchema>;

export const AdCampaignStatusSchema = z.enum([
    "draft",
    "pending",
    "active",
    "paused",
    "completed",
    "canceled",
]);
export type AdCampaignStatus = z.infer<typeof AdCampaignStatusSchema>;

export const AdCreativeTypeSchema = z.enum(["image", "html"]);
export type AdCreativeType = z.infer<typeof AdCreativeTypeSchema>;

export const AdPriorityTierSchema = z.enum(["premium", "plus_up", "plus", "rookie"]);
export type AdPriorityTier = z.infer<typeof AdPriorityTierSchema>;

export const AdPriorityPurchaseStatusSchema = z.enum(["active", "expired", "canceled", "refunded"]);
export type AdPriorityPurchaseStatus = z.infer<typeof AdPriorityPurchaseStatusSchema>;

// ============================================
// Entity Schemas
// ============================================

export const AdSlotSchema = z.object({
    id: zUuid,
    position: AdSlotPositionSchema,
    name: z.string(),
    maxCampaigns: z.number().int(),
    displayCount: z.number().int(),
    priceMonthly: z.number().int(),
    isActive: z.boolean(),
    sortOrder: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type AdSlot = z.infer<typeof AdSlotSchema>;

export const AdCampaignSchema = z.object({
    id: zUuid,
    adSlotId: zUuid,
    vendorId: zUuid.nullable(),
    advertiserName: z.string(),
    status: AdCampaignStatusSchema,
    startsAt: z.string(),
    endsAt: z.string(),
    monthlyPrice: z.number().int(),
    totalImpressions: z.number().int(),
    totalClicks: z.number().int(),
    createdBy: zUuid,
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type AdCampaign = z.infer<typeof AdCampaignSchema>;

export const AdCreativeSchema = z.object({
    id: zUuid,
    campaignId: zUuid,
    type: AdCreativeTypeSchema,
    title: z.string(),
    imageUrl: z.string().nullable(),
    clickUrl: z.string(),
    htmlContent: z.string().nullable(),
    isActive: z.boolean(),
    sortOrder: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type AdCreative = z.infer<typeof AdCreativeSchema>;

export const AdImpressionSchema = z.object({
    id: zUuid,
    campaignId: zUuid,
    date: z.string(),
    impressions: z.number().int(),
    clicks: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type AdImpression = z.infer<typeof AdImpressionSchema>;

export const AdPrioritySlotSchema = z.object({
    id: zUuid,
    categoryId: zUuid,
    tier: AdPriorityTierSchema,
    maxSlots: z.number().int(),
    priceWeekly: z.number().int(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type AdPrioritySlot = z.infer<typeof AdPrioritySlotSchema>;

export const AdPriorityPurchaseSchema = z.object({
    id: zUuid,
    prioritySlotId: zUuid,
    vendorId: zUuid,
    categoryId: zUuid,
    tier: AdPriorityTierSchema,
    status: AdPriorityPurchaseStatusSchema,
    startsAt: z.string(),
    endsAt: z.string(),
    pricePaid: z.number().int(),
    creditTransactionId: zUuid.nullable(),
    jumpupRemaining: z.number().int(),
    jumpupLastUsedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type AdPriorityPurchase = z.infer<typeof AdPriorityPurchaseSchema>;

// ============================================
// Public Display Schemas
// ============================================

export const BannerAdSchema = z.object({
    campaignId: zUuid,
    creativeId: zUuid,
    title: z.string(),
    imageUrl: z.string().nullable(),
    clickUrl: z.string(),
    position: AdSlotPositionSchema,
});
export type BannerAd = z.infer<typeof BannerAdSchema>;

export const PriorityVendorSchema = z.object({
    purchaseId: zUuid,
    vendorId: zUuid,
    vendorName: z.string(),
    vendorSummary: z.string().nullable(),
    vendorThumbnailUrl: z.string().nullable(),
    tier: AdPriorityTierSchema,
    isJumpedUp: z.boolean(),
    categoryId: zUuid,
});
export type PriorityVendor = z.infer<typeof PriorityVendorSchema>;

// ============================================
// Request Schemas
// ============================================

export const BannerListQuerySchema = z
    .object({
        position: AdSlotPositionSchema.optional(),
    })
    .strict();
export type BannerListQuery = z.infer<typeof BannerListQuerySchema>;

export const BannerClickBodySchema = z
    .object({
        creativeId: zUuid,
    })
    .strict();
export type BannerClickBody = z.infer<typeof BannerClickBodySchema>;

export const AdminCampaignCreateBodySchema = z
    .object({
        adSlotId: zUuid,
        vendorId: zUuid.optional(),
        advertiserName: z.string().min(1),
        startsAt: z.string(),
        endsAt: z.string(),
        monthlyPrice: z.number().int().min(0),
        creatives: z.array(
            z.object({
                type: AdCreativeTypeSchema.default("image"),
                title: z.string().min(1),
                imageUrl: z.string().optional(),
                clickUrl: z.string().url(),
                htmlContent: z.string().optional(),
            }),
        ).min(1),
    })
    .strict();
export type AdminCampaignCreateBody = z.infer<typeof AdminCampaignCreateBodySchema>;

export const AdminCampaignPatchBodySchema = z
    .object({
        status: AdCampaignStatusSchema.optional(),
        advertiserName: z.string().min(1).optional(),
        startsAt: z.string().optional(),
        endsAt: z.string().optional(),
        monthlyPrice: z.number().int().min(0).optional(),
        vendorId: zUuid.nullable().optional(),
    })
    .strict()
    .refine(
        (data) =>
            data.status !== undefined ||
            data.advertiserName !== undefined ||
            data.startsAt !== undefined ||
            data.endsAt !== undefined ||
            data.monthlyPrice !== undefined ||
            data.vendorId !== undefined,
        { message: "최소 하나의 필드를 변경해야 합니다." },
    );
export type AdminCampaignPatchBody = z.infer<typeof AdminCampaignPatchBodySchema>;

export const AdminAdReportQuerySchema = z
    .object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        campaignId: zUuid.optional(),
    })
    .merge(zPaginationQuery)
    .strict();
export type AdminAdReportQuery = z.infer<typeof AdminAdReportQuerySchema>;

export const AdminCampaignListQuerySchema = z
    .object({
        status: AdCampaignStatusSchema.optional(),
    })
    .merge(zPaginationQuery)
    .strict();
export type AdminCampaignListQuery = z.infer<typeof AdminCampaignListQuerySchema>;

export const PrioritySlotListQuerySchema = z
    .object({
        categoryId: zUuid,
    })
    .strict();
export type PrioritySlotListQuery = z.infer<typeof PrioritySlotListQuerySchema>;

export const PriorityPurchaseBodySchema = z
    .object({
        prioritySlotId: zUuid,
    })
    .strict();
export type PriorityPurchaseBody = z.infer<typeof PriorityPurchaseBodySchema>;

export const VendorAdsQuerySchema = z
    .object({
        status: AdPriorityPurchaseStatusSchema.optional(),
    })
    .merge(zPaginationQuery)
    .strict();
export type VendorAdsQuery = z.infer<typeof VendorAdsQuerySchema>;

// ============================================
// Response Schemas
// ============================================

export const BannerListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        banners: z.array(BannerAdSchema),
    }),
    message: z.string().optional(),
});
export type BannerListResponse = z.infer<typeof BannerListResponseSchema>;

export const BannerClickResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        success: z.boolean(),
    }),
    message: z.string().optional(),
});
export type BannerClickResponse = z.infer<typeof BannerClickResponseSchema>;

export const PriorityVendorListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        vendors: z.array(PriorityVendorSchema),
    }),
    message: z.string().optional(),
});
export type PriorityVendorListResponse = z.infer<typeof PriorityVendorListResponseSchema>;

export const PriorityPurchaseResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        purchase: AdPriorityPurchaseSchema,
    }),
    message: z.string().optional(),
});
export type PriorityPurchaseResponse = z.infer<typeof PriorityPurchaseResponseSchema>;

export const JumpupResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        success: z.boolean(),
        expiresAt: z.string(),
    }),
    message: z.string().optional(),
});
export type JumpupResponse = z.infer<typeof JumpupResponseSchema>;

export const VendorAdsResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(AdPriorityPurchaseSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});
export type VendorAdsResponse = z.infer<typeof VendorAdsResponseSchema>;

export const AdminCampaignListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(AdCampaignSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});
export type AdminCampaignListResponse = z.infer<typeof AdminCampaignListResponseSchema>;

export const AdminCampaignDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        campaign: AdCampaignSchema,
        creatives: z.array(AdCreativeSchema),
        slot: AdSlotSchema,
    }),
    message: z.string().optional(),
});
export type AdminCampaignDetailResponse = z.infer<typeof AdminCampaignDetailResponseSchema>;

export const AdminCampaignCreateResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        campaign: AdCampaignSchema,
    }),
    message: z.string().optional(),
});
export type AdminCampaignCreateResponse = z.infer<typeof AdminCampaignCreateResponseSchema>;

export const AdminAdReportResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(
            z.object({
                campaignId: zUuid,
                advertiserName: z.string(),
                totalImpressions: z.number().int(),
                totalClicks: z.number().int(),
                ctr: z.number(),
            }),
        ),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});
export type AdminAdReportResponse = z.infer<typeof AdminAdReportResponseSchema>;

export const AdminPriorityReportResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        slots: z.array(
            z.object({
                slot: AdPrioritySlotSchema,
                activePurchases: z.number().int(),
                categoryName: z.string(),
            }),
        ),
    }),
    message: z.string().optional(),
});
export type AdminPriorityReportResponse = z.infer<typeof AdminPriorityReportResponseSchema>;

export const PrioritySlotListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        slots: z.array(
            z.object({
                slot: AdPrioritySlotSchema,
                activePurchases: z.number().int(),
            }),
        ),
    }),
    message: z.string().optional(),
});
export type PrioritySlotListResponse = z.infer<typeof PrioritySlotListResponseSchema>;
