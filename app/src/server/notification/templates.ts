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
