import { zUuid } from "@/lib/schema/common";
import { LeadMessageCreateBodySchema, LeadMessagesListQuerySchema } from "@/lib/schema/lead";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { getMessages, sendMessage } from "@/server/lead/message-service";

/**
 * GET /api/leads/[id]/messages
 * 메시지 목록 조회 (페이지네이션)
 */
export const GET = withApi(
    withAuth<{ id: string }>(async (ctx) => {
        const leadId = zUuid.parse(ctx.params.id);

        const query = LeadMessagesListQuerySchema.parse(
            Object.fromEntries(new URL(ctx.req.url).searchParams),
        );

        const result = await getMessages(
            ctx.supabase,
            leadId,
            query,
            ctx.user.id,
            ctx.profile.role,
        );

        return ok(result);
    }),
);

/**
 * POST /api/leads/[id]/messages
 * 메시지 발송
 */
export const POST = withApi(
    withAuth<{ id: string }>(async (ctx) => {
        const leadId = zUuid.parse(ctx.params.id);

        const body = LeadMessageCreateBodySchema.parse(await ctx.req.json());

        const message = await sendMessage(
            ctx.supabase,
            leadId,
            body,
            ctx.user.id,
            ctx.profile.role,
        );

        return created({ message });
    }),
);
