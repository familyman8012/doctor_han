import { AdminVerificationListQuerySchema } from "@/lib/schema/admin";
import { internalServerError } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import {
    mapAdminDoctorVerificationListItemRow,
    mapAdminVendorVerificationListItemRow,
} from "@/server/admin/mapper";

function escapeLike(value: string): string {
    return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

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

        if (query.type === "doctor") {
            let qb = ctx.supabase.from("doctor_verifications").select(
                `
                    *,
                    user:profiles!doctor_verifications_user_id_fkey(
                        id, role, status, display_name, phone, email, created_at, updated_at
                    )
                `,
                { count: "exact" },
            );

            if (query.status) {
                qb = qb.eq("status", query.status);
            }

            if (query.q) {
                const escaped = escapeLike(query.q);
                qb = qb.or(
                    `license_no.ilike.%${escaped}%,full_name.ilike.%${escaped}%,clinic_name.ilike.%${escaped}%`,
                );
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
                items: (data ?? []).map((row: any) => mapAdminDoctorVerificationListItemRow(row)),
                page: query.page,
                pageSize: query.pageSize,
                total: count ?? 0,
            });
        }

        let qb = ctx.supabase.from("vendor_verifications").select(
            `
                *,
                user:profiles!vendor_verifications_user_id_fkey(
                    id, role, status, display_name, phone, email, created_at, updated_at
                )
            `,
            { count: "exact" },
        );

        if (query.status) {
            qb = qb.eq("status", query.status);
        }

        if (query.q) {
            const escaped = escapeLike(query.q);
            qb = qb.or(
                `business_no.ilike.%${escaped}%,company_name.ilike.%${escaped}%,contact_name.ilike.%${escaped}%,contact_phone.ilike.%${escaped}%,contact_email.ilike.%${escaped}%`,
            );
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
            items: (data ?? []).map((row: any) => mapAdminVendorVerificationListItemRow(row)),
            page: query.page,
            pageSize: query.pageSize,
            total: count ?? 0,
        });
    }),
);

