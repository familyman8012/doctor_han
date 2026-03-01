import "server-only";

import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
	if (!_resend) {
		if (!process.env.RESEND_API_KEY) {
			console.warn("[Notification] RESEND_API_KEY is not set");
		}
		_resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
	}
	return _resend;
}

/** @deprecated Use getResend() instead */
export const resend = {
	get emails() {
		return getResend().emails;
	},
};

export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@medihub.kr";
