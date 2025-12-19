import { zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { fetchVendorCategories, fetchVendorPortfolios } from "@/server/vendor/repository";
import { mapVendorDetail } from "@/server/vendor/mapper";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

export const GET = withApi(async (_req: NextRequest, routeCtx: { params: { id: string } }) => {
    const vendorId = zUuid.parse(routeCtx.params.id);
    const supabase = await createSupabaseServerClient();

    const { data: vendorRow, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", vendorId)
        .maybeSingle();

    if (vendorError) {
        throw internalServerError("업체를 조회할 수 없습니다.", {
            message: vendorError.message,
            code: vendorError.code,
        });
    }

    if (!vendorRow) {
        throw notFound("업체를 찾을 수 없습니다.");
    }

    const [categories, portfolios] = await Promise.all([
        fetchVendorCategories(supabase, vendorId),
        fetchVendorPortfolios(supabase, vendorId),
    ]);

    return ok({
        vendor: mapVendorDetail({ vendor: vendorRow, categories, portfolios }),
    });
});
