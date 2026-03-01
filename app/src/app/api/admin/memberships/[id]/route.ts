import { zUuid } from "@/lib/schema/common";
import { AdminMembershipUpdateBodySchema } from "@/lib/schema/vendor-membership";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { cancelMembershipAdmin } from "@/server/vendor/membership-service";

// PATCH /api/admin/memberships/[id] — 멤버십 상태 변경 (취소)
export const PATCH = withApi(
    withRole(["admin"], async (ctx) => {
        const id = zUuid.parse((await ctx.params).id);
        const body = AdminMembershipUpdateBodySchema.parse(await ctx.req.json());

        if (body.status === "canceled") {
            const result = await cancelMembershipAdmin(id);
            return ok(result);
        }

        // 현재는 canceled만 지원
        return ok({ membership: null });
    }),
);
