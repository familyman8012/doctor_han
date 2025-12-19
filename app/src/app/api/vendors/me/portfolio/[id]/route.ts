import { zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";

export const DELETE = withApi(
    withRole<{ id: string }>(["vendor"], async (ctx) => {
        const portfolioId = zUuid.parse(ctx.params.id);

        const { data: vendor, error: vendorError } = await ctx.supabase
            .from("vendors")
            .select("id")
            .eq("owner_user_id", ctx.user.id)
            .maybeSingle();

        if (vendorError) {
            throw internalServerError("업체 프로필을 확인할 수 없습니다.", {
                message: vendorError.message,
                code: vendorError.code,
            });
        }

        if (!vendor) {
            throw notFound("업체 프로필이 없습니다.");
        }

        const { data: deleted, error: deleteError } = await ctx.supabase
            .from("vendor_portfolios")
            .delete()
            .eq("id", portfolioId)
            .eq("vendor_id", vendor.id)
            .select("id")
            .maybeSingle();

        if (deleteError) {
            throw internalServerError("포트폴리오 삭제에 실패했습니다.", {
                message: deleteError.message,
                code: deleteError.code,
            });
        }

        if (!deleted) {
            throw notFound("포트폴리오를 찾을 수 없습니다.");
        }

        return ok({ id: deleted.id });
    }),
);
