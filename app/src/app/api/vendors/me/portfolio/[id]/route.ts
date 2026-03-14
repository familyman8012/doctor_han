import { zUuid } from "@/lib/schema/common";
import { VendorPortfolioPatchBodySchema } from "@/lib/schema/vendor";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapVendorPortfolio, mapVendorPortfolioAsset } from "@/server/vendor/mapper";

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

export const PATCH = withApi(
    withRole<{ id: string }>(["vendor"], async (ctx) => {
        const portfolioId = zUuid.parse(ctx.params.id);
        const body = VendorPortfolioPatchBodySchema.parse(await ctx.req.json());

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

        const updateData: Record<string, unknown> = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder;
        if (body.tags !== undefined) updateData.tags = body.tags;
        if (body.isFeatured !== undefined) updateData.is_featured = body.isFeatured;

        const { data: updated, error: updateError } = await ctx.supabase
            .from("vendor_portfolios")
            .update(updateData)
            .eq("id", portfolioId)
            .eq("vendor_id", vendor.id)
            .select("*")
            .maybeSingle();

        if (updateError) {
            throw internalServerError("포트폴리오 수정에 실패했습니다.", {
                message: updateError.message,
                code: updateError.code,
            });
        }

        if (!updated) {
            throw notFound("포트폴리오를 찾을 수 없습니다.");
        }

        // 기존 에셋 조회
        const { data: assetRows, error: assetError } = await ctx.supabase
            .from("vendor_portfolio_assets")
            .select("*")
            .eq("portfolio_id", portfolioId)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });

        if (assetError) {
            throw internalServerError("포트폴리오 자산을 조회할 수 없습니다.", {
                message: assetError.message,
                code: assetError.code,
            });
        }

        const assets = (assetRows ?? []).map(mapVendorPortfolioAsset);

        return ok({ portfolio: mapVendorPortfolio(updated, assets) });
    }),
);
