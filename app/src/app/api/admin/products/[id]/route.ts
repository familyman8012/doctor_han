import { z } from "zod";
import { zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { sendVendorNotification } from "@/server/notification/service";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

// ============================================
// Body Schema
// ============================================

const AdminProductStatusPatchBodySchema = z
    .object({
        status: z.enum(["active", "rejected", "inactive"]),
        /** 반려/중단 시 사유 (inactive 및 rejected일 때 필수) */
        rejectionReason: z.string().trim().max(1000).optional(),
    })
    .refine(
        (v) =>
            (v.status !== "rejected" && v.status !== "inactive") ||
            (v.rejectionReason && v.rejectionReason.length > 0),
        { message: "반려/판매 중단 시 사유를 입력해주세요.", path: ["rejectionReason"] },
    );

// ============================================
// PATCH /api/admin/products/[id]
// ============================================

export const PATCH = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const productId = zUuid.parse(ctx.params.id);
        const body = AdminProductStatusPatchBodySchema.parse(await ctx.req.json());

        // 현재 상품 조회 (스냅샷 생성용 — 카테고리 이름도 함께 저장해 diff 표시 시 UUID 대신 이름으로 보이게)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: current, error: fetchError } = await (ctx.supabase as any)
            .from("products")
            .select("*, categories!inner(name)")
            .eq("id", productId)
            .maybeSingle();

        if (fetchError || !current) {
            throw notFound("상품을 찾을 수 없습니다.");
        }

        // Build update payload
        const now = new Date().toISOString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = {
            status: body.status,
            updated_at: now,
        };

        if (body.status === "active") {
            payload.published_at = now;
            payload.rejection_reason = null;
            // 최초 승인이면 first_published_at 세팅
            if (!current.first_published_at) {
                payload.first_published_at = now;
            }
            // 현재 상품 값을 직전 active 스냅샷으로 저장 (이후 재수정 시 diff 비교용)
            const currentCategoryName =
                (current.categories as { name?: string } | null)?.name ?? null;
            payload.last_active_snapshot = {
                title: current.title,
                summary: current.summary,
                description: current.description,
                category_id: current.category_id,
                category_name: currentCategoryName,
                price_type: current.price_type,
                price_min: current.price_min,
                price_max: current.price_max,
                price_unit: current.price_unit,
                snapshot_at: now,
            };
            // 이전 재수정 사유는 승인과 함께 소멸
            payload.resubmit_reason = null;
        } else if (body.status === "rejected") {
            payload.rejection_reason = body.rejectionReason;
        } else if (body.status === "inactive") {
            // 강제 판매 중단 — 사유를 rejection_reason 컬럼에 재사용 (최근 관리자 액션 사유)
            payload.rejection_reason = body.rejectionReason;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (ctx.supabase as any)
            .from("products")
            .update(payload)
            .eq("id", productId)
            .select("*")
            .single();

        if (error) {
            // PGRST116 = no rows returned from single()
            if ((error as { code: string }).code === "PGRST116") {
                throw notFound("상품을 찾을 수 없습니다.");
            }
            throw internalServerError("상품 상태를 변경할 수 없습니다.", {
                message: (error as { message: string }).message,
                code: (error as { code: string }).code,
            });
        }

        // Audit log
        const auditAction =
            body.status === "active"
                ? current.status === "inactive"
                    ? "product.resume"
                    : "product.approve"
                : body.status === "inactive"
                    ? "product.suspend"
                    : "product.reject";
        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: auditAction,
            target_type: "product",
            target_id: productId,
            metadata: {
                status: body.status,
                previousStatus: current.status,
                ...(body.rejectionReason ? { rejectionReason: body.rejectionReason } : {}),
            },
        });

        if (auditResult.error) {
            console.error("[PATCH /api/admin/products/:id] audit_logs insert failed", auditResult.error);
        }

        // 상품 승인/반려 알림 발송 (비동기)
        const productRow = data as Record<string, unknown>;
        const vendorId = productRow.vendor_id as string;
        const productTitle = (productRow.title as string) ?? "상품";

        sendProductStatusNotification({
            vendorId,
            productTitle,
            status: body.status,
            previousStatus: current.status as "draft" | "pending_review" | "active" | "inactive" | "rejected",
            rejectionReason: body.rejectionReason,
        }).catch((err) => {
            console.error("[PATCH /api/admin/products/:id] notification failed", err);
        });

        return ok({ product: data });
    }),
);

// ============================================
// 상품 승인/반려 알림 발송
// ============================================

async function sendProductStatusNotification(params: {
    vendorId: string;
    productTitle: string;
    status: "active" | "rejected" | "inactive";
    previousStatus: "draft" | "pending_review" | "active" | "inactive" | "rejected";
    rejectionReason?: string;
}): Promise<void> {
    const { vendorId, productTitle, status, previousStatus, rejectionReason } = params;
    const admin = createSupabaseAdminClient();

    // vendor → owner user 조회
    const { data: vendor } = await admin
        .from("vendors")
        .select("owner_user_id")
        .eq("id", vendorId)
        .maybeSingle();

    if (!vendor?.owner_user_id) return;

    const vendorUserId = vendor.owner_user_id;

    // 프로필 조회
    const { data: profile } = await admin
        .from("profiles")
        .select("display_name, email, phone")
        .eq("id", vendorUserId)
        .maybeSingle();

    if (!profile) return;

    const isResume = status === "active" && previousStatus === "inactive";
    const isApprove = status === "active" && !isResume;
    const isSuspend = status === "inactive";
    const isReject = status === "rejected";

    const subject = isResume
        ? `[메디허브] 상품 "${productTitle}" 판매 재개`
        : isApprove
            ? `[메디허브] 상품 "${productTitle}" 승인 완료`
            : isSuspend
                ? `[메디허브] 상품 "${productTitle}" 판매 중단`
                : `[메디허브] 상품 "${productTitle}" 반려`;
    const name = profile.display_name || "파트너";
    const emailBody = isResume
        ? `안녕하세요, ${name}님.\n\n관리자에 의해 일시 중단되었던 상품 "${productTitle}"이(가) 다시 판매 재개되었습니다.\n\n감사합니다.\n메디허브 팀`
        : isApprove
            ? `안녕하세요, ${name}님.\n\n등록하신 상품 "${productTitle}"이(가) 관리자 검토를 통과하여 승인되었습니다.\n이제 고객에게 정상 노출됩니다.\n\n감사합니다.\n메디허브 팀`
            : isSuspend
                ? `안녕하세요, ${name}님.\n\n관리자에 의해 상품 "${productTitle}"의 판매가 일시 중단되었습니다.\n\n사유: ${rejectionReason || "사유 없음"}\n\n자세한 문의는 고객센터로 연락 부탁드립니다.\n\n메디허브 팀`
                : `안녕하세요, ${name}님.\n\n등록하신 상품 "${productTitle}"이(가) 관리자 검토에서 반려되었습니다.\n\n반려 사유: ${rejectionReason || "사유 없음"}\n\n상품 정보를 수정하여 다시 검토를 요청해주세요.\n\n감사합니다.\n메디허브 팀`;
    // avoid unused var lint
    void isReject;

    await sendVendorNotification({
        vendorUserId,
        email: profile.email ?? "",
        phone: profile.phone ?? undefined,
        notificationType: "product_review_result",
        emailTemplate: { subject, body: emailBody },
        kakaoTemplate: undefined,
    });
}
