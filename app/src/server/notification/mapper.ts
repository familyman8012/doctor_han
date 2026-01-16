import "server-only";

import type { NotificationSettingsView } from "@/lib/schema/notification";
import type { NotificationSettingsRow } from "./repository";

export function mapNotificationSettingsRow(row: NotificationSettingsRow): NotificationSettingsView {
	return {
		userId: row.user_id,
		emailEnabled: row.email_enabled,
		verificationResultEnabled: row.verification_result_enabled,
		leadEnabled: row.lead_enabled,
		marketingEnabled: row.marketing_enabled,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}
