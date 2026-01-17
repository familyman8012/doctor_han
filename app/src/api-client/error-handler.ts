import { toast } from "sonner";
import { signOut } from "@/server/auth/client";

// 서버 에러 타입 정의
export interface ServerError {
    code: string;
    message?: string;
    error?: string;
    status?: number;
    data?: unknown;
    details?: unknown;
    response?: unknown;
}

function hasStringField<K extends string>(value: unknown, key: K): value is Record<K, string> {
    return (
        value !== null &&
        typeof value === "object" &&
        key in value &&
        typeof (value as Record<K, unknown>)[key] === "string"
    );
}

// details/data에 담긴 추가 메시지를 토스트 description으로 노출하기 위한 보조 함수
const extractDescription = (details: unknown): string | undefined => {
    if (!details) return undefined;
    if (typeof details === "string") return details;

    if (Array.isArray(details)) {
        const messages = details
            .map((item) => {
                if (typeof item === "string") return item;
                if (hasStringField(item, "message")) {
                    return item.message;
                }
                return null;
            })
            .filter((msg): msg is string => Boolean(msg));
        if (messages.length > 0) {
            const limited = messages.slice(0, 5);
            const suffix = messages.length > 5 ? "\n…" : "";
            return `${limited.join("\n")}${suffix}`;
        }
    }

    if (details && typeof details === "object") {
        if (hasStringField(details, "message")) {
            return details.message;
        }
        if (hasStringField(details, "error")) {
            return details.error;
        }
    }

    return undefined;
};

// 특별 처리가 필요한 에러 메시지만 정의
const getSpecialErrorMessage = (code: string): string | null => {
    switch (code) {
        // 4xxx: 클라이언트 에러 특별 처리
        case "4290":
            return null; // 429 에러는 details에서 직접 메시지 구성
        // 8xxx: 인증/권한 에러 특별 처리
        case "8001":
            return "승인 대기/반려 상태입니다. 검수 페이지에서 확인해주세요.";
        case "8999":
            return "로그인이 필요합니다. 다시 로그인해 주세요.";
        case "8991":
            return "해당 페이지의 접근권한이 없습니다.";
        default:
            return null;
    }
};

// 중앙 에러 핸들러
export const errorHandler = (errorData: unknown): void => {
    const { code, message, error, details, data } = errorData as ServerError;

    // 429 Too Many Requests 특별 처리
    if (code === "4290") {
        const retryAfter = (details as { retryAfter?: number } | undefined)?.retryAfter;
        const rateLimitMessage = retryAfter
            ? `요청 횟수를 초과했습니다. ${retryAfter}초 후 다시 시도해주세요.`
            : message || "요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.";
        toast.error(rateLimitMessage, { id: code });
        return;
    }

    // 특별 메시지가 있으면 사용, 없으면 전달받은 메시지 사용
    const errorMessage = getSpecialErrorMessage(code) || message || error;
    const description = extractDescription(details ?? data);

    // 에러 코드에 따른 처리
    const errorCode = Number(code);

    // 8xxx: 인증 에러 처리
    if (errorCode >= 8000 && errorCode < 9000) {
        toast.error(errorMessage, { id: code, ...(description ? { description } : {}) });

        // 세션 없음(로그인 필요)만 로그아웃 처리
        if (code === "8999") {
            signOut()
                .then(() => {
                    window.location.href = "/";
                })
                .catch(() => {
                    // signOut 실패해도 홈으로 이동
                    window.location.href = "/";
                });
            return;
        }

        // 승인 필요(검수) - 로그아웃 금지 + 검수 페이지로 이동
        if (code === "8001") {
            if (!window.location.pathname.startsWith("/verification")) {
                window.location.href = "/verification";
            }
            return;
        }

        // 권한 없음 - 홈으로
        if (code === "8991") {
            window.location.href = "/";
        }

        return;
    }

    // 일반 에러 - 메시지만 표시
    toast.error(errorMessage || `요청 처리에 실패했습니다. (${code})`, {
        id: code,
        ...(description ? { description } : {}),
    });
};
