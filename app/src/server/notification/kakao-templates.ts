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
