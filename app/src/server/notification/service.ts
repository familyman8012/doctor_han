import "server-only";

import type { Json } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { resend, RESEND_FROM_EMAIL } from "./resend";
import {
	getDoctorApprovedTemplate,
	getDoctorRejectedTemplate,
	getVendorApprovedTemplate,
	getVendorRejectedTemplate,
	type VerificationEmailData,
} from "./templates";
import { fetchNotificationSettings, insertNotificationDelivery } from "./repository";

interface SendVerificationEmailParams {
	userId: string;
	email: string;
	recipientName: string;
	type: "doctor" | "vendor";
	action: "approved" | "rejected";
	rejectReason?: string;
}

interface SendVerificationEmailResult {
	success: boolean;
	error?: string;
}

export async function sendVerificationResultEmail(
	params: SendVerificationEmailParams,
): Promise<SendVerificationEmailResult> {
	const { userId, email, recipientName, type, action, rejectReason } = params;

	try {
		// admin client 사용 (RLS bypass - 다른 사용자의 알림 설정 조회 필요)
		const adminSupabase = createSupabaseAdminClient();

		// 1. 알림 설정 확인
		const settings = await fetchNotificationSettings(adminSupabase, userId);

		// 설정이 없거나 비활성화된 경우 발송하지 않음
		if (settings && (!settings.email_enabled || !settings.verification_result_enabled)) {
			console.log(`[Notification] Email disabled for user ${userId}`);
			return { success: true }; // 의도적으로 발송하지 않음 = 성공
		}

		// 2. 템플릿 선택
		const templateData: VerificationEmailData = {
			recipientName,
			type,
			rejectReason,
		};

		let template: { subject: string; body: string };

		if (type === "doctor") {
			template =
				action === "approved"
					? getDoctorApprovedTemplate(templateData)
					: getDoctorRejectedTemplate(templateData);
		} else {
			template =
				action === "approved"
					? getVendorApprovedTemplate(templateData)
					: getVendorRejectedTemplate(templateData);
		}

		// 3. Resend API 호출
		const notificationType = action === "approved" ? "verification_approved" : "verification_rejected";

		const result = await resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: email,
			subject: template.subject,
			text: template.body,
		});

		// 4. 성공 로그 기록
		await insertNotificationDelivery(adminSupabase, {
			userId,
			type: notificationType,
			channel: "email",
			provider: "resend",
			recipient: email,
			subject: template.subject,
			bodyPreview: template.body.slice(0, 200),
			providerResponse: result as Json,
			sentAt: new Date().toISOString(),
		});

		console.log(`[Notification] Email sent to ${email}`, result);
		return { success: true };
	} catch (error) {
		// 5. 실패 로그 기록 (사용자에게는 에러 노출하지 않음)
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		try {
			const adminSupabase = createSupabaseAdminClient();
			const notificationType = action === "approved" ? "verification_approved" : "verification_rejected";

			// 템플릿 재생성 (에러 발생 시에도 로그 기록을 위해)
			const templateData: VerificationEmailData = { recipientName, type, rejectReason };
			let template: { subject: string; body: string };
			if (type === "doctor") {
				template = action === "approved" ? getDoctorApprovedTemplate(templateData) : getDoctorRejectedTemplate(templateData);
			} else {
				template = action === "approved" ? getVendorApprovedTemplate(templateData) : getVendorRejectedTemplate(templateData);
			}

			await insertNotificationDelivery(adminSupabase, {
				userId,
				type: notificationType,
				channel: "email",
				provider: "resend",
				recipient: email,
				subject: template.subject,
				bodyPreview: template.body.slice(0, 200),
				failedAt: new Date().toISOString(),
				errorMessage,
			});
		} catch (logError) {
			console.error(`[Notification] Failed to log delivery error`, logError);
		}

		console.error(`[Notification] Email failed for ${email}`, error);
		return { success: false, error: errorMessage };
	}
}
