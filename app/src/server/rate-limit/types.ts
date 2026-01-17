export type RateLimitAction = "lead_create" | "review_create" | "file_upload" | "verification_submit";

export interface RateLimitCheckResult {
    allowed: boolean;
    remaining?: number;
    resetAt?: Date;
    retryAfterSeconds?: number;
}

export interface RateLimitConfig {
    daily?: number;
    weekly?: number;
    sameTargetCooldownHours?: number;
}
