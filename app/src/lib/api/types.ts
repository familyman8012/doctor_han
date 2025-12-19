export const API_SUCCESS_CODE = "0000" as const;

export type ApiSuccessResponse<T> = {
    code: typeof API_SUCCESS_CODE;
    data: T;
    message?: string;
};

export type ApiErrorResponse = {
    code: string;
    message: string;
    details?: unknown;
};

