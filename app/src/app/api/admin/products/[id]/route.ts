import { z } from "zod";
import { zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";

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

        return ok({ product: data });
    }),
);
