import "server-only";

import type { Database, Json, Tables } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationSettingsRow = Tables<"notification_settings">;

export async function fetchNotificationSettings(
	supabase: SupabaseClient<Database>,
	userId: string,
): Promise<NotificationSettingsRow | null> {
	const { data, error } = await supabase
		.from("notification_settings")
		.select("*")
		.eq("user_id", userId)
		.maybeSingle();

	if (error) {
		throw internalServerError("알림 설정을 조회할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return data;
}

export async function upsertNotificationSettings(
	supabase: SupabaseClient<Database>,
	userId: string,
	updates?: Partial<Omit<NotificationSettingsRow, "user_id" | "created_at" | "updated_at">>,
): Promise<NotificationSettingsRow> {
	// 기존 설정 조회 (부분 업데이트 시 기존값 유지)
	const { data: existing } = await supabase
		.from("notification_settings")
		.select("*")
		.eq("user_id", userId)
		.maybeSingle();

	// 기존값과 merge (기존값 → 업데이트값 → 기본값 순으로 적용)
	const previousMarketingEnabled = existing?.marketing_enabled ?? false;
	const merged = {
		user_id: userId,
		email_enabled: updates?.email_enabled ?? existing?.email_enabled ?? true,
		verification_result_enabled: updates?.verification_result_enabled ?? existing?.verification_result_enabled ?? true,
		lead_enabled: updates?.lead_enabled ?? existing?.lead_enabled ?? true,
		marketing_enabled: updates?.marketing_enabled ?? existing?.marketing_enabled ?? false,
	};

	const { data, error } = await supabase
		.from("notification_settings")
		.upsert(merged, { onConflict: "user_id" })
		.select("*")
		.single();

	if (error) {
		throw internalServerError("알림 설정을 저장할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	// 마케팅 수신 동의 변경 시각 기록(최근)
	if (updates?.marketing_enabled !== undefined && previousMarketingEnabled !== merged.marketing_enabled) {
		const now = new Date().toISOString();
		const profileUpdate = merged.marketing_enabled
			? { marketing_opt_in_at: now }
			: { marketing_opt_out_at: now };

		const { error: profileError } = await supabase
			.from("profiles")
			.update(profileUpdate)
			.eq("id", userId);

		if (profileError) {
			throw internalServerError("마케팅 동의 이력을 저장할 수 없습니다.", {
				message: profileError.message,
				code: profileError.code,
			});
		}
	}

	return data;
}

export async function insertNotificationDelivery(
	supabase: SupabaseClient<Database>,
	payload: {
		userId: string;
		type: string;
		channel: string;
		provider: string;
		recipient: string;
		subject?: string;
		bodyPreview?: string;
		providerResponse?: Json;
		sentAt?: string;
		failedAt?: string;
		errorMessage?: string;
	},
) {
	const { error } = await supabase.from("notification_deliveries").insert({
		user_id: payload.userId,
		type: payload.type as Database["public"]["Enums"]["notification_type"],
		channel: payload.channel as Database["public"]["Enums"]["notification_channel"],
		provider: payload.provider,
		recipient: payload.recipient,
		subject: payload.subject ?? null,
		body_preview: payload.bodyPreview ?? null,
		provider_response: payload.providerResponse ?? null,
		sent_at: payload.sentAt ?? new Date().toISOString(),
		failed_at: payload.failedAt ?? null,
		error_message: payload.errorMessage ?? null,
	});

	if (error) {
		console.error("[Notification] Failed to insert delivery log", error);
	}
}
