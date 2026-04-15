import type { Tables } from "@/lib/database.types";
import { AdminVendorListQuerySchema } from "@/lib/schema/admin";
import { internalServerError } from "@/server/api/errors";
import { buildOrIlikeFilter } from "@/server/api/postgrest";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapAdminVendorListItemRow } from "@/server/admin/mapper";

type VendorVerificationRow = Tables<"vendor_verifications">;

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const raw: Record<string, string> = {};
        for (const key of ["status", "categoryId", "q", "page", "pageSize"]) {
            const val = searchParams.get(key);
            if (val !== null) raw[key] = val;
        }
        const query = AdminVendorListQuerySchema.parse(raw);

        const from = (query.page - 1) * query.pageSize;
        const to = from + query.pageSize - 1;

        let qb = ctx.supabase.from("vendors").select(
            `
                *,
                owner:profiles!vendors_owner_user_id_fkey(*),
                vendor_categories(
                    category:categories(*)
                )
            `,
            { count: "exact" },
        );

        if (query.status) {
            qb = qb.eq("status", query.status);
        }

        if (query.categoryId) {
            // vendor_categories를 통해 특정 카테고리에 속한 업체만 필터
            const { data: vcRows } = await ctx.supabase
                .from("vendor_categories")
                .select("vendor_id")
                .eq("category_id", query.categoryId);
            const vendorIds = (vcRows ?? []).map((r) => r.vendor_id);
            if (vendorIds.length === 0) {
                return ok({ items: [], page: query.page, pageSize: query.pageSize, total: 0 });
            }
            qb = qb.in("id", vendorIds);
        }

        if (query.q) {
            const orFilter = buildOrIlikeFilter(["name", "summary", "description"], query.q);
            if (orFilter) {
                qb = qb.or(orFilter);
            }
        }

        qb = qb.order("created_at", { ascending: false });

        const { data, error, count } = await qb.range(from, to);

        if (error) {
            throw internalServerError("업체 목록을 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        const ownerIds = Array.from(new Set((data ?? []).map((row) => row.owner_user_id).filter(Boolean)));
        const verificationByUserId = new Map<string, VendorVerificationRow>();

        if (ownerIds.length > 0) {
            const { data: verifications, error: verificationError } = await ctx.supabase
                .from("vendor_verifications")
                .select("*")
                .in("user_id", ownerIds);

            if (verificationError) {
                throw internalServerError("업체 인증 정보를 조회할 수 없습니다.", {
                    message: verificationError.message,
                    code: verificationError.code,
                });
            }

            for (const row of verifications ?? []) {
                verificationByUserId.set(row.user_id, row);
            }
        }

        const items = (data ?? []).map((row) => {
            const owner = row.owner;
            if (!owner) {
                throw internalServerError("업체 소유자 정보를 조회할 수 없습니다.");
            }

            const categories = (row.vendor_categories ?? [])
                .map((rel) => rel.category)
                .filter(Boolean);

            return mapAdminVendorListItemRow({
                vendor: row,
                owner,
                categories,
                vendorVerification: verificationByUserId.get(row.owner_user_id) ?? null,
            });
        });

        return ok({
            items,
            page: query.page,
            pageSize: query.pageSize,
            total: count ?? 0,
        });
    }),
);
