import { VendorPortfolioCreateBodySchema } from "@/lib/schema/vendor";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapVendorPortfolio, mapVendorPortfolioAsset } from "@/server/vendor/mapper";

export const POST = withApi(
    withRole(["vendor"], async (ctx) => {
        const body = VendorPortfolioCreateBodySchema.parse(await ctx.req.json());

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

        const { data: portfolio, error: portfolioError } = await ctx.supabase
            .from("vendor_portfolios")
            .insert({
                vendor_id: vendor.id,
                title: body.title,
                description: body.description ?? null,
                sort_order: body.sortOrder ?? 0,
            })
            .select("*")
            .single();

        if (portfolioError) {
            throw internalServerError("포트폴리오 생성에 실패했습니다.", {
                message: portfolioError.message,
                code: portfolioError.code,
            });
        }

        let assets: ReturnType<typeof mapVendorPortfolioAsset>[] = [];
        if (body.assets && body.assets.length > 0) {
            const { data: assetRows, error: assetError } = await ctx.supabase
                .from("vendor_portfolio_assets")
                .insert(
                    body.assets.map((asset, index) => ({
                        portfolio_id: portfolio.id,
                        file_id: asset.fileId ?? null,
                        url: asset.url ?? null,
                        sort_order: asset.sortOrder ?? index,
                    })),
                )
                .select("*");

            if (assetError) {
                if (assetError.code === "23503") {
                    throw badRequest("파일 정보가 올바르지 않습니다.", {
                        message: assetError.message,
                        code: assetError.code,
                    });
                }

                throw internalServerError("포트폴리오 자산 생성에 실패했습니다.", {
                    message: assetError.message,
                    code: assetError.code,
                });
            }

            assets = (assetRows ?? []).map(mapVendorPortfolioAsset);
        }

        return created({
            portfolio: mapVendorPortfolio(portfolio, assets),
        });
    }),
);

