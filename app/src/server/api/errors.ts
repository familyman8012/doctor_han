export type ApiErrorCode = "4000" | "4040" | "4090" | "4290" | "5000" | "8999" | "8991" | "8001";

export class ApiError extends Error {
    public readonly status: number;
    public readonly code: ApiErrorCode;
    public readonly details?: unknown;

    constructor(input: { status: number; code: ApiErrorCode; message: string; details?: unknown }) {
        super(input.message);
        this.name = "ApiError";
        this.status = input.status;
        this.code = input.code;
        this.details = input.details;
    }
}

export function badRequest(message = "잘못된 요청입니다.", details?: unknown): ApiError {
    return new ApiError({ status: 400, code: "4000", message, details });
}

export function notFound(message = "요청한 리소스를 찾을 수 없습니다.", details?: unknown): ApiError {
    return new ApiError({ status: 404, code: "4040", message, details });
}

export function conflict(message = "데이터 충돌이 발생했습니다.", details?: unknown): ApiError {
    return new ApiError({ status: 409, code: "4090", message, details });
}

export function internalServerError(message = "서버 오류가 발생했습니다.", details?: unknown): ApiError {
    return new ApiError({ status: 500, code: "5000", message, details });
}

export function unauthorized(message = "인증이 필요합니다.", details?: unknown): ApiError {
    return new ApiError({ status: 401, code: "8999", message, details });
}

export function forbidden(message = "권한이 없습니다.", details?: unknown): ApiError {
    return new ApiError({ status: 403, code: "8991", message, details });
}

export function approvalRequired(message = "승인이 필요한 계정입니다.", details?: unknown): ApiError {
    return new ApiError({ status: 403, code: "8001", message, details });
}

export function tooManyRequests(
    message = "요청 횟수를 초과했습니다.",
    details?: { resetAt?: string; retryAfter?: number },
): ApiError {
    return new ApiError({ status: 429, code: "4290", message, details });
}

