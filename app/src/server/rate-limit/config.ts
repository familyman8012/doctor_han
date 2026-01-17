import type { RateLimitAction, RateLimitConfig } from "./types";

export const RATE_LIMIT_CONFIG: Record<RateLimitAction, RateLimitConfig> = {
    lead_create: {
        daily: 10,
        weekly: 50,
        sameTargetCooldownHours: 12,
    },
    review_create: {
        daily: 10,
    },
    file_upload: {
        daily: 30,
    },
    verification_submit: {
        daily: 3,
    },
} as const;
