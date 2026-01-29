import "server-only";

import type { Json } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { getKakaoVerificationTemplate, type KakaoTemplate } from "./kakao-templates";
import { fetchNotificationSettings, insertNotificationDelivery } from "./repository";
import { resend, RESEND_FROM_EMAIL } from "./resend";
import { SOLAPI_KAKAO_PFID, SOLAPI_SENDER_PHONE, solapiClient } from "./solapi";
import {
	getDoctorApprovedTemplate,
	getDoctorRejectedTemplate,
	getVendorApprovedTemplate,
	getVendorRejectedTemplate,
	type VerificationEmailData,
} from "./templates";

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

// ============================================================
// 카카오 알림톡 발송
// ============================================================

interface SendKakaoAlimtalkParams {
	phone: string;
	template: KakaoTemplate;
}

interface SendKakaoAlimtalkResult {
	success: boolean;
	error?: string;
	providerResponse?: Json;
}

/**
 * 카카오 알림톡 발송 (Solapi API 호출)
 */
export async function sendKakaoAlimtalk(params: SendKakaoAlimtalkParams): Promise<SendKakaoAlimtalkResult> {
	const { phone, template } = params;

	// Solapi 설정이 없는 경우 발송하지 않음
	if (!SOLAPI_SENDER_PHONE || !SOLAPI_KAKAO_PFID) {
		console.warn("[Notification] Solapi is not configured, skipping Kakao alimtalk");
		return { success: false, error: "Solapi is not configured" };
	}

	try {
		const result = await solapiClient.send({
			to: phone,
			from: SOLAPI_SENDER_PHONE,
			kakaoOptions: {
				pfId: SOLAPI_KAKAO_PFID,
				templateId: template.templateId,
				variables: template.variables,
			},
		});

		console.log(`[Notification] Kakao alimtalk sent to ${phone}`, result);
		return { success: true, providerResponse: result as Json };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error(`[Notification] Kakao alimtalk failed for ${phone}`, error);
		return { success: false, error: errorMessage };
	}
}

// ============================================================
// 재시도 로직
// ============================================================

/**
 * Sleep 유틸리티 함수
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RetryResult<T> {
	success: boolean;
	result?: T;
	retryCount: number;
	error?: string;
}

/**
 * Exponential backoff으로 재시도
 * @param fn 실행할 함수
 * @param maxRetries 최대 재시도 횟수 (기본 3회)
 * @param baseDelay 기본 딜레이 (기본 2000ms)
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 2000,
): Promise<RetryResult<T>> {
	let retryCount = 0;

	while (retryCount <= maxRetries) {
		try {
			const result = await fn();
			return { success: true, result, retryCount };
		} catch (error) {
			retryCount++;

			if (retryCount > maxRetries) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				return { success: false, retryCount: maxRetries, error: errorMessage };
			}

			// exponential backoff: 2s, 4s, 8s
			const delay = Math.pow(2, retryCount) * (baseDelay / 2);
			console.log(`[Notification] Retry ${retryCount}/${maxRetries} after ${delay}ms`);
			await sleep(delay);
		}
	}

	return { success: false, retryCount };
}

// ============================================================
// 통합 발송 (이메일 + 카카오 병렬)
// ============================================================

interface SendVerificationResultParams {
	userId: string;
	email: string;
	phone?: string;
	recipientName: string;
	type: "doctor" | "vendor";
	action: "approved" | "rejected";
	rejectReason?: string;
}

interface ChannelResult {
	success: boolean;
	error?: string;
	skipped?: boolean;
}

interface SendNotificationResult {
	email: ChannelResult;
	kakao: ChannelResult;
}

/**
 * 인증 결과 알림 통합 발송 (이메일 + 카카오 병렬)
 * - 사용자의 알림 설정에 따라 활성화된 채널로만 발송
 * - 각 채널별 재시도 로직 적용
 */
export async function sendVerificationResult(
	params: SendVerificationResultParams,
): Promise<SendNotificationResult> {
	const { userId, email, phone, recipientName, type, action, rejectReason } = params;

	const adminSupabase = createSupabaseAdminClient();

	// 1. 알림 설정 조회
	const settings = await fetchNotificationSettings(adminSupabase, userId);

	const emailEnabled = settings?.email_enabled ?? true;
	const kakaoEnabled = settings?.kakao_enabled ?? false;
	const verificationResultEnabled = settings?.verification_result_enabled ?? true;

	// 인증 결과 알림 자체가 비활성화된 경우
	if (!verificationResultEnabled) {
		console.log(`[Notification] Verification result notification disabled for user ${userId}`);
		return {
			email: { success: true, skipped: true },
			kakao: { success: true, skipped: true },
		};
	}

	const result: SendNotificationResult = {
		email: { success: true, skipped: true },
		kakao: { success: true, skipped: true },
	};

	// 2. 활성화된 채널에 대해 병렬 발송
	const sendTasks: Promise<void>[] = [];

	// 이메일 발송
	if (emailEnabled && email) {
		sendTasks.push(
			(async () => {
				const emailResult = await sendVerificationResultEmail({
					userId,
					email,
					recipientName,
					type,
					action,
					rejectReason,
				});
				result.email = { success: emailResult.success, error: emailResult.error, skipped: false };
			})(),
		);
	}

	// 카카오 발송
	if (kakaoEnabled && phone) {
		sendTasks.push(
			(async () => {
				const template = getKakaoVerificationTemplate(type, action, {
					recipientName,
					type,
					rejectReason,
				});

				const notificationType = action === "approved" ? "verification_approved" : "verification_rejected";

				// 재시도 로직 적용
				const retryResult = await retryWithBackoff(
					async () => {
						const kakaoResult = await sendKakaoAlimtalk({ phone, template });
						if (!kakaoResult.success) {
							throw new Error(kakaoResult.error || "Kakao send failed");
						}
						return kakaoResult;
					},
					3, // maxRetries
					2000, // baseDelay
				);

				// 발송 로그 기록
				await insertNotificationDelivery(adminSupabase, {
					userId,
					type: notificationType,
					channel: "kakao",
					provider: "solapi",
					recipient: phone,
					bodyPreview: `알림톡: ${template.templateId}`,
					providerResponse: retryResult.result?.providerResponse,
					sentAt: retryResult.success ? new Date().toISOString() : undefined,
					failedAt: !retryResult.success ? new Date().toISOString() : undefined,
					errorMessage: retryResult.error,
					retryCount: retryResult.retryCount,
					maxRetries: 3,
					status: retryResult.success ? "sent" : "failed",
				});

				result.kakao = {
					success: retryResult.success,
					error: retryResult.error,
					skipped: false,
				};
			})(),
		);
	}

	// 병렬 실행 (모든 결과 대기)
	await Promise.allSettled(sendTasks);

	return result;
}
