import "server-only";

import type { Granularity, TimeSeriesPoint } from "@/lib/schema/analytics";

/**
 * Aggregate timestamp rows into time-series buckets based on granularity.
 * Each item must have a `created_at` ISO string field.
 */
export function toTimeSeries(
    rows: { created_at: string }[],
    from: string,
    to: string,
    granularity: Granularity,
): TimeSeriesPoint[] {
    const buckets = generateBuckets(from, to, granularity);
    const bucketMap = new Map<string, number>();
    for (const bucket of buckets) {
        bucketMap.set(bucket, 0);
    }

    for (const row of rows) {
        const key = toBucketKey(row.created_at, granularity);
        const current = bucketMap.get(key);
        if (current !== undefined) {
            bucketMap.set(key, current + 1);
        }
    }

    return buckets.map((date) => ({
        date,
        value: bucketMap.get(date) ?? 0,
    }));
}

/**
 * Aggregate timestamp + amount rows into time-series buckets (summing amount).
 */
export function toAmountTimeSeries(
    rows: { created_at: string; amount: number }[],
    from: string,
    to: string,
    granularity: Granularity,
): TimeSeriesPoint[] {
    const buckets = generateBuckets(from, to, granularity);
    const bucketMap = new Map<string, number>();
    for (const bucket of buckets) {
        bucketMap.set(bucket, 0);
    }

    for (const row of rows) {
        const key = toBucketKey(row.created_at, granularity);
        const current = bucketMap.get(key);
        if (current !== undefined) {
            bucketMap.set(key, current + row.amount);
        }
    }

    return buckets.map((date) => ({
        date,
        value: bucketMap.get(date) ?? 0,
    }));
}

/**
 * Aggregate ad_impressions date rows into time-series buckets.
 */
export function toAdTimeSeries(
    rows: { date: string; impressions: number; clicks: number }[],
    from: string,
    to: string,
    granularity: Granularity,
): { impressions: TimeSeriesPoint[]; clicks: TimeSeriesPoint[] } {
    const buckets = generateBuckets(from, to, granularity);
    const impressionMap = new Map<string, number>();
    const clickMap = new Map<string, number>();

    for (const bucket of buckets) {
        impressionMap.set(bucket, 0);
        clickMap.set(bucket, 0);
    }

    for (const row of rows) {
        const key = toBucketKey(row.date, granularity);
        const currentImpressions = impressionMap.get(key);
        if (currentImpressions !== undefined) {
            impressionMap.set(key, currentImpressions + row.impressions);
        }
        const currentClicks = clickMap.get(key);
        if (currentClicks !== undefined) {
            clickMap.set(key, currentClicks + row.clicks);
        }
    }

    return {
        impressions: buckets.map((date) => ({ date, value: impressionMap.get(date) ?? 0 })),
        clicks: buckets.map((date) => ({ date, value: clickMap.get(date) ?? 0 })),
    };
}

// ============================================
// Internal helpers
// ============================================

function generateBuckets(from: string, to: string, granularity: Granularity): string[] {
    const buckets: string[] = [];
    const startDate = new Date(from + "T00:00:00Z");
    const endDate = new Date(to + "T00:00:00Z");
    const current =
        granularity === "weekly"
            ? startOfWeekUtc(startDate)
            : granularity === "monthly"
              ? startOfMonthUtc(startDate)
              : new Date(startDate);

    while (current <= endDate) {
        buckets.push(formatBucketDate(current, granularity));
        advanceDate(current, granularity);
    }

    return buckets;
}

function formatBucketDate(date: Date, granularity: Granularity): string {
    if (granularity === "monthly") {
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    }
    // daily and weekly both use YYYY-MM-DD (weekly uses the start of the week)
    return date.toISOString().slice(0, 10);
}

function advanceDate(date: Date, granularity: Granularity): void {
    switch (granularity) {
        case "daily":
            date.setUTCDate(date.getUTCDate() + 1);
            break;
        case "weekly":
            date.setUTCDate(date.getUTCDate() + 7);
            break;
        case "monthly":
            date.setUTCMonth(date.getUTCMonth() + 1);
            break;
    }
}

function toBucketKey(dateStr: string, granularity: Granularity): string {
    // dateStr could be ISO timestamp "2026-03-10T12:00:00Z" or just date "2026-03-10"
    const d = dateStr.slice(0, 10); // extract YYYY-MM-DD

    if (granularity === "monthly") {
        return d.slice(0, 7); // YYYY-MM
    }

    if (granularity === "weekly") {
        return startOfWeekUtc(new Date(d + "T00:00:00Z")).toISOString().slice(0, 10);
    }

    return d; // daily
}

function startOfWeekUtc(date: Date): Date {
    const current = new Date(date);
    const day = current.getUTCDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0
    current.setUTCDate(current.getUTCDate() - diff);
    current.setUTCHours(0, 0, 0, 0);
    return current;
}

function startOfMonthUtc(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}
