"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Shield, Megaphone, MessageSquare } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { toast } from "sonner";
import type { NotificationSettingsView } from "@/lib/schema/notification";

type ToggleableKey = "emailEnabled" | "verificationResultEnabled" | "leadEnabled" | "marketingEnabled";

interface ToggleItemProps {
	icon: React.ReactNode;
	label: string;
	description: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
}

function ToggleItem({ icon, label, description, checked, onChange, disabled }: ToggleItemProps) {
	return (
		<div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
			<div className="flex items-start gap-3">
				<div className="w-10 h-10 rounded-lg bg-[#62e3d5]/10 flex items-center justify-center shrink-0">
					{icon}
				</div>
				<div>
					<p className="font-medium text-[#0a3b41]">{label}</p>
					<p className="text-sm text-gray-500 mt-0.5">{description}</p>
				</div>
			</div>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				aria-label={`${label} ${checked ? "활성화됨" : "비활성화됨"}`}
				disabled={disabled}
				onClick={() => onChange(!checked)}
				className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
					checked ? "bg-[#62e3d5]" : "bg-gray-200"
				}`}
			>
				<span
					className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
						checked ? "translate-x-6" : "translate-x-1"
					}`}
				/>
			</button>
		</div>
	);
}

export default function NotificationSettingsPage() {
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["notification-settings"],
		queryFn: async () => {
			const res = await api.get<{ code: string; data: { settings: NotificationSettingsView } }>(
				"/api/notification-settings",
			);
			return res.data.data.settings;
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (updates: {
			emailEnabled?: boolean;
			verificationResultEnabled?: boolean;
			leadEnabled?: boolean;
			marketingEnabled?: boolean;
		}) => {
			const res = await api.patch<{ code: string; data: { settings: NotificationSettingsView } }>(
				"/api/notification-settings",
				updates,
			);
			return res.data.data.settings;
		},
		onSuccess: (newSettings) => {
			queryClient.setQueryData(["notification-settings"], newSettings);
			toast.success("알림 설정이 변경되었습니다");
		},
	});

	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-20">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!data) {
		return (
			<div className="text-center py-10">
				<p className="text-gray-500">알림 설정을 불러올 수 없습니다.</p>
			</div>
		);
	}

	const handleToggle = (key: ToggleableKey, value: boolean) => {
		updateMutation.mutate({ [key]: value });
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-[#0a3b41]">알림 설정</h1>
				<p className="text-gray-500 mt-1">이메일 알림 수신 여부를 관리합니다</p>
			</div>

			<div className="bg-white rounded-xl border border-gray-200 p-6">
				<ToggleItem
					icon={<Mail className="w-5 h-5 text-[#62e3d5]" />}
					label="이메일 알림 전체"
					description="모든 이메일 알림 수신 여부를 설정합니다"
					checked={data.emailEnabled}
					onChange={(v) => handleToggle("emailEnabled", v)}
					disabled={updateMutation.isPending}
				/>

				<ToggleItem
					icon={<Shield className="w-5 h-5 text-[#62e3d5]" />}
					label="인증 결과 알림"
					description="한의사 인증 승인/반려 시 이메일을 받습니다"
					checked={data.verificationResultEnabled}
					onChange={(v) => handleToggle("verificationResultEnabled", v)}
					disabled={updateMutation.isPending || !data.emailEnabled}
				/>

				<ToggleItem
					icon={<MessageSquare className="w-5 h-5 text-[#62e3d5]" />}
					label="리드 관련 알림"
					description="문의 응답 및 진행 상태 알림을 받습니다"
					checked={data.leadEnabled}
					onChange={(v) => handleToggle("leadEnabled", v)}
					disabled={updateMutation.isPending || !data.emailEnabled}
				/>

				<ToggleItem
					icon={<Megaphone className="w-5 h-5 text-[#62e3d5]" />}
					label="마케팅 알림"
					description="프로모션 및 이벤트 소식을 받습니다"
					checked={data.marketingEnabled}
					onChange={(v) => handleToggle("marketingEnabled", v)}
					disabled={updateMutation.isPending || !data.emailEnabled}
				/>
			</div>

			<p className="text-xs text-gray-400">
				* 이메일 알림 전체를 끄면 하위 알림도 수신하지 않습니다.
			</p>
		</div>
	);
}
