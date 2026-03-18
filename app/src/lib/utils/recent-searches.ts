const STORAGE_KEY = "medihub_recent_searches";
const MAX_RECENT = 10;

export function getRecentSearches(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
    } catch {
        return [];
    }
}

export function addRecentSearch(term: string): void {
    if (typeof window === "undefined") return;
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
        const current = getRecentSearches();
        const filtered = current.filter((s) => s !== trimmed);
        const updated = [trimmed, ...filtered].slice(0, MAX_RECENT);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
        // localStorage 접근 실패 시 무시
    }
}

export function removeRecentSearch(term: string): void {
    if (typeof window === "undefined") return;
    try {
        const current = getRecentSearches();
        const updated = current.filter((s) => s !== term);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
        // localStorage 접근 실패 시 무시
    }
}

export function clearRecentSearches(): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // localStorage 접근 실패 시 무시
    }
}
