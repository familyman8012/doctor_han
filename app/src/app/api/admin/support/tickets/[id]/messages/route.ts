import { SupportMessageCreateBodySchema } from "@/lib/schema/support";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { sendAdminMessage } from "@/server/support/service";

type RouteParams = { id: string };

/**
 * POST /api/admin/support/tickets/[id]/messages
 * Send a message from admin
 */
export const POST = withApi(
	withRole<RouteParams>(["admin"], async (ctx) => {
		const body = SupportMessageCreateBodySchema.parse(await ctx.req.json());

		const message = await sendAdminMessage(
			ctx.supabase,
			ctx.user.id,
			ctx.params.id,
			body,
		);

		return created({ message }, "메시지가 전송되었습니다.");
	}),
);
