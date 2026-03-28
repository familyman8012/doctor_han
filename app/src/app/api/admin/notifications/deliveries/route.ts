import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { listNotificationDeliveries } from "@/server/notification/repository";
import { z } from "zod";

const QuerySchema = z.object({
	status: z.enum(["pending", "sent", "failed"]).optional(),
	channel: z.enum(["email", "kakao", "sms", "in_app"]).optional(),
	userId: z.string().uuid().optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const GET = withApi(
	withRole(["admin"], async (ctx) => {
		const { searchParams } = new URL(ctx.req.url);
		const query = QuerySchema.parse({
			status: searchParams.get("status") ?? undefined,
			channel: searchParams.get("channel") ?? undefined,
			userId: searchParams.get("userId") ?? undefined,
			page: searchParams.get("page") ?? undefined,
			pageSize: searchParams.get("pageSize") ?? undefined,
		});

		const { items, total } = await listNotificationDeliveries(
			ctx.supabase,
			query,
		);

		return ok({
			items,
			page: query.page,
			pageSize: query.pageSize,
			total,
		});
	}),
);
