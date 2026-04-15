import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { listActiveSlots } from "@/server/ad/repository";

/**
 * GET /api/admin/ads/slots
 * List active ad slots for admin dropdown
 */
export const GET = withApi(
	withRole(["admin"], async (ctx) => {
		const slots = await listActiveSlots(ctx.supabase);
		const items = slots.map((s) => ({
			id: s.id,
			name: s.name,
			position: s.position,
			maxCampaigns: s.max_campaigns,
		}));
		return ok({ items });
	}),
);
