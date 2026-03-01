import { BidProjectCreateBodySchema, BidProjectListQuerySchema } from "@/lib/schema/bidding";
import { forbidden } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedDoctor, withAuth } from "@/server/auth/guards";
import { createBidProject, listAllProjects, listDoctorProjects, listVendorProjects } from "@/server/bidding/service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

export const POST = withApi(
    withApprovedDoctor(async (ctx) => {
        const body = BidProjectCreateBodySchema.parse(await ctx.req.json());
        const project = await createBidProject(ctx.supabase, ctx.user.id, body);
        return created({ project });
    }),
);

export const GET = withApi(
    withAuth(async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = BidProjectListQuerySchema.parse({
            status: searchParams.get("status") || undefined,
            page: searchParams.get("page") || undefined,
            pageSize: searchParams.get("pageSize") || undefined,
        });

        if (ctx.profile.role === "doctor") {
            const result = await listDoctorProjects(ctx.supabase, ctx.user.id, query);
            return ok(result);
        }

        if (ctx.profile.role === "vendor") {
            const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
            const result = await listVendorProjects(ctx.supabase, vendorId, query);
            return ok(result);
        }

        if (ctx.profile.role === "admin") {
            const result = await listAllProjects(ctx.supabase, query);
            return ok(result);
        }

        throw forbidden();
    }),
);
