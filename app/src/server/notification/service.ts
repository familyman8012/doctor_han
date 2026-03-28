import "server-only";

import type { Json } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { getKakaoVerificationTemplate, type KakaoTemplate } from "./kakao-templates";
import { fetchNotificationSettings, insertNotificationDelivery, type NotificationSettingsRow } from "./repository";
import { resend, RESEND_FROM_EMAIL } from "./resend";
import { SOLAPI_KAKAO_PFID, SOLAPI_SENDER_PHONE, solapiClient } from "./solapi";
import {
	getDoctorApprovedTemplate,
	getDoctorRejectedTemplate,
	getVendorApprovedTemplate,
	getVendorRejectedTemplate,
	type VerificationEmailData,
} from "./templates";

function maskEmail(email: string): string {
	const atIndex = email.indexOf("@");
	if (atIndex <= 0) return "***";
	const local = email.slice(0, atIndex);
	const domain = email.slice(atIndex + 1);
	const first = local[0] ?? "*";
	if (local.length <= 1) return `${first}***@${domain}`;
	const last = local[local.length - 1] ?? "*";
	return `${first}***${last}@${domain}`;
}

function maskPhone(phone: string): string {
	// keep last 4 digits (preserve formatting)
	return phone.replace(/\d(?=\d{4})/g, "*");
}

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
		const sentAt = new Date().toISOString();
		await insertNotificationDelivery(adminSupabase, {
			userId,
			type: notificationType,
			channel: "email",
			provider: "resend",
			recipient: email,
			subject: template.subject,
			bodyPreview: template.body.slice(0, 200),
			providerResponse: result as Json,
			sentAt,
			retryCount: 0,
			maxRetries: 0,
			status: "sent",
		});

		console.log(`[Notification] Email sent`, { userId, to: maskEmail(email), type: notificationType });
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

			const failedAt = new Date().toISOString();
			await insertNotificationDelivery(adminSupabase, {
				userId,
				type: notificationType,
				channel: "email",
				provider: "resend",
				recipient: email,
				subject: template.subject,
				bodyPreview: template.body.slice(0, 200),
				failedAt,
				errorMessage,
				retryCount: 0,
				maxRetries: 0,
				status: "failed",
			});
		} catch (logError) {
			console.error(`[Notification] Failed to log delivery error`, logError);
		}

		console.error(`[Notification] Email failed`, { userId, to: maskEmail(email), errorMessage });
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

		console.log(`[Notification] Kakao alimtalk sent`, {
			to: maskPhone(phone),
			templateId: template.templateId,
		});
		return { success: true, providerResponse: result as Json };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error(`[Notification] Kakao alimtalk failed`, { to: maskPhone(phone), errorMessage });
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
	const hasEmail = Boolean(email);
	const hasPhone = Boolean(phone);

	let settings: NotificationSettingsRow | null = null;
	try {
		settings = await fetchNotificationSettings(adminSupabase, userId);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error("[Notification] Failed to fetch notification settings", { userId, errorMessage });

		return {
			email: hasEmail ? { success: false, error: "알림 설정을 조회할 수 없습니다.", skipped: false } : { success: true, skipped: true },
			kakao: hasPhone ? { success: false, error: "알림 설정을 조회할 수 없습니다.", skipped: false } : { success: true, skipped: true },
		};
	}

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
	if (emailEnabled && hasEmail) {
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
				if (!SOLAPI_SENDER_PHONE || !SOLAPI_KAKAO_PFID) {
					const errorMessage = "Solapi is not configured";
					const failedAt = new Date().toISOString();
					const notificationType = action === "approved" ? "verification_approved" : "verification_rejected";

					await insertNotificationDelivery(adminSupabase, {
						userId,
						type: notificationType,
						channel: "kakao",
						provider: "solapi",
						recipient: phone,
						bodyPreview: "알림톡: (solapi 미설정)",
						failedAt,
						errorMessage,
						retryCount: 0,
						maxRetries: 0,
						status: "failed",
					});

					result.kakao = { success: false, error: errorMessage, skipped: false };
					return;
				}

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

// ============================================================
// SMS fallback (카카오 알림톡 실패 시)
// ============================================================

interface SendSmsFallbackParams {
	phone: string;
	text: string;
}

interface SendSmsFallbackResult {
	success: boolean;
	error?: string;
	providerResponse?: Json;
}

interface NotificationDispatchResult {
	delivered: boolean;
	skipped: boolean;
}

/**
 * SMS fallback 발송 (kakaoOptions 없이 순수 SMS 모드)
 * - 카카오 알림톡 실패 시 대체 채널로 사용
 * - retryWithBackoff 3회 적용
 */
async function sendSmsFallback(params: SendSmsFallbackParams): Promise<SendSmsFallbackResult> {
	const { phone, text } = params;

	if (!SOLAPI_SENDER_PHONE) {
		console.warn("[Notification] SOLAPI_SENDER_PHONE is not configured, skipping SMS fallback");
		return { success: false, error: "SOLAPI_SENDER_PHONE is not configured" };
	}

	const retryResult = await retryWithBackoff(
		async () => {
			const result = await solapiClient.send({
				to: phone,
				from: SOLAPI_SENDER_PHONE,
				text,
			});
			return result;
		},
		3,
		2000,
	);

	if (retryResult.success) {
		console.log("[Notification] SMS fallback sent", { to: maskPhone(phone) });
		return { success: true, providerResponse: retryResult.result as Json };
	}

	console.error("[Notification] SMS fallback failed", {
		to: maskPhone(phone),
		error: retryResult.error,
	});
	return { success: false, error: retryResult.error };
}

async function sendKakaoAlimtalkWithRetry(params: SendKakaoAlimtalkParams): Promise<RetryResult<SendKakaoAlimtalkResult>> {
	return retryWithBackoff(async () => {
		const result = await sendKakaoAlimtalk(params);
		if (!result.success) {
			throw new Error(result.error || "Kakao send failed");
		}
		return result;
	}, 3, 2000);
}

// ============================================================
// 범용 업체 알림 발송 (CPL 리드 과금 등)
// ============================================================

interface SendVendorNotificationParams {
	vendorUserId: string;
	email?: string;
	phone?: string;
	notificationType: string; // notification_type enum value
	emailTemplate: { subject: string; body: string };
	kakaoTemplate?: KakaoTemplate;
}

/**
 * 범용 업체 알림 발송 (이메일 + 카카오 병렬)
 *
 * - 사용자의 알림 설정에 따라 활성화된 채널로만 발송
 * - 전달 성공 여부 / 의도적 skip 여부를 반환한다
 * - 예기치 않은 에러는 로그만 남기고 throw하지 않음
 * - 리드 과금, 환불, 크레딧 부족, 미응답 경고 등에 사용
 */
export async function sendVendorNotification(params: SendVendorNotificationParams): Promise<NotificationDispatchResult> {
	const { vendorUserId, email, phone, notificationType, emailTemplate, kakaoTemplate } = params;
	let anyChannelDelivered = false;

	try {
		const adminSupabase = createSupabaseAdminClient();

		// 1. 알림 설정 조회
		let settings: NotificationSettingsRow | null = null;
		try {
			settings = await fetchNotificationSettings(adminSupabase, vendorUserId);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			console.error("[Notification] Failed to fetch notification settings", { vendorUserId, errorMessage });
			return { delivered: false, skipped: false }; // 설정 조회 실패 시 발송하지 않음
		}

		const leadEnabled = settings?.lead_enabled ?? true;
		const emailEnabled = settings?.email_enabled ?? true;
		const kakaoEnabled = settings?.kakao_enabled ?? false;
		const canSendEmail = emailEnabled && Boolean(email);
		const canSendKakao = kakaoEnabled && Boolean(phone) && Boolean(kakaoTemplate);

		if (!leadEnabled) {
			console.log("[Notification] Lead notification disabled", { vendorUserId, type: notificationType });
			return { delivered: false, skipped: true };
		}

		if (!canSendEmail && !canSendKakao) {
			console.warn("[Notification] No eligible lead notification channel", {
				vendorUserId,
				type: notificationType,
				hasEmail: Boolean(email),
				hasPhone: Boolean(phone),
				emailEnabled,
				kakaoEnabled,
			});
			return { delivered: false, skipped: true };
		}

		// 2. 활성화된 채널에 대해 병렬 발송
		const sendTasks: Promise<void>[] = [];

		// 이메일 발송 (retryWithBackoff 적용)
		if (canSendEmail && email) {
			sendTasks.push(
				(async () => {
					try {
						const retryResult = await retryWithBackoff(
							() =>
								resend.emails.send({
									from: RESEND_FROM_EMAIL,
									to: email,
									subject: emailTemplate.subject,
									text: emailTemplate.body,
								}),
							3,
							2000,
						);

						await insertNotificationDelivery(adminSupabase, {
							userId: vendorUserId,
							type: notificationType,
							channel: "email",
							provider: "resend",
							recipient: email,
							subject: emailTemplate.subject,
							bodyPreview: emailTemplate.body.slice(0, 200),
							providerResponse: retryResult.result as Json,
							sentAt: retryResult.success ? new Date().toISOString() : undefined,
							failedAt: !retryResult.success ? new Date().toISOString() : undefined,
							errorMessage: retryResult.error,
							retryCount: retryResult.retryCount,
							maxRetries: 3,
							status: retryResult.success ? "sent" : "failed",
						});

						if (retryResult.success) {
							anyChannelDelivered = true;
							console.log("[Notification] Vendor email sent", {
								vendorUserId,
								to: maskEmail(email),
								type: notificationType,
							});
						} else {
							console.error("[Notification] Vendor email failed after retries", {
								vendorUserId,
								to: maskEmail(email),
								error: retryResult.error,
							});
						}
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : "Unknown error";

						try {
							const failedAt = new Date().toISOString();
							await insertNotificationDelivery(adminSupabase, {
								userId: vendorUserId,
								type: notificationType,
								channel: "email",
								provider: "resend",
								recipient: email,
								subject: emailTemplate.subject,
								bodyPreview: emailTemplate.body.slice(0, 200),
								failedAt,
								errorMessage,
								retryCount: 0,
								maxRetries: 3,
								status: "failed",
							});
						} catch (logError) {
							console.error("[Notification] Failed to log email delivery error", logError);
						}

						console.error("[Notification] Vendor email failed", {
							vendorUserId,
							to: maskEmail(email),
							errorMessage,
						});
					}
				})(),
			);
		}

		// 카카오 발송 (실패 시 SMS fallback)
		if (canSendKakao && phone && kakaoTemplate) {
			sendTasks.push(
				(async () => {
					try {
						const retryResult = await sendKakaoAlimtalkWithRetry({ phone, template: kakaoTemplate });

						await insertNotificationDelivery(adminSupabase, {
							userId: vendorUserId,
							type: notificationType,
							channel: "kakao",
							provider: "solapi",
							recipient: phone,
							bodyPreview: `알림톡: ${kakaoTemplate.templateId}`,
							providerResponse: retryResult.result?.providerResponse,
							sentAt: retryResult.success ? new Date().toISOString() : undefined,
							failedAt: !retryResult.success ? new Date().toISOString() : undefined,
							errorMessage: retryResult.error,
							retryCount: retryResult.retryCount,
							maxRetries: 3,
							status: retryResult.success ? "sent" : "failed",
						});

						if (retryResult.success) {
							anyChannelDelivered = true;
							console.log("[Notification] Vendor kakao sent", {
								vendorUserId,
								to: maskPhone(phone),
								type: notificationType,
							});
						} else {
							// 카카오 실패 → SMS fallback
							console.warn("[Notification] Vendor kakao failed, attempting SMS fallback", {
								vendorUserId,
								to: maskPhone(phone),
								error: retryResult.error,
							});

							const smsText = `[메디허브] ${emailTemplate.subject}`;
							const smsResult = await sendSmsFallback({ phone, text: smsText });

							await insertNotificationDelivery(adminSupabase, {
								userId: vendorUserId,
								type: notificationType,
								channel: "sms",
								provider: "solapi",
								recipient: phone,
								bodyPreview: smsText.slice(0, 200),
								providerResponse: smsResult.providerResponse,
								sentAt: smsResult.success ? new Date().toISOString() : undefined,
								failedAt: !smsResult.success ? new Date().toISOString() : undefined,
								errorMessage: smsResult.error,
								retryCount: 0,
								maxRetries: 3,
								status: smsResult.success ? "sent" : "failed",
							});
							if (smsResult.success) anyChannelDelivered = true;
						}
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : "Unknown error";

						try {
							const failedAt = new Date().toISOString();
							await insertNotificationDelivery(adminSupabase, {
								userId: vendorUserId,
								type: notificationType,
								channel: "kakao",
								provider: "solapi",
								recipient: phone,
								bodyPreview: `알림톡: ${kakaoTemplate.templateId}`,
								failedAt,
								errorMessage,
								retryCount: 0,
								maxRetries: 0,
								status: "failed",
							});

							// 예외 발생 시에도 SMS fallback 시도
							console.warn("[Notification] Vendor kakao threw error, attempting SMS fallback", {
								vendorUserId,
								to: maskPhone(phone),
								errorMessage,
							});

							const smsText = `[메디허브] ${emailTemplate.subject}`;
							const smsResult = await sendSmsFallback({ phone, text: smsText });

							await insertNotificationDelivery(adminSupabase, {
								userId: vendorUserId,
								type: notificationType,
								channel: "sms",
								provider: "solapi",
								recipient: phone,
								bodyPreview: smsText.slice(0, 200),
								providerResponse: smsResult.providerResponse,
								sentAt: smsResult.success ? new Date().toISOString() : undefined,
								failedAt: !smsResult.success ? new Date().toISOString() : undefined,
								errorMessage: smsResult.error,
								retryCount: 0,
								maxRetries: 3,
								status: smsResult.success ? "sent" : "failed",
							});
							if (smsResult.success) anyChannelDelivered = true;
						} catch (logError) {
							console.error("[Notification] Failed to log kakao delivery error / SMS fallback", logError);
						}

						console.error("[Notification] Vendor kakao failed", {
							vendorUserId,
							to: maskPhone(phone),
							errorMessage,
						});
					}
				})(),
			);
		}

		// 병렬 실행 (모든 결과 대기)
		await Promise.allSettled(sendTasks);
	} catch (error) {
		// fire-and-forget: 최상위 에러도 로그만 남기고 throw하지 않음
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error("[Notification] sendVendorNotification unexpected error", {
			vendorUserId,
			notificationType,
			errorMessage,
		});
	}

	return { delivered: anyChannelDelivered, skipped: false };
}

// ============================================================
// 범용 의사 알림 발송
// ============================================================

interface SendDoctorNotificationParams {
	doctorUserId: string;
	email?: string;
	phone?: string;
	notificationType: string; // notification_type enum value
	emailTemplate: { subject: string; body: string };
	kakaoTemplate?: KakaoTemplate;
}

/**
 * 범용 의사 알림 발송 (이메일 + 카카오 병렬, SMS fallback 포함)
 *
 * - 사용자의 알림 설정에 따라 활성화된 채널로만 발송
 * - fire-and-forget: void 반환, 에러는 로그만 남기고 throw하지 않음
 * - 이메일: retryWithBackoff 3회 적용
 * - 카카오: 실패 시 SMS fallback (retryWithBackoff 3회)
 */
export async function sendDoctorNotification(params: SendDoctorNotificationParams): Promise<void> {
	const { doctorUserId, email, phone, notificationType, emailTemplate, kakaoTemplate } = params;

	try {
		const adminSupabase = createSupabaseAdminClient();

		// 1. 알림 설정 조회
		let settings: NotificationSettingsRow | null = null;
		try {
			settings = await fetchNotificationSettings(adminSupabase, doctorUserId);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			console.error("[Notification] Failed to fetch notification settings", { doctorUserId, errorMessage });
			return; // 설정 조회 실패 시 발송하지 않음
		}

		const leadEnabled = settings?.lead_enabled ?? true;
		const emailEnabled = settings?.email_enabled ?? true;
		const kakaoEnabled = settings?.kakao_enabled ?? false;
		const canSendEmail = emailEnabled && Boolean(email);
		const canSendKakao = kakaoEnabled && Boolean(phone) && Boolean(kakaoTemplate);

		if (!leadEnabled) {
			console.log("[Notification] Lead notification disabled", { doctorUserId, type: notificationType });
			return;
		}

		if (!canSendEmail && !canSendKakao) {
			console.warn("[Notification] No eligible lead notification channel", {
				doctorUserId,
				type: notificationType,
				hasEmail: Boolean(email),
				hasPhone: Boolean(phone),
				emailEnabled,
				kakaoEnabled,
			});
			return;
		}

		// 2. 활성화된 채널에 대해 병렬 발송
		const sendTasks: Promise<void>[] = [];

		// 이메일 발송 (retryWithBackoff 적용)
		if (canSendEmail && email) {
			sendTasks.push(
				(async () => {
					try {
						const retryResult = await retryWithBackoff(
							() =>
								resend.emails.send({
									from: RESEND_FROM_EMAIL,
									to: email,
									subject: emailTemplate.subject,
									text: emailTemplate.body,
								}),
							3,
							2000,
						);

						await insertNotificationDelivery(adminSupabase, {
							userId: doctorUserId,
							type: notificationType,
							channel: "email",
							provider: "resend",
							recipient: email,
							subject: emailTemplate.subject,
							bodyPreview: emailTemplate.body.slice(0, 200),
							providerResponse: retryResult.result as Json,
							sentAt: retryResult.success ? new Date().toISOString() : undefined,
							failedAt: !retryResult.success ? new Date().toISOString() : undefined,
							errorMessage: retryResult.error,
							retryCount: retryResult.retryCount,
							maxRetries: 3,
							status: retryResult.success ? "sent" : "failed",
						});

						if (retryResult.success) {
							console.log("[Notification] Doctor email sent", {
								doctorUserId,
								to: maskEmail(email),
								type: notificationType,
							});
						} else {
							console.error("[Notification] Doctor email failed after retries", {
								doctorUserId,
								to: maskEmail(email),
								error: retryResult.error,
							});
						}
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : "Unknown error";

						try {
							const failedAt = new Date().toISOString();
							await insertNotificationDelivery(adminSupabase, {
								userId: doctorUserId,
								type: notificationType,
								channel: "email",
								provider: "resend",
								recipient: email,
								subject: emailTemplate.subject,
								bodyPreview: emailTemplate.body.slice(0, 200),
								failedAt,
								errorMessage,
								retryCount: 0,
								maxRetries: 3,
								status: "failed",
							});
						} catch (logError) {
							console.error("[Notification] Failed to log email delivery error", logError);
						}

						console.error("[Notification] Doctor email failed", {
							doctorUserId,
							to: maskEmail(email),
							errorMessage,
						});
					}
				})(),
			);
		}

		// 카카오 발송 (실패 시 SMS fallback)
		if (canSendKakao && phone && kakaoTemplate) {
			sendTasks.push(
				(async () => {
					try {
						const retryResult = await sendKakaoAlimtalkWithRetry({ phone, template: kakaoTemplate });

						await insertNotificationDelivery(adminSupabase, {
							userId: doctorUserId,
							type: notificationType,
							channel: "kakao",
							provider: "solapi",
							recipient: phone,
							bodyPreview: `알림톡: ${kakaoTemplate.templateId}`,
							providerResponse: retryResult.result?.providerResponse,
							sentAt: retryResult.success ? new Date().toISOString() : undefined,
							failedAt: !retryResult.success ? new Date().toISOString() : undefined,
							errorMessage: retryResult.error,
							retryCount: retryResult.retryCount,
							maxRetries: 3,
							status: retryResult.success ? "sent" : "failed",
						});

						if (retryResult.success) {
							console.log("[Notification] Doctor kakao sent", {
								doctorUserId,
								to: maskPhone(phone),
								type: notificationType,
							});
						} else {
							// 카카오 실패 → SMS fallback
							console.warn("[Notification] Doctor kakao failed, attempting SMS fallback", {
								doctorUserId,
								to: maskPhone(phone),
								error: retryResult.error,
							});

							const smsText = `[메디허브] ${emailTemplate.subject}`;
							const smsResult = await sendSmsFallback({ phone, text: smsText });

							await insertNotificationDelivery(adminSupabase, {
								userId: doctorUserId,
								type: notificationType,
								channel: "sms",
								provider: "solapi",
								recipient: phone,
								bodyPreview: smsText.slice(0, 200),
								providerResponse: smsResult.providerResponse,
								sentAt: smsResult.success ? new Date().toISOString() : undefined,
								failedAt: !smsResult.success ? new Date().toISOString() : undefined,
								errorMessage: smsResult.error,
								retryCount: 0,
								maxRetries: 3,
								status: smsResult.success ? "sent" : "failed",
							});
						}
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : "Unknown error";

						try {
							const failedAt = new Date().toISOString();
							await insertNotificationDelivery(adminSupabase, {
								userId: doctorUserId,
								type: notificationType,
								channel: "kakao",
								provider: "solapi",
								recipient: phone,
								bodyPreview: `알림톡: ${kakaoTemplate.templateId}`,
								failedAt,
								errorMessage,
								retryCount: 0,
								maxRetries: 0,
								status: "failed",
							});

							// 예외 발생 시에도 SMS fallback 시도
							console.warn("[Notification] Doctor kakao threw error, attempting SMS fallback", {
								doctorUserId,
								to: maskPhone(phone),
								errorMessage,
							});

							const smsText = `[메디허브] ${emailTemplate.subject}`;
							const smsResult = await sendSmsFallback({ phone, text: smsText });

							await insertNotificationDelivery(adminSupabase, {
								userId: doctorUserId,
								type: notificationType,
								channel: "sms",
								provider: "solapi",
								recipient: phone,
								bodyPreview: smsText.slice(0, 200),
								providerResponse: smsResult.providerResponse,
								sentAt: smsResult.success ? new Date().toISOString() : undefined,
								failedAt: !smsResult.success ? new Date().toISOString() : undefined,
								errorMessage: smsResult.error,
								retryCount: 0,
								maxRetries: 3,
								status: smsResult.success ? "sent" : "failed",
							});
						} catch (logError) {
							console.error("[Notification] Failed to log kakao delivery error / SMS fallback", logError);
						}

						console.error("[Notification] Doctor kakao failed", {
							doctorUserId,
							to: maskPhone(phone),
							errorMessage,
						});
					}
				})(),
			);
		}

		// 병렬 실행 (모든 결과 대기)
		await Promise.allSettled(sendTasks);
	} catch (error) {
		// fire-and-forget: 최상위 에러도 로그만 남기고 throw하지 않음
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error("[Notification] sendDoctorNotification unexpected error", {
			doctorUserId,
			notificationType,
			errorMessage,
		});
	}
}
