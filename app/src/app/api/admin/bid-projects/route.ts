import { BidProjectListQuerySchema } from "@/lib/schema/bidding";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { listAllProjects } from "@/server/bidding/service";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = BidProjectListQuerySchema.parse({
            status: searchParams.get("status") || undefined,
            page: searchParams.get("page") || undefined,
            pageSize: searchParams.get("pageSize") || undefined,
        });

        const result = await listAllProjects(ctx.supabase, query);
        return ok(result);
    }),
);
