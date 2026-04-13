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
        status: z.enum(["active", "rejected"]),
        rejectionReason: z.string().trim().max(1000).optional(),
    })
    .refine(
        (v) => v.status !== "rejected" || (v.rejectionReason && v.rejectionReason.length > 0),
        { message: "반려 시 사유를 입력해주세요.", path: ["rejectionReason"] },
    );

// ============================================
// PATCH /api/admin/products/[id]
// ============================================

export const PATCH = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const productId = zUuid.parse(ctx.params.id);
        const body = AdminProductStatusPatchBodySchema.parse(await ctx.req.json());

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
        } else if (body.status === "rejected") {
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
        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: body.status === "active" ? "product.approve" : "product.reject",
            target_type: "product",
            target_id: productId,
            metadata: {
                status: body.status,
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
    status: "active" | "rejected";
    rejectionReason?: string;
}): Promise<void> {
    const { vendorId, productTitle, status, rejectionReason } = params;
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

    const isApproved = status === "active";
    const subject = isApproved
        ? `[메디허브] 상품 "${productTitle}" 승인 완료`
        : `[메디허브] 상품 "${productTitle}" 반려`;
    const emailBody = isApproved
        ? `안녕하세요, ${profile.display_name || "파트너"}님.\n\n등록하신 상품 "${productTitle}"이(가) 관리자 검토를 통과하여 승인되었습니다.\n이제 고객에게 정상 노출됩니다.\n\n감사합니다.\n메디허브 팀`
        : `안녕하세요, ${profile.display_name || "파트너"}님.\n\n등록하신 상품 "${productTitle}"이(가) 관리자 검토에서 반려되었습니다.\n\n반려 사유: ${rejectionReason || "사유 없음"}\n\n상품 정보를 수정하여 다시 검토를 요청해주세요.\n\n감사합니다.\n메디허브 팀`;

    await sendVendorNotification({
        vendorUserId,
        email: profile.email ?? "",
        phone: profile.phone ?? undefined,
        notificationType: "product_review_result",
        emailTemplate: { subject, body: emailBody },
        kakaoTemplate: undefined,
    });
}
