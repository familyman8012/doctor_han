import { refundLeadCharge } from "@/server/lead/charge-service";
import { getUnrespondedChargedLeads, markLeadChargeNoResponseWarned } from "@/server/lead/repository";
import { getKakaoLeadNoResponseWarningTemplate } from "@/server/notification/kakao-templates";
import { sendVendorNotification } from "@/server/notification/service";
import { getLeadNoResponseWarningTemplate } from "@/server/notification/templates";
import { generateMonthlySettlements } from "@/server/settlement/service";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { NextRequest } from "next/server";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getKstNow(date = new Date()): { year: number; month: number; day: number } {
    const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
    return {
        year: kstDate.getUTCFullYear(),
        month: kstDate.getUTCMonth() + 1,
        day: kstDate.getUTCDate(),
    };
}

export async function GET(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // 48h warning
    const warningOnly = await getUnrespondedChargedLeads(admin, 48, {
        maxHoursSinceCreated: 72,
        onlyUnwarned: true,
    });

    // Send warning notifications
    for (const { lead, charge } of warningOnly) {
        try {
            // Get vendor info for notification
            const { data: vendor } = await admin
                .from("vendors")
                .select("owner_user_id, name")
                .eq("id", lead.vendor_id)
                .single();
            if (!vendor) continue;

            const { data: profile } = await admin
                .from("profiles")
                .select("email, phone")
                .eq("id", vendor.owner_user_id)
                .single();
            if (!profile?.email) continue;

            const { data: doctor } = await admin
                .from("profiles")
                .select("display_name")
                .eq("id", lead.doctor_user_id)
                .single();

            await sendVendorNotification({
                vendorUserId: vendor.owner_user_id,
                email: profile.email,
                phone: profile.phone ?? undefined,
                notificationType: "lead_no_response_warning",
                emailTemplate: getLeadNoResponseWarningTemplate({
                    vendorName: vendor.name,
                    doctorName: doctor?.display_name ?? "한의사",
                    hoursElapsed: 48,
                }),
                kakaoTemplate: getKakaoLeadNoResponseWarningTemplate({
                    vendorName: vendor.name,
                    doctorName: doctor?.display_name ?? "한의사",
                }),
            });

            await markLeadChargeNoResponseWarned(admin, charge.id);
        } catch (err) {
            console.error("[CRON] Warning notification failed for lead", lead.id, err);
        }
    }

    // 72h auto-refund
    const refundLeads = await getUnrespondedChargedLeads(admin, 72);
    let refundedCount = 0;
    for (const { charge } of refundLeads) {
        try {
            await refundLeadCharge(charge.id, "no_response_72h");
            refundedCount++;
        } catch (err) {
            console.error("[CRON] Auto-refund failed for charge", charge.id, err);
        }
    }

    let settlementResult:
        | {
              year: number;
              month: number;
              created: number;
              skipped: number;
              total: number;
          }
        | null = null;

    // 매월 1일(KST) 자동 정산 생성: 대상은 전월.
    const kstNow = getKstNow();
    if (kstNow.day === 1) {
        const targetYear = kstNow.month === 1 ? kstNow.year - 1 : kstNow.year;
        const targetMonth = kstNow.month === 1 ? 12 : kstNow.month - 1;

        const generated = await generateMonthlySettlements(targetYear, targetMonth);
        settlementResult = {
            year: targetYear,
            month: targetMonth,
            created: generated.created,
            skipped: generated.skipped,
            total: generated.total,
        };
    }

    return Response.json({
        ok: true,
        warned: warningOnly.length,
        refunded: refundedCount,
        settlement: settlementResult,
    });
}
