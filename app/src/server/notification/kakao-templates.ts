import "server-only";

export interface KakaoTemplateData {
	recipientName: string;
	type: "doctor" | "vendor";
	rejectReason?: string;
}

export interface KakaoTemplate {
	templateId: string;
	variables: Record<string, string>;
}

/**
 * 한의사 인증 승인 카카오 알림톡 템플릿
 */
export function getKakaoDoctorApprovedTemplate(data: KakaoTemplateData): KakaoTemplate {
	return {
		templateId: "MEDIHUB_DOCTOR_APPROVED",
		variables: {
			"#{이름}": data.recipientName,
		},
	};
}

/**
 * 한의사 인증 반려 카카오 알림톡 템플릿
 */
export function getKakaoDoctorRejectedTemplate(data: KakaoTemplateData): KakaoTemplate {
	return {
		templateId: "MEDIHUB_DOCTOR_REJECTED",
		variables: {
			"#{이름}": data.recipientName,
			"#{반려사유}": data.rejectReason || "사유 없음",
		},
	};
}

/**
 * 업체 인증 승인 카카오 알림톡 템플릿
 */
export function getKakaoVendorApprovedTemplate(data: KakaoTemplateData): KakaoTemplate {
	return {
		templateId: "MEDIHUB_VENDOR_APPROVED",
		variables: {
			"#{이름}": data.recipientName,
		},
	};
}

/**
 * 업체 인증 반려 카카오 알림톡 템플릿
 */
export function getKakaoVendorRejectedTemplate(data: KakaoTemplateData): KakaoTemplate {
	return {
		templateId: "MEDIHUB_VENDOR_REJECTED",
		variables: {
			"#{이름}": data.recipientName,
			"#{반려사유}": data.rejectReason || "사유 없음",
		},
	};
}

/**
 * 리드 수신 카카오 알림톡 템플릿 (업체에게 발송)
 */
export function getKakaoLeadReceivedTemplate(data: { vendorName: string; doctorName: string }): KakaoTemplate {
	return {
		templateId: "MEDIHUB_LEAD_RECEIVED",
		variables: {
			"#{업체명}": data.vendorName,
			"#{한의사명}": data.doctorName,
		},
	};
}

/**
 * 리드 응답 카카오 알림톡 템플릿 (한의사에게 발송)
 */
export function getKakaoLeadRespondedTemplate(data: { doctorName: string; vendorName: string }): KakaoTemplate {
	return {
		templateId: "MEDIHUB_LEAD_RESPONDED",
		variables: {
			"#{한의사명}": data.doctorName,
			"#{업체명}": data.vendorName,
		},
	};
}

/**
 * 인증 결과 알림톡 템플릿 선택
 */
export function getKakaoVerificationTemplate(
	type: "doctor" | "vendor",
	action: "approved" | "rejected",
	data: KakaoTemplateData,
): KakaoTemplate {
	if (type === "doctor") {
		return action === "approved"
			? getKakaoDoctorApprovedTemplate(data)
			: getKakaoDoctorRejectedTemplate(data);
	}
	return action === "approved"
		? getKakaoVendorApprovedTemplate(data)
		: getKakaoVendorRejectedTemplate(data);
}

/**
 * 리드 메시지 수신 카카오 알림톡 템플릿
 */
export function getLeadMessageReceivedKakaoTemplate(data: {
	senderName: string;
	messagePreview: string;
}): KakaoTemplate {
	return {
		templateId: "MEDIHUB_LEAD_MESSAGE_RECEIVED",
		variables: {
			"#{발신자명}": data.senderName,
			"#{메시지미리보기}": data.messagePreview,
		},
	};
}

// ============================================================
// CPL 리드 과금 관련 카카오 알림톡 템플릿
// ============================================================

/**
 * 리드 과금 알림 카카오 알림톡 템플릿 (업체에게 발송)
 */
export function getKakaoLeadChargedTemplate(data: {
	vendorName: string;
	doctorName: string;
	totalAmount: number;
}): KakaoTemplate {
	return {
		templateId: "MEDIHUB_LEAD_CHARGED",
		variables: {
			"#{업체명}": data.vendorName,
			"#{한의사명}": data.doctorName,
			"#{과금액}": data.totalAmount.toLocaleString(),
		},
	};
}

/**
 * 리드 환불 알림 카카오 알림톡 템플릿 (업체에게 발송)
 */
export function getKakaoLeadRefundedTemplate(data: {
	vendorName: string;
	refundAmount: number;
}): KakaoTemplate {
	return {
		templateId: "MEDIHUB_LEAD_REFUNDED",
		variables: {
			"#{업체명}": data.vendorName,
			"#{환불액}": data.refundAmount.toLocaleString(),
		},
	};
}

/**
 * 크레딧 잔액 부족 카카오 알림톡 템플릿 (업체에게 발송)
 */
export function getKakaoCreditLowTemplate(data: {
	vendorName: string;
	currentBalance: number;
}): KakaoTemplate {
	return {
		templateId: "MEDIHUB_CREDIT_LOW",
		variables: {
			"#{업체명}": data.vendorName,
			"#{잔액}": data.currentBalance.toLocaleString(),
		},
	};
}

/**
 * 미응답 문의 경고 카카오 알림톡 템플릿 (업체에게 발송)
 */
export function getKakaoLeadNoResponseWarningTemplate(data: {
	vendorName: string;
	doctorName: string;
}): KakaoTemplate {
	return {
		templateId: "MEDIHUB_LEAD_NO_RESPONSE",
		variables: {
			"#{업체명}": data.vendorName,
			"#{한의사명}": data.doctorName,
		},
	};
}

/**
 * 미열람 문의 리마인더 카카오 알림톡 템플릿 (업체에게 발송)
 */
export function getKakaoLeadUnviewedReminderTemplate(data: {
	vendorName: string;
}): KakaoTemplate {
	return {
		templateId: "MEDIHUB_LEAD_UNVIEWED_REMINDER",
		variables: {
			"#{업체명}": data.vendorName,
		},
	};
}

// ============================================================
// 리드 상태 변경 알림 카카오 알림톡 템플릿 (의료인에게 발송)
// ============================================================

/**
 * 리드 상태 변경 알림 카카오 알림톡 템플릿 (의료인에게 발송)
 */
export function getKakaoLeadStatusChangedDoctorTemplate(data: {
	doctorName: string;
	vendorName: string;
	statusLabel: string;
}): KakaoTemplate {
	return {
		templateId: "MEDIHUB_LEAD_STATUS_CHANGED_DOCTOR",
		variables: {
			"#{한의사명}": data.doctorName,
			"#{업체명}": data.vendorName,
			"#{상태}": data.statusLabel,
		},
	};
}
