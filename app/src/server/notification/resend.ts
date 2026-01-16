import "server-only";

import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
	console.warn("[Notification] RESEND_API_KEY is not set");
}

if (!process.env.RESEND_FROM_EMAIL) {
	console.warn("[Notification] RESEND_FROM_EMAIL is not set, using default: noreply@medihub.kr");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@medihub.kr";
