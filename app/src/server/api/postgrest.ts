import "server-only";

/**
 * PostgREST `or=(...)` filter uses `,` and parentheses as syntax separators.
 * If user input contains these characters, `.or(...)` can break and return 4xx.
 *
 * We keep this intentionally conservative: strip only syntax-breaking chars and
 * normalize whitespace.
 */
export function sanitizePostgrestOrValue(value: string): string {
    return value
        .replace(/[(),]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Escape characters that are special in SQL LIKE/ILIKE patterns.
 * - % and _ are wildcards
 * - \ is the escape char itself
 */
export function escapeLikePattern(value: string): string {
    return value.replace(/[%_\\]/g, "\\$&");
}

/**
 * Build a PostgREST `.or(...)` expression for multiple ILIKE fields.
 *
 * Example:
 * - fields: ["title", "content"], q: "hello"
 * - returns: "title.ilike.%hello%,content.ilike.%hello%"
 */
export function buildOrIlikeFilter(fields: readonly string[], q: string): string | null {
    const sanitized = sanitizePostgrestOrValue(q);
    if (!sanitized) return null;
    const escaped = escapeLikePattern(sanitized);
    return fields.map((field) => `${field}.ilike.%${escaped}%`).join(",");
}

