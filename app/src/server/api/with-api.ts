import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";
import { ApiError, internalServerError } from "./errors";
import { fail } from "./response";

export function withApi<TArgs extends unknown[], TResult>(
    handler: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult | ReturnType<typeof fail>> {
    return async (...args) => {
        try {
            return await handler(...args);
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                return fail({ status: error.status, code: error.code, message: error.message, details: error.details });
            }

            if (error instanceof ZodError) {
                return fail({ status: 400, code: "4000", message: "입력 검증 실패", details: error.issues });
            }

            console.error("[API Error]", error);
            Sentry.captureException(error);
            const safe = internalServerError();
            return fail({ status: safe.status, code: safe.code, message: safe.message });
        }
    };
}
