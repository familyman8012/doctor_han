import { describe, expect, it } from "vitest";
import {
	getKakaoDoctorApprovedTemplate,
	getKakaoDoctorRejectedTemplate,
	getKakaoVendorApprovedTemplate,
	getKakaoVendorRejectedTemplate,
	getKakaoVerificationTemplate,
	getKakaoLeadReceivedTemplate,
	getKakaoLeadRespondedTemplate,
	type KakaoTemplateData,
} from "@/server/notification/kakao-templates";

describe("kakao-templates", () => {
	describe("getKakaoDoctorApprovedTemplate", () => {
		it("한의사 승인 템플릿을 올바르게 생성한다", () => {
			const data: KakaoTemplateData = {
				recipientName: "홍길동",
				type: "doctor",
			};

			const result = getKakaoDoctorApprovedTemplate(data);

			expect(result.templateId).toBe("MEDIHUB_DOCTOR_APPROVED");
			expect(result.variables).toEqual({
				"#{이름}": "홍길동",
			});
		});
	});

	describe("getKakaoDoctorRejectedTemplate", () => {
		it("한의사 반려 템플릿을 반려 사유와 함께 생성한다", () => {
			const data: KakaoTemplateData = {
				recipientName: "홍길동",
				type: "doctor",
				rejectReason: "서류 미비",
			};

			const result = getKakaoDoctorRejectedTemplate(data);

			expect(result.templateId).toBe("MEDIHUB_DOCTOR_REJECTED");
			expect(result.variables).toEqual({
				"#{이름}": "홍길동",
				"#{반려사유}": "서류 미비",
			});
		});

		it("반려 사유가 없으면 기본값을 사용한다", () => {
			const data: KakaoTemplateData = {
				recipientName: "홍길동",
				type: "doctor",
			};

			const result = getKakaoDoctorRejectedTemplate(data);

			expect(result.variables["#{반려사유}"]).toBe("사유 없음");
		});
	});

	describe("getKakaoVendorApprovedTemplate", () => {
		it("업체 승인 템플릿을 올바르게 생성한다", () => {
			const data: KakaoTemplateData = {
				recipientName: "김사장",
				type: "vendor",
			};

			const result = getKakaoVendorApprovedTemplate(data);

			expect(result.templateId).toBe("MEDIHUB_VENDOR_APPROVED");
			expect(result.variables).toEqual({
				"#{이름}": "김사장",
			});
		});
	});

	describe("getKakaoVendorRejectedTemplate", () => {
		it("업체 반려 템플릿을 반려 사유와 함께 생성한다", () => {
			const data: KakaoTemplateData = {
				recipientName: "김사장",
				type: "vendor",
				rejectReason: "사업자등록증 불일치",
			};

			const result = getKakaoVendorRejectedTemplate(data);

			expect(result.templateId).toBe("MEDIHUB_VENDOR_REJECTED");
			expect(result.variables).toEqual({
				"#{이름}": "김사장",
				"#{반려사유}": "사업자등록증 불일치",
			});
		});

		it("반려 사유가 없으면 기본값을 사용한다", () => {
			const data: KakaoTemplateData = {
				recipientName: "김사장",
				type: "vendor",
			};

			const result = getKakaoVendorRejectedTemplate(data);

			expect(result.variables["#{반려사유}"]).toBe("사유 없음");
		});
	});

	describe("getKakaoLeadReceivedTemplate", () => {
		it("리드 수신 템플릿을 올바르게 생성한다", () => {
			const data = {
				vendorName: "메디허브 의료기기",
				doctorName: "홍길동",
			};

			const result = getKakaoLeadReceivedTemplate(data);

			expect(result.templateId).toBe("MEDIHUB_LEAD_RECEIVED");
			expect(result.variables).toEqual({
				"#{업체명}": "메디허브 의료기기",
				"#{한의사명}": "홍길동",
			});
		});
	});

	describe("getKakaoLeadRespondedTemplate", () => {
		it("리드 응답 템플릿을 올바르게 생성한다", () => {
			const data = {
				doctorName: "홍길동",
				vendorName: "메디허브 의료기기",
			};

			const result = getKakaoLeadRespondedTemplate(data);

			expect(result.templateId).toBe("MEDIHUB_LEAD_RESPONDED");
			expect(result.variables).toEqual({
				"#{한의사명}": "홍길동",
				"#{업체명}": "메디허브 의료기기",
			});
		});
	});

	describe("getKakaoVerificationTemplate", () => {
		const baseData: KakaoTemplateData = {
			recipientName: "홍길동",
			type: "doctor",
		};

		it("한의사 승인 시 올바른 템플릿을 선택한다", () => {
			const result = getKakaoVerificationTemplate("doctor", "approved", baseData);

			expect(result.templateId).toBe("MEDIHUB_DOCTOR_APPROVED");
		});

		it("한의사 반려 시 올바른 템플릿을 선택한다", () => {
			const dataWithReason: KakaoTemplateData = {
				...baseData,
				rejectReason: "서류 미비",
			};

			const result = getKakaoVerificationTemplate("doctor", "rejected", dataWithReason);

			expect(result.templateId).toBe("MEDIHUB_DOCTOR_REJECTED");
			expect(result.variables["#{반려사유}"]).toBe("서류 미비");
		});

		it("업체 승인 시 올바른 템플릿을 선택한다", () => {
			const vendorData: KakaoTemplateData = {
				recipientName: "김사장",
				type: "vendor",
			};

			const result = getKakaoVerificationTemplate("vendor", "approved", vendorData);

			expect(result.templateId).toBe("MEDIHUB_VENDOR_APPROVED");
		});

		it("업체 반려 시 올바른 템플릿을 선택한다", () => {
			const vendorData: KakaoTemplateData = {
				recipientName: "김사장",
				type: "vendor",
				rejectReason: "사업자등록증 불일치",
			};

			const result = getKakaoVerificationTemplate("vendor", "rejected", vendorData);

			expect(result.templateId).toBe("MEDIHUB_VENDOR_REJECTED");
			expect(result.variables["#{반려사유}"]).toBe("사업자등록증 불일치");
		});
	});
});
