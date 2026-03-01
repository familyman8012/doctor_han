import { AdminMembershipListQuerySchema } from "@/lib/schema/vendor-membership";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { listMembershipsAdmin } from "@/server/vendor/membership-service";

// GET /api/admin/memberships — 멤버십 목록 (admin)
export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = AdminMembershipListQuerySchema.parse({
            status: searchParams.get("status") ?? undefined,
            vendorId: searchParams.get("vendorId") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });
        const result = await listMembershipsAdmin(query);
        return ok(result);
    }),
);
