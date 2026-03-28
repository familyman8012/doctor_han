import { AdminLeadOpsListQuerySchema } from "@/lib/schema/beta-ops";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { listAdminLeadOps } from "@/server/beta-ops/repository";
import { withRole } from "@/server/auth/guards";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export const GET = withApi(
	withRole(["admin"], async (ctx) => {
		const { searchParams } = new URL(ctx.req.url);
		const query = AdminLeadOpsListQuerySchema.parse({
			status: searchParams.get("status") ?? undefined,
			vendorId: searchParams.get("vendorId") ?? undefined,
			from: searchParams.get("from") ?? undefined,
			to: searchParams.get("to") ?? undefined,
			page: searchParams.get("page") ?? undefined,
			pageSize: searchParams.get("pageSize") ?? undefined,
		});

		const admin = createSupabaseAdminClient();
		const result = await listAdminLeadOps(admin, query);

		return ok(result);
	}),
);
