import { LeadCreateBodySchema, LeadListQuerySchema } from "@/lib/schema/lead";
import { badRequest, internalServerError, notFound, tooManyRequests } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedDoctor, withAuth } from "@/server/auth/guards";
import { calculateChargeAmount, processLeadCharge } from "@/server/lead/charge-service";
import { mapLeadRow, mapLeadVendorSummary } from "@/server/lead/mapper";
import { fetchLeadDetail } from "@/server/lead/repository";
import { getKakaoLeadChargedTemplate } from "@/server/notification/kakao-templates";
import { sendVendorNotification } from "@/server/notification/service";
import { getLeadChargedTemplate } from "@/server/notification/templates";
import { checkRateLimit, incrementRateLimit, logRateLimitExceeded } from "@/server/rate-limit";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { hasActiveMembership } from "@/server/vendor/membership-service";

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
            items: (data ?? []).map((row) =>
                mapLeadRow(row, mapLeadVendorSummary(row.vendor)),
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

        // Rate limit 체크
        const rateCheck = await checkRateLimit(ctx.user.id, "lead_create", body.vendorId);
        if (!rateCheck.allowed) {
            await logRateLimitExceeded(ctx.user.id, "lead_create", { vendorId: body.vendorId });
            throw tooManyRequests("리드 생성 횟수를 초과했습니다.", {
                resetAt: rateCheck.resetAt?.toISOString(),
                retryAfter: rateCheck.retryAfterSeconds,
            });
        }

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

        // S등급 업체 멤버십 확인: 미납 && 유예기간 아니면 리드 차단
        const admin = createSupabaseAdminClient();
        const { data: vendorSGradeCategories, error: vendorSGradeCategoriesError } = await admin
            .from("vendor_categories")
            .select("category_id, categories!inner(tier)")
            .eq("vendor_id", body.vendorId)
            .eq("categories.tier", "s_grade")
            .limit(1);

        if (vendorSGradeCategoriesError) {
            throw internalServerError("업체 S등급 여부를 확인할 수 없습니다.", {
                message: vendorSGradeCategoriesError.message,
                code: vendorSGradeCategoriesError.code,
            });
        }

        if (vendorSGradeCategories && vendorSGradeCategories.length > 0) {
            const MEMBERSHIP_GRACE_PERIOD_END = "2026-04-01T00:00:00+09:00";
            const inGracePeriod = new Date().getTime() < new Date(MEMBERSHIP_GRACE_PERIOD_END).getTime();

            if (!inGracePeriod) {
                const hasMembership = await hasActiveMembership(ctx.supabase, body.vendorId);
                if (!hasMembership) {
                    throw badRequest("입점비 미납 상태로 리드를 받을 수 없습니다.");
                }
            }
        }

        // 카테고리/단가 서버 검증 (잘못된 categoryIds 요청 차단)
        await calculateChargeAmount(body.vendorId, body.categoryIds);

        const { data: lead, error: leadError } = await ctx.supabase
            .from("leads")
            .insert({
                doctor_user_id: ctx.user.id,
                vendor_id: body.vendorId,
                category_ids: body.categoryIds,
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

        // Best-effort 리드 과금 처리
        let charge: Awaited<ReturnType<typeof processLeadCharge>> | null = null;
        try {
            charge = await processLeadCharge({
                leadId: lead.id,
                vendorId: body.vendorId,
                doctorUserId: ctx.user.id,
                categoryIds: body.categoryIds,
            });
        } catch (err) {
            console.error("[POST /api/leads] processLeadCharge failed", err);
        }

        // Best-effort notification to vendor owner
        try {
            const admin = createSupabaseAdminClient();
            const { data: vendorOwner } = await admin
                .from("vendors")
                .select("owner_user_id, name")
                .eq("id", body.vendorId)
                .single();

            if (vendorOwner) {
                const { data: ownerProfile } = await admin
                    .from("profiles")
                    .select("email, phone")
                    .eq("id", vendorOwner.owner_user_id)
                    .single();

                if (ownerProfile?.email) {
                    const serviceSummary = charge?.priceBreakdown?.map((p) => p.categoryName).join(", ") ?? "";

                    sendVendorNotification({
                        vendorUserId: vendorOwner.owner_user_id,
                        email: ownerProfile.email,
                        phone: ownerProfile.phone ?? undefined,
                        notificationType: "lead_charged",
                        emailTemplate: getLeadChargedTemplate({
                            vendorName: vendorOwner.name,
                            doctorName: body.contactName,
                            totalAmount: charge?.totalAmount ?? 0,
                            serviceSummary,
                        }),
                        kakaoTemplate: getKakaoLeadChargedTemplate({
                            vendorName: vendorOwner.name,
                            doctorName: body.contactName,
                            totalAmount: charge?.totalAmount ?? 0,
                        }),
                    }).catch((err) => console.error("[POST /api/leads] Notification failed", err));
                }
            }
        } catch (err) {
            console.error("[POST /api/leads] Vendor notification failed", err);
        }

        // 성공 시 rate limit 카운트 증가
        await incrementRateLimit(ctx.user.id, "lead_create", body.vendorId);

        const detail = await fetchLeadDetail(ctx.supabase, lead.id);
        return created({ lead: detail });
    }),
);
