import { AdminVerificationListQuerySchema } from "@/lib/schema/admin";
import { internalServerError } from "@/server/api/errors";
import { buildOrIlikeFilter } from "@/server/api/postgrest";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import {
    mapAdminDoctorVerificationListItemRow,
    mapAdminVendorVerificationListItemRow,
} from "@/server/admin/mapper";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = AdminVerificationListQuerySchema.parse({
            type: searchParams.get("type") ?? undefined,
            status: searchParams.get("status") ?? undefined,
            q: searchParams.get("q") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });

        const from = (query.page - 1) * query.pageSize;
        const to = from + query.pageSize - 1;

        // 전체 조회: 양쪽 테이블 합산
        if (!query.type) {
            let dqb = ctx.supabase.from("doctor_verifications").select(
                `*, user:profiles!doctor_verifications_user_id_fkey(*)`,
                { count: "exact" },
            );
            let vqb = ctx.supabase.from("vendor_verifications").select(
                `*, user:profiles!vendor_verifications_user_id_fkey(*)`,
                { count: "exact" },
            );

            if (query.status) {
                dqb = dqb.eq("status", query.status);
                vqb = vqb.eq("status", query.status);
            }
            if (query.q) {
                const dFilter = buildOrIlikeFilter(["license_no", "full_name", "clinic_name"], query.q);
                if (dFilter) dqb = dqb.or(dFilter);
                const vFilter = buildOrIlikeFilter(["business_no", "company_name", "contact_name", "contact_phone", "contact_email"], query.q);
                if (vFilter) vqb = vqb.or(vFilter);
            }

            dqb = dqb.order("created_at", { ascending: false });
            vqb = vqb.order("created_at", { ascending: false });

            const [dRes, vRes] = await Promise.all([dqb, vqb]);
            if (dRes.error) throw internalServerError("조회 실패", { message: dRes.error.message });
            if (vRes.error) throw internalServerError("조회 실패", { message: vRes.error.message });

            const allItems = [
                ...(dRes.data ?? []).map((row) => ({ ...mapAdminDoctorVerificationListItemRow(row), _createdAt: row.created_at })),
                ...(vRes.data ?? []).map((row) => ({ ...mapAdminVendorVerificationListItemRow(row), _createdAt: row.created_at })),
            ].sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());

            const total = (dRes.count ?? 0) + (vRes.count ?? 0);
            const paged = allItems.slice(from, to + 1).map(({ _createdAt, ...rest }) => rest);

            return ok({ type: "all" as const, items: paged, page: query.page, pageSize: query.pageSize, total });
        }

        if (query.type === "doctor") {
            let qb = ctx.supabase.from("doctor_verifications").select(
                `
                    *,
                    user:profiles!doctor_verifications_user_id_fkey(*)
                `,
                { count: "exact" },
            );

            if (query.status) {
                qb = qb.eq("status", query.status);
            }

            if (query.q) {
                const orFilter = buildOrIlikeFilter(["license_no", "full_name", "clinic_name"], query.q);
                if (orFilter) {
                    qb = qb.or(orFilter);
                }
            }

            qb = qb.order("created_at", { ascending: false });

            const { data, error, count } = await qb.range(from, to);

            if (error) {
                throw internalServerError("승인 큐를 조회할 수 없습니다.", {
                    message: error.message,
                    code: error.code,
                });
            }

            return ok({
                type: "doctor" as const,
                items: (data ?? []).map((row) => mapAdminDoctorVerificationListItemRow(row)),
                page: query.page,
                pageSize: query.pageSize,
                total: count ?? 0,
            });
        }

        let qb = ctx.supabase.from("vendor_verifications").select(
            `
                *,
                user:profiles!vendor_verifications_user_id_fkey(*)
            `,
            { count: "exact" },
        );

        if (query.status) {
            qb = qb.eq("status", query.status);
        }

        if (query.q) {
            const orFilter = buildOrIlikeFilter(
                ["business_no", "company_name", "contact_name", "contact_phone", "contact_email"],
                query.q,
            );
            if (orFilter) {
                qb = qb.or(orFilter);
            }
        }

        qb = qb.order("created_at", { ascending: false });

        const { data, error, count } = await qb.range(from, to);

        if (error) {
            throw internalServerError("승인 큐를 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        return ok({
            type: "vendor" as const,
            items: (data ?? []).map((row) => mapAdminVendorVerificationListItemRow(row)),
            page: query.page,
            pageSize: query.pageSize,
            total: count ?? 0,
        });
    }),
);
