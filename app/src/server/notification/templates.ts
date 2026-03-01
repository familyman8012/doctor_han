import "server-only";

export interface VerificationEmailData {
	recipientName: string;
	type: "doctor" | "vendor";
	rejectReason?: string;
}

export function getDoctorApprovedTemplate(data: VerificationEmailData) {
	return {
		subject: "[메디허브] 한의사 인증이 승인되었습니다",
		body: `
안녕하세요, ${data.recipientName}님.

한의사 인증 신청이 승인되었습니다.

이제 메디허브의 모든 기능을 이용하실 수 있습니다.
지금 바로 로그인하여 다양한 의료 관련 업체를 만나보세요.

---
메디허브 드림
문의: support@medihub.kr
		`.trim(),
	};
}

export function getDoctorRejectedTemplate(data: VerificationEmailData) {
	return {
		subject: "[메디허브] 한의사 인증이 반려되었습니다",
		body: `
안녕하세요, ${data.recipientName}님.

한의사 인증 신청이 반려되었습니다.

[반려 사유]
${data.rejectReason || "사유 없음"}

위 사유를 확인하시고, 서류를 수정하여 다시 제출해 주세요.
로그인 후 [마이페이지 > 인증 관리]에서 재신청이 가능합니다.

---
메디허브 드림
문의: support@medihub.kr
		`.trim(),
	};
}

export function getVendorApprovedTemplate(data: VerificationEmailData) {
	return {
		subject: "[메디허브] 업체 인증이 승인되었습니다",
		body: `
안녕하세요, ${data.recipientName}님.

업체 인증 신청이 승인되었습니다.

이제 메디허브에서 한의사 고객들에게 서비스를 제공하실 수 있습니다.
지금 바로 로그인하여 업체 프로필을 완성해 보세요.

---
메디허브 드림
문의: support@medihub.kr
		`.trim(),
	};
}

export function getVendorRejectedTemplate(data: VerificationEmailData) {
	return {
		subject: "[메디허브] 업체 인증이 반려되었습니다",
		body: `
안녕하세요, ${data.recipientName}님.

업체 인증 신청이 반려되었습니다.

[반려 사유]
${data.rejectReason || "사유 없음"}

위 사유를 확인하시고, 서류를 수정하여 다시 제출해 주세요.
로그인 후 [파트너 센터 > 인증 관리]에서 재신청이 가능합니다.

---
메디허브 드림
문의: support@medihub.kr
		`.trim(),
	};
}

// ============================================================
// CPL 리드 과금 관련 이메일 템플릿
// ============================================================

export interface LeadChargeEmailData {
	vendorName: string;
	doctorName: string;
	totalAmount: number;
	serviceSummary: string; // e.g. "원외탕전, 인테리어 시공"
}

export interface LeadRefundEmailData {
	vendorName: string;
	refundAmount: number;
	refundReason: string;
}

export interface CreditLowEmailData {
	vendorName: string;
	currentBalance: number;
}

export interface LeadNoResponseWarningData {
	vendorName: string;
	doctorName: string;
	hoursElapsed: number;
}

/**
 * 리드 과금 알림 이메일 템플릿 (업체에게 발송)
 */
export function getLeadChargedTemplate(data: LeadChargeEmailData) {
	return {
		subject: `[메디허브] 새 문의가 접수되었습니다 (${data.totalAmount.toLocaleString()}원 차감)`,
		body: `
안녕하세요, ${data.vendorName}님.

새로운 문의가 접수되어 크레딧이 차감되었습니다.

[문의 정보]
- 한의사: ${data.doctorName}
- 관심 서비스: ${data.serviceSummary}
- 차감 금액: ${data.totalAmount.toLocaleString()}원

파트너 센터에 로그인하여 문의 내용을 확인하고 빠르게 응답해 주세요.
빠른 응답은 계약 성사율을 높이는 데 큰 도움이 됩니다.

---
메디허브 드림
문의: support@medihub.kr
		`.trim(),
	};
}

/**
 * 리드 환불 알림 이메일 템플릿 (업체에게 발송)
 */
export function getLeadRefundedTemplate(data: LeadRefundEmailData) {
	return {
		subject: "[메디허브] 리드 과금이 환불되었습니다",
		body: `
안녕하세요, ${data.vendorName}님.

리드 과금이 환불 처리되었습니다.

[환불 정보]
- 환불 금액: ${data.refundAmount.toLocaleString()}원
- 환불 사유: ${data.refundReason}

환불된 크레딧은 잔액에 즉시 반영됩니다.
파트너 센터에서 크레딧 내역을 확인하실 수 있습니다.

---
메디허브 드림
문의: support@medihub.kr
		`.trim(),
	};
}

/**
 * 크레딧 잔액 부족 알림 이메일 템플릿 (업체에게 발송)
 */
export function getCreditLowTemplate(data: CreditLowEmailData) {
	return {
		subject: "[메디허브] 크레딧 잔액이 부족합니다",
		body: `
안녕하세요, ${data.vendorName}님.

현재 크레딧 잔액이 부족합니다.

[잔액 정보]
- 현재 잔액: ${data.currentBalance.toLocaleString()}원

잔액이 부족하면 새로운 문의를 받을 수 없습니다.
파트너 센터에서 크레딧을 충전하여 문의 수신을 계속해 주세요.

---
메디허브 드림
문의: support@medihub.kr
		`.trim(),
	};
}

/**
 * 미응답 문의 경고 이메일 템플릿 (업체에게 발송)
 */
export function getLeadNoResponseWarningTemplate(data: LeadNoResponseWarningData) {
	return {
		subject: "[메디허브] 미응답 문의가 있습니다",
		body: `
안녕하세요, ${data.vendorName}님.

아직 응답하지 않은 문의가 있습니다.

[미응답 문의 정보]
- 한의사: ${data.doctorName}
- 경과 시간: ${data.hoursElapsed}시간

문의 접수 후 72시간 이내에 응답이 없으면 자동으로 환불 처리됩니다.
파트너 센터에 로그인하여 빠르게 응답해 주세요.

---
메디허브 드림
문의: support@medihub.kr
		`.trim(),
	};
}
