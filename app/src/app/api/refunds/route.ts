import { CreateRefundRequestBodySchema, RefundRequestListQuerySchema } from "@/lib/schema/refund";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { createRefundRequest, getMyRefundRequests } from "@/server/refund/service";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { getVendorIdByUserId } from "@/server/vendor/utils";

export const GET = withApi(
    withApprovedVendor(async (ctx) => {
        const admin = createSupabaseAdminClient();
        const vendorId = await getVendorIdByUserId(admin, ctx.user.id);

        const url = new URL(ctx.req.url);
        const query = RefundRequestListQuerySchema.parse({
            status: url.searchParams.get("status") ?? undefined,
            page: url.searchParams.get("page") ?? undefined,
            pageSize: url.searchParams.get("pageSize") ?? undefined,
        });

        const result = await getMyRefundRequests(vendorId, query);
        return ok(result);
    }),
);

export const POST = withApi(
    withApprovedVendor(async (ctx) => {
        const admin = createSupabaseAdminClient();
        const vendorId = await getVendorIdByUserId(admin, ctx.user.id);

        const body = CreateRefundRequestBodySchema.parse(await ctx.req.json());

        const refundRequest = await createRefundRequest({
            leadChargeId: body.leadChargeId,
            vendorId,
            requesterUserId: ctx.user.id,
            reason: body.reason,
            description: body.description,
        });

        return created(refundRequest);
    }),
);
