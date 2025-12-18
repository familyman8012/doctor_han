import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

// 환경 변수에서 API URL 가져오기 (Next.js API Routes 사용시 빈 문자열)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Axios 인스턴스 생성 - Next.js 15의 fetch 어댑터와 캐싱 지원
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
    // Next.js 15와의 호환성을 위한 fetch 어댑터 사용
    adapter: "fetch" as any,
});

// Request 인터셉터 - 모든 요청 전 처리
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Better Auth가 쿠키로 인증을 자동 처리하므로 별도 토큰 설정 불필요
        // 필요시 withCredentials 옵션으로 쿠키 포함
        config.withCredentials = true;

        // 요청 로깅 (개발 환경에서만)
        if (process.env.NODE_ENV === "development") {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
                params: config.params,
                data: config.data,
            });
        }

        return config;
    },
    (error) => {
        console.error("[API Request Error]", error);
        return Promise.reject(error);
    },
);

// Response 인터셉터 - 모든 응답 후 처리
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // 응답 로깅 (개발 환경에서만)
        if (process.env.NODE_ENV === "development") {
            console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                status: response.status,
                data: response.data,
            });
        }

        // API 응답에 code가 있고 성공이 아닌 경우 (비즈니스 로직 에러)
        if (response.data?.code && response.data.code !== "0000") {
            const standardError = {
                code: response.data.code,
                message: response.data.message || "요청 처리에 실패했습니다.",
                status: response.status,
                data: response.data.data || null,
                response,
            };
            return Promise.reject(standardError);
        }

        return response;
    },
    (error) => {
        // 타임아웃 에러
        if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
            return Promise.reject({
                code: "TIMEOUT_ERROR",
                message: "요청 시간이 초과되었습니다.",
                status: 0,
                data: null,
            });
        }

        // HTTP 에러 응답
        if (error.response) {
            const { status, data } = error.response;

            console.log("error.response", error.response);

            // 표준화된 에러 객체
            const message = data?.error || data?.message || getDefaultMessage(status);
            const details = data?.details ?? data?.data ?? null;

            const standardError = {
                code: data?.code || status.toString(),
                message,
                status,
                data: details,
                details,
                response: error.response,
            };

            return Promise.reject(standardError);
        }

        // 네트워크 에러 (요청은 보냈지만 응답 없음)
        if (error.request) {
            return Promise.reject({
                code: "NETWORK_ERROR",
                message: "네트워크 연결을 확인해주세요.",
                status: 0,
                data: null,
            });
        }

        // 요청 설정 중 에러
        return Promise.reject({
            code: "REQUEST_ERROR",
            message: error.message || "요청 처리 중 오류가 발생했습니다.",
            status: 0,
            data: null,
        });
    },
);

// HTTP 상태 코드별 기본 메시지
function getDefaultMessage(status: number): string {
    switch (status) {
        case 400:
            return "잘못된 요청입니다.";
        case 401:
            return "인증이 필요합니다.";
        case 403:
            return "권한이 없습니다.";
        case 404:
            return "요청한 리소스를 찾을 수 없습니다.";
        case 409:
            return "데이터 충돌이 발생했습니다.";
        case 429:
            return "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        case 500:
            return "서버 오류가 발생했습니다.";
        case 502:
            return "게이트웨이 오류가 발생했습니다.";
        case 503:
            return "서비스를 일시적으로 사용할 수 없습니다.";
        default:
            return "알 수 없는 오류가 발생했습니다.";
    }
}

// Next.js 서버 컴포넌트를 위한 확장 메서드
export interface FetchOptions {
    cache?: RequestCache;
    next?: {
        revalidate?: number | false;
        tags?: string[];
    };
}

// 파일 업로드를 위한 특별 메서드 (multipart/form-data 헤더 자동 설정)
export const apiUpload = async <T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void,
): Promise<T> => {
    const response = await api.post<T>(url, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        onUploadProgress,
    });
    return response.data;
};

// 기본 axios 인스턴스 export (직접 사용이 필요한 경우)
export default api;
