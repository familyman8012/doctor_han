import { UpdateNotificationSettingsBodySchema } from "@/lib/schema/notification";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { mapNotificationSettingsRow } from "@/server/notification/mapper";
import { fetchNotificationSettings, upsertNotificationSettings } from "@/server/notification/repository";

// GET /api/notification-settings
export const GET = withApi(
	withAuth(async (ctx) => {
		let settings = await fetchNotificationSettings(ctx.supabase, ctx.user.id);

		// 설정이 없으면 기본값으로 생성
		if (!settings) {
			settings = await upsertNotificationSettings(ctx.supabase, ctx.user.id);
		}

		return ok({ settings: mapNotificationSettingsRow(settings) });
	}),
);

// PATCH /api/notification-settings
export const PATCH = withApi(
	withAuth(async (ctx) => {
		const body = UpdateNotificationSettingsBodySchema.parse(await ctx.req.json());

		const settings = await upsertNotificationSettings(ctx.supabase, ctx.user.id, {
			email_enabled: body.emailEnabled,
			verification_result_enabled: body.verificationResultEnabled,
			lead_enabled: body.leadEnabled,
			marketing_enabled: body.marketingEnabled,
		});

		return ok({ settings: mapNotificationSettingsRow(settings) });
	}),
);
