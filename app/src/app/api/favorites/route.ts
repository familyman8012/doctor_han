import { internalServerError } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapVendorListItem } from "@/server/vendor/mapper";

export const GET = withApi(
    withRole(["doctor"], async (ctx) => {
        const { data, error } = await ctx.supabase
            .from("favorites")
            .select("created_at, vendor:vendors(*)")
            .eq("user_id", ctx.user.id)
            .order("created_at", { ascending: false });

        if (error) {
            throw internalServerError("찜 목록을 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        const items =
            (data ?? [])
                .map((row) => {
                    const vendor = row.vendor;
                    if (!vendor) return null;
                    return {
                        createdAt: row.created_at,
                        vendor: mapVendorListItem(vendor),
                    };
                })
                .filter(Boolean) ?? [];

        return ok({ items });
    }),
);

