import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getBetaRewardStatus } from "@/server/beta-ops/rewards-service";

export const GET = withApi(
    withRole(["admin"], async () => {
        const items = await getBetaRewardStatus();
        return ok({ items });
    }),
);
