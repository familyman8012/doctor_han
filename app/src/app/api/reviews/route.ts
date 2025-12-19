import { ReviewCreateBodySchema } from "@/lib/schema/review";
import { badRequest, conflict, internalServerError, notFound } from "@/server/api/errors";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedDoctor } from "@/server/auth/guards";
import { mapReviewRow } from "@/server/review/mapper";

export const POST = withApi(
    withApprovedDoctor(async (ctx) => {
        const body = ReviewCreateBodySchema.parse(await ctx.req.json());

        const { data: lead, error: leadError } = await ctx.supabase
            .from("leads")
            .select("id, vendor_id, status")
            .eq("id", body.leadId)
            .maybeSingle();

        if (leadError) {
            throw internalServerError("리드를 확인할 수 없습니다.", {
                message: leadError.message,
                code: leadError.code,
            });
        }

        if (!lead) {
            throw notFound("리드를 찾을 수 없습니다.");
        }

        if (lead.vendor_id !== body.vendorId) {
            throw badRequest("leadId와 vendorId가 일치하지 않습니다.");
        }

        if (lead.status === "canceled") {
            throw badRequest("취소된 문의로는 리뷰를 작성할 수 없습니다.");
        }

        const { data: vendor, error: vendorError } = await ctx.supabase
            .from("vendors")
            .select("id")
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

        const { data: review, error } = await ctx.supabase
            .from("reviews")
            .insert({
                vendor_id: body.vendorId,
                doctor_user_id: ctx.user.id,
                lead_id: body.leadId,
                rating: body.rating,
                content: body.content,
                amount: body.amount ?? null,
                worked_at: body.workedAt ?? null,
                status: "published",
            })
            .select("*")
            .single();

        if (error) {
            if (error.code === "23505") {
                throw conflict("이미 리뷰를 작성했습니다.");
            }

            throw internalServerError("리뷰 작성에 실패했습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        return created({ review: mapReviewRow(review) });
    }),
);

