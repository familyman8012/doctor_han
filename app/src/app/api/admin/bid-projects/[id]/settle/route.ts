import { zUuid } from "@/lib/schema/common";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { settleBidCommission } from "@/server/bidding/commission-service";
import { getBidContract } from "@/server/bidding/repository";
import { notFound } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export const POST = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const projectId = zUuid.parse(ctx.params.id);

        // 프로젝트의 계약 조회
        const admin = createSupabaseAdminClient();
        const contract = await getBidContract(admin, projectId);
        if (!contract) {
            throw notFound("해당 프로젝트의 계약을 찾을 수 없습니다.");
        }

        const result = await settleBidCommission(ctx.supabase, contract.id);
        return ok({ contract: result });
    }),
);
