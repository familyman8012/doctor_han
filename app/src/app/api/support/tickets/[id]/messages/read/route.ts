import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { markMessagesAsRead } from "@/server/support/service";

type RouteParams = { id: string };

/**
 * PATCH /api/support/tickets/[id]/messages/read
 * Mark all unread messages as read
 */
export const PATCH = withApi(
	withAuth<RouteParams>(async (ctx) => {
		const count = await markMessagesAsRead(ctx.supabase, ctx.user.id, ctx.params.id);

		return ok({ count });
	}),
);
