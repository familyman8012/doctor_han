/**
 * Format date string to Korean locale format
 */
export function formatDateKo(
    dateStr: string,
    options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
    }
): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", options);
}

/**
 * Format date string to short Korean format (YYYY. MM. DD.)
 */
export function formatDateKoShort(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}
