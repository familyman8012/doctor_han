import "server-only";

import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
	console.warn("[Notification] RESEND_API_KEY is not set");
}

if (!process.env.RESEND_FROM_EMAIL) {
	console.warn("[Notification] RESEND_FROM_EMAIL is not set, using default: noreply@medihub.kr");
}

// NOTE: RESEND_API_KEY가 없어도 build/테스트 단계에서 import-time crash가 나지 않도록 더미 키를 사용한다.
// 실제 발송 시에는 provider에서 실패하며(try/catch), delivery 로그에 기록된다.
export const resend = new Resend(process.env.RESEND_API_KEY ?? "re_dummy");

export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@medihub.kr";
