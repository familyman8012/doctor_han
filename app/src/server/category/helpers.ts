import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 주어진 categoryId의 자신 + 모든 하위(descendant) 카테고리 id를 반환.
 *
 * 상품/업체 목록 API에서 상위 카테고리 선택 시 하위 카테고리까지 포함해서 조회하기 위함.
 * (예: "한약재" 선택 시 하위 "일반", "녹용" 카테고리의 상품도 같이 노출)
 */
export async function getCategoryWithDescendantIds(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: SupabaseClient<any, any, any>,
    categoryId: string,
): Promise<string[]> {
    const { data, error } = await supabase
        .from("categories")
        .select("id, parent_id");

    if (error || !data) return [categoryId];

    const rows = data as Array<{ id: string; parent_id: string | null }>;
    const childrenMap = new Map<string, string[]>();
    for (const row of rows) {
        if (row.parent_id) {
            const list = childrenMap.get(row.parent_id) ?? [];
            list.push(row.id);
            childrenMap.set(row.parent_id, list);
        }
    }

    const collected = new Set<string>([categoryId]);
    const queue: string[] = [categoryId];
    while (queue.length > 0) {
        const current = queue.shift()!;
        const children = childrenMap.get(current) ?? [];
        for (const childId of children) {
            if (!collected.has(childId)) {
                collected.add(childId);
                queue.push(childId);
            }
        }
    }

    return Array.from(collected);
}
