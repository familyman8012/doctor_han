import { VendorServicePriceCreateBodySchema } from "@/lib/schema/vendor-pricing";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { createPrice, listPrices } from "@/server/vendor/pricing-service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

export const GET = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const result = await listPrices(ctx.supabase, vendorId);
        return ok(result);
    }),
);

export const POST = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const body = VendorServicePriceCreateBodySchema.parse(await ctx.req.json());
        const price = await createPrice(ctx.supabase, vendorId, body);
        return created({ price });
    }),
);
