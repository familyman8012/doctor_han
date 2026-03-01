import "server-only";

import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
	if (!_resend) {
		const apiKey = process.env.RESEND_API_KEY?.trim();
		if (!apiKey) {
			console.warn("[Notification] RESEND_API_KEY is not set");
		}
		_resend = new Resend(apiKey || "re_placeholder");
	}
	return _resend;
}

if (!process.env.RESEND_FROM_EMAIL) {
	console.warn("[Notification] RESEND_FROM_EMAIL is not set, using default: noreply@medihub.kr");
}

/** @deprecated Use getResend() instead */
export const resend = {
	get emails() {
		return getResend().emails;
	},
};

export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@medihub.kr";
