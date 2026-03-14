/**
 * Price formatting utilities for vendor cards and detail pages.
 */

/** Verbose price format for detail pages: "2,000,000원" */
export function formatPrice(min: number | null, max: number | null): string {
    if (min === null && max === null) return "가격 문의";
    if (min === null) return `~${max!.toLocaleString()}원`;
    if (max === null) return `${min.toLocaleString()}원~`;
    if (min === max) return `${min.toLocaleString()}원`;
    return `${min.toLocaleString()}~${max.toLocaleString()}원`;
}

/** Compact price format for cards: "200만원~", "50만~100만원" */
export function formatPriceCompact(min: number | null, max: number | null): string {
    if (min === null && max === null) return "가격 문의";
    if (min === null) return `~${fmtCompact(max!)}`;
    if (max === null) return `${fmtCompact(min)}~`;
    if (min === max) return fmtCompact(min);
    return `${fmtCompactNoUnit(min)}~${fmtCompact(max)}`;
}

function fmtCompact(v: number): string {
    if (v >= 100_000_000) {
        const n = v / 100_000_000;
        return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}억원`;
    }
    if (v >= 10_000) {
        return `${Math.round(v / 10_000)}만원`;
    }
    return `${v.toLocaleString()}원`;
}

function fmtCompactNoUnit(v: number): string {
    if (v >= 100_000_000) {
        const n = v / 100_000_000;
        return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}억`;
    }
    if (v >= 10_000) {
        return `${Math.round(v / 10_000)}만`;
    }
    return `${v.toLocaleString()}`;
}
