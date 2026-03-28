import { VendorGradeListQuerySchema } from "@/lib/schema/beta-ops";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { getVendorGradeMetrics } from "@/server/beta-ops/service";
import { withRole } from "@/server/auth/guards";

export const GET = withApi(
	withRole(["admin"], async (ctx) => {
		const { searchParams } = new URL(ctx.req.url);
		const query = VendorGradeListQuerySchema.parse({
			from: searchParams.get("from") ?? undefined,
			to: searchParams.get("to") ?? undefined,
		});

		const data = await getVendorGradeMetrics(query);

		return ok(data);
	}),
);
