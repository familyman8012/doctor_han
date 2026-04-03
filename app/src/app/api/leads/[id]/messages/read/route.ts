import { zUuid } from "@/lib/schema/common";
import { LeadMessageReadPatchBodySchema } from "@/lib/schema/lead";
import { badRequest } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { markAsRead } from "@/server/lead/message-service";

/**
 * PATCH /api/leads/[id]/messages/read
 * 메시지 읽음 표시 (bulk)
 */
export const PATCH = withApi(
    withAuth<{ id: string }>(async (ctx) => {
        const leadId = zUuid.parse(ctx.params.id);
        const rawBody = await ctx.req.text();

        let payload: unknown = {};
        if (rawBody.trim()) {
            try {
                payload = JSON.parse(rawBody);
            } catch {
                throw badRequest("요청 본문이 올바르지 않습니다.");
            }
        }

        const body = LeadMessageReadPatchBodySchema.parse(payload);

        await markAsRead(
            ctx.supabase,
            leadId,
            body.messageIds,
            ctx.user.id,
            ctx.profile.role,
        );

        return ok(null);
    }),
);
