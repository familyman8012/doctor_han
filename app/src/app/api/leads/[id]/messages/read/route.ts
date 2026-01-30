import { zUuid } from "@/lib/schema/common";
import { LeadMessageReadPatchBodySchema } from "@/lib/schema/lead";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { markAsRead } from "@/server/lead/message-service";
import { NextResponse } from "next/server";

/**
 * PATCH /api/leads/[id]/messages/read
 * 메시지 읽음 표시 (bulk)
 */
export const PATCH = withApi(
    withAuth<{ id: string }>(async (ctx) => {
        const leadId = zUuid.parse(ctx.params.id);

        const body = LeadMessageReadPatchBodySchema.parse(await ctx.req.json());

        await markAsRead(
            ctx.supabase,
            leadId,
            body.messageIds,
            ctx.user.id,
            ctx.profile.role,
        );

        return new NextResponse(null, { status: 204 });
    }),
);
