import { AdminStatusHistoryQuerySchema } from "@/lib/schema/beta-ops";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { mapAdminStatusHistoryItem } from "@/server/beta-ops/mapper";
import { listAdminStatusHistory } from "@/server/beta-ops/repository";
import { withRole } from "@/server/auth/guards";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export const GET = withApi(
	withRole(["admin"], async (ctx) => {
		const { searchParams } = new URL(ctx.req.url);
		const query = AdminStatusHistoryQuerySchema.parse({
			leadId: searchParams.get("leadId") ?? undefined,
			vendorId: searchParams.get("vendorId") ?? undefined,
			from: searchParams.get("from") ?? undefined,
			to: searchParams.get("to") ?? undefined,
			page: searchParams.get("page") ?? undefined,
			pageSize: searchParams.get("pageSize") ?? undefined,
		});

		const admin = createSupabaseAdminClient();
		const result = await listAdminStatusHistory(admin, query);

		// Compute timeSincePreviousChange per lead by grouping items by lead_id
		const leadGrouped = new Map<string, typeof result.items>();
		for (const item of result.items) {
			const group = leadGrouped.get(item.lead_id) ?? [];
			group.push(item);
			leadGrouped.set(item.lead_id, group);
		}

		// Items are ordered desc; within each lead group, sort asc to find previous change
		const previousChangeMap = new Map<string, number | null>();
		for (const [, group] of leadGrouped) {
			const sorted = [...group].sort(
				(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
			);
			for (let i = 0; i < sorted.length; i++) {
				if (i === 0) {
					previousChangeMap.set(sorted[i].id, null);
				} else {
					const delta =
						(new Date(sorted[i].created_at).getTime() -
							new Date(sorted[i - 1].created_at).getTime()) /
						60000;
					previousChangeMap.set(sorted[i].id, Math.round(delta * 100) / 100);
				}
			}
		}

		const items = result.items.map((row) =>
			mapAdminStatusHistoryItem(row, previousChangeMap.get(row.id) ?? null),
		);

		return ok({
			items,
			page: query.page,
			pageSize: query.pageSize,
			total: result.total,
		});
	}),
);
