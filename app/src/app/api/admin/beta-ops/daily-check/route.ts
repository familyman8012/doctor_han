import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { getDailyCheckMetrics } from "@/server/beta-ops/service";
import { withRole } from "@/server/auth/guards";

export const GET = withApi(
	withRole(["admin"], async () => {
		const data = await getDailyCheckMetrics();
		return ok(data);
	}),
);
