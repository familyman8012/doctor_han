import { SupportMessageCreateBodySchema } from "@/lib/schema/support";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { sendUserMessage } from "@/server/support/service";

type RouteParams = { id: string };

/**
 * POST /api/support/tickets/[id]/messages
 * Send a message to the ticket
 */
export const POST = withApi(
	withAuth<RouteParams>(async (ctx) => {
		const body = SupportMessageCreateBodySchema.parse(await ctx.req.json());

		const message = await sendUserMessage(ctx.supabase, ctx.user.id, ctx.params.id, body);

		return created({ message }, "메시지가 전송되었습니다.");
	}),
);
