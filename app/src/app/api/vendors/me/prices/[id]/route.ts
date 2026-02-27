import { VendorServicePricePatchBodySchema } from "@/lib/schema/vendor-pricing";
import { zUuid } from "@/lib/schema/common";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { deletePrice, updatePrice } from "@/server/vendor/pricing-service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

export const PATCH = withApi(
    withApprovedVendor<{ id: string }>(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const id = zUuid.parse(ctx.params.id);
        const body = VendorServicePricePatchBodySchema.parse(await ctx.req.json());
        const price = await updatePrice(ctx.supabase, vendorId, id, body);
        return ok({ price });
    }),
);

export const DELETE = withApi(
    withApprovedVendor<{ id: string }>(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const id = zUuid.parse(ctx.params.id);
        const price = await deletePrice(ctx.supabase, vendorId, id);
        return ok({ price });
    }),
);
