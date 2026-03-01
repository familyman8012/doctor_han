import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { listMembershipPlans } from "@/server/vendor/membership-service";

// GET /api/vendors/me/membership/plans — 멤버십 플랜 목록
export const GET = withApi(
    withApprovedVendor(async () => {
        const result = await listMembershipPlans();
        return ok(result);
    }),
);
