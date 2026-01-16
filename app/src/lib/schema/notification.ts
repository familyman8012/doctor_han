import { z } from "zod";

// 알림 설정 조회 응답
export const NotificationSettingsViewSchema = z.object({
	userId: z.string().uuid(),
	emailEnabled: z.boolean(),
	verificationResultEnabled: z.boolean(),
	leadEnabled: z.boolean(),
	marketingEnabled: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type NotificationSettingsView = z.infer<typeof NotificationSettingsViewSchema>;

// 알림 설정 수정 요청
export const UpdateNotificationSettingsBodySchema = z
	.object({
		emailEnabled: z.boolean().optional(),
		verificationResultEnabled: z.boolean().optional(),
		leadEnabled: z.boolean().optional(),
		marketingEnabled: z.boolean().optional(),
	})
	.strict()
	.refine(
		(v) =>
			v.emailEnabled !== undefined ||
			v.verificationResultEnabled !== undefined ||
			v.leadEnabled !== undefined ||
			v.marketingEnabled !== undefined,
		{ message: "수정할 필드가 없습니다." },
	);

export type UpdateNotificationSettingsBody = z.infer<typeof UpdateNotificationSettingsBodySchema>;

// 발송 타입 enum
export const NotificationTypeSchema = z.enum([
	"verification_approved",
	"verification_rejected",
	"lead_received",
	"lead_responded",
	"review_received",
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// 발송 채널 enum
export const NotificationChannelSchema = z.enum(["email", "kakao", "sms", "in_app"]);

export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;
