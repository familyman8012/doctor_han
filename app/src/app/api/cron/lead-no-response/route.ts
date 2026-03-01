import { refundLeadCharge } from "@/server/lead/charge-service";
import { getUnrespondedChargedLeads, markLeadChargeNoResponseWarned } from "@/server/lead/repository";
import { getKakaoLeadNoResponseWarningTemplate } from "@/server/notification/kakao-templates";
import { sendVendorNotification } from "@/server/notification/service";
import { getLeadNoResponseWarningTemplate } from "@/server/notification/templates";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { NextRequest } from "next/server";

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

    return Response.json({
        ok: true,
        warned: warningOnly.length,
        refunded: refundedCount,
    });
}
