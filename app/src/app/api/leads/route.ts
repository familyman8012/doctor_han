import { LeadCreateBodySchema, LeadListQuerySchema } from "@/lib/schema/lead";
import { internalServerError, notFound } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedDoctor, withAuth } from "@/server/auth/guards";
import { mapLeadRow, mapLeadVendorSummary } from "@/server/lead/mapper";
import { fetchLeadDetail } from "@/server/lead/repository";

export const GET = withApi(
    withAuth(async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = LeadListQuerySchema.parse({
            status: searchParams.get("status") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });

        const from = (query.page - 1) * query.pageSize;
        const to = from + query.pageSize - 1;

        let qb = ctx.supabase.from("leads").select("*, vendor:vendors(id, name)", { count: "exact" });

        if (query.status) {
            qb = qb.eq("status", query.status);
        }

        qb = qb.order("created_at", { ascending: false });

        const { data, error, count } = await qb.range(from, to);
        if (error) {
            throw internalServerError("리드 목록을 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        return ok({
            items: (data ?? []).map((row: any) =>
                mapLeadRow(row, mapLeadVendorSummary((row as any).vendor as any)),
            ),
            page: query.page,
            pageSize: query.pageSize,
            total: count ?? 0,
        });
    }),
);

export const POST = withApi(
    withApprovedDoctor(async (ctx) => {
        const body = LeadCreateBodySchema.parse(await ctx.req.json());

        // 대상 업체가 공개 상태인지 확인 (RLS로 비공개면 조회되지 않는다)
        const { data: vendor, error: vendorError } = await ctx.supabase
            .from("vendors")
            .select("id, name")
            .eq("id", body.vendorId)
            .maybeSingle();

        if (vendorError) {
            throw internalServerError("업체를 확인할 수 없습니다.", {
                message: vendorError.message,
                code: vendorError.code,
            });
        }

        if (!vendor) {
            throw notFound("업체를 찾을 수 없습니다.");
        }

        const { data: lead, error: leadError } = await ctx.supabase
            .from("leads")
            .insert({
                doctor_user_id: ctx.user.id,
                vendor_id: body.vendorId,
                service_name: body.serviceName ?? null,
                contact_name: body.contactName,
                contact_phone: body.contactPhone,
                contact_email: body.contactEmail ?? null,
                preferred_channel: body.preferredChannel ?? null,
                preferred_time: body.preferredTime ?? null,
                content: body.content,
                status: "submitted",
            })
            .select("*")
            .single();

        if (leadError) {
            throw internalServerError("리드 생성에 실패했습니다.", {
                message: leadError.message,
                code: leadError.code,
            });
        }

        // 상태 이력은 best-effort로 기록한다 (트랜잭션이 아니므로 실패해도 생성 자체는 유지)
        const historyResult = await ctx.supabase.from("lead_status_history").insert({
            lead_id: lead.id,
            from_status: null,
            to_status: lead.status,
            changed_by: ctx.user.id,
        });

        if (historyResult.error) {
            console.error("[POST /api/leads] lead_status_history insert failed", historyResult.error);
        }

        if (body.attachmentFileIds && body.attachmentFileIds.length > 0) {
            const { error: attachmentError } = await ctx.supabase.from("lead_attachments").insert(
                body.attachmentFileIds.map((fileId) => ({
                    lead_id: lead.id,
                    file_id: fileId,
                    created_by: ctx.user.id,
                })),
            );

            if (attachmentError) {
                // 파일/권한 정책은 후속(File API)에서 보강되므로, 여기서는 생성 실패를 치명적으로 보지 않는다.
                console.error("[POST /api/leads] lead_attachments insert failed", attachmentError);
            }
        }

        const detail = await fetchLeadDetail(ctx.supabase, lead.id);
        return created({ lead: detail });
    }),
);
