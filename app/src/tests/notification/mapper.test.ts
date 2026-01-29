import { describe, expect, it } from "vitest";
import { mapNotificationSettingsRow } from "@/server/notification/mapper";
import type { NotificationSettingsRow } from "@/server/notification/repository";

describe("notification/mapper", () => {
	describe("mapNotificationSettingsRow", () => {
		it("NotificationSettingsRow를 NotificationSettingsView로 올바르게 매핑한다", () => {
			const row: NotificationSettingsRow = {
				user_id: "550e8400-e29b-41d4-a716-446655440000",
				email_enabled: true,
				kakao_enabled: true,
				verification_result_enabled: true,
				lead_enabled: true,
				marketing_enabled: false,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-02T00:00:00Z",
			};

			const result = mapNotificationSettingsRow(row);

			expect(result).toEqual({
				userId: "550e8400-e29b-41d4-a716-446655440000",
				emailEnabled: true,
				kakaoEnabled: true,
				verificationResultEnabled: true,
				leadEnabled: true,
				marketingEnabled: false,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			});
		});

		it("kakaoEnabled가 false일 때 올바르게 매핑한다", () => {
			const row: NotificationSettingsRow = {
				user_id: "550e8400-e29b-41d4-a716-446655440000",
				email_enabled: true,
				kakao_enabled: false,
				verification_result_enabled: true,
				lead_enabled: false,
				marketing_enabled: true,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-02T00:00:00Z",
			};

			const result = mapNotificationSettingsRow(row);

			expect(result.kakaoEnabled).toBe(false);
			expect(result.emailEnabled).toBe(true);
			expect(result.verificationResultEnabled).toBe(true);
			expect(result.leadEnabled).toBe(false);
			expect(result.marketingEnabled).toBe(true);
		});

		it("모든 알림이 비활성화된 경우를 올바르게 매핑한다", () => {
			const row: NotificationSettingsRow = {
				user_id: "550e8400-e29b-41d4-a716-446655440000",
				email_enabled: false,
				kakao_enabled: false,
				verification_result_enabled: false,
				lead_enabled: false,
				marketing_enabled: false,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-02T00:00:00Z",
			};

			const result = mapNotificationSettingsRow(row);

			expect(result.emailEnabled).toBe(false);
			expect(result.kakaoEnabled).toBe(false);
			expect(result.verificationResultEnabled).toBe(false);
			expect(result.leadEnabled).toBe(false);
			expect(result.marketingEnabled).toBe(false);
		});
	});
});
