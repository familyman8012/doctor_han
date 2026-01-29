import "server-only";

import { SolapiMessageService } from "solapi";

if (!process.env.SOLAPI_API_KEY) {
	console.warn("[Notification] SOLAPI_API_KEY is not set");
}

if (!process.env.SOLAPI_API_SECRET) {
	console.warn("[Notification] SOLAPI_API_SECRET is not set");
}

if (!process.env.SOLAPI_SENDER_PHONE) {
	console.warn("[Notification] SOLAPI_SENDER_PHONE is not set");
}

if (!process.env.SOLAPI_KAKAO_PFID) {
	console.warn("[Notification] SOLAPI_KAKAO_PFID is not set");
}

export const solapiClient = new SolapiMessageService(
	process.env.SOLAPI_API_KEY ?? "",
	process.env.SOLAPI_API_SECRET ?? "",
);

export const SOLAPI_SENDER_PHONE = process.env.SOLAPI_SENDER_PHONE ?? "";
export const SOLAPI_KAKAO_PFID = process.env.SOLAPI_KAKAO_PFID ?? "";
