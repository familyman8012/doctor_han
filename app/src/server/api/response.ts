import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/api/types";
import { API_SUCCESS_CODE } from "@/lib/api/types";
import { NextResponse } from "next/server";

export function ok<T>(data: T, message?: string): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json(
        {
            code: API_SUCCESS_CODE,
            data,
            ...(message ? { message } : {}),
        },
        { status: 200 },
    );
}

export function created<T>(data: T, message?: string): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json(
        {
            code: API_SUCCESS_CODE,
            data,
            ...(message ? { message } : {}),
        },
        { status: 201 },
    );
}

export function fail(input: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
}): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
        {
            code: input.code,
            message: input.message,
            ...(typeof input.details === "undefined" ? {} : { details: input.details }),
        },
        { status: input.status },
    );
}

