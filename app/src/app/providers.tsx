"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { errorHandler } from "@/api-client/error-handler";
import { AuthProvider } from "@/components/providers/AuthProvider";

/** axios interceptor가 반환하는 plain object 에러를 읽기 쉬운 형태로 변환 */
function formatError(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (error && typeof error === "object") {
        const e = error as Record<string, unknown>;
        const code = e.code ?? "";
        const message = e.message ?? e.error ?? "";
        const status = e.status ?? "";
        if (message || code || status) {
            return `[${status}] ${code}: ${message || "unknown"}`;
        }
        // Fallback: serialize unknown object shape for debugging
        try {
            return JSON.stringify(error);
        } catch {
            return "unknown error object";
        }
    }
    return String(error);
}

/**
 * 앱 전역 Provider
 * - React Query v5 대응 (QueryCache/MutationCache로 중앙 에러 처리)
 * - axios interceptor와 연동된 중앙집중형 에러 처리
 * - 인증 상태 관리 (AuthProvider)
 */
export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60_000,
                        refetchOnWindowFocus: false,
                        retry: false,
                    },
                    mutations: {
                        retry: false,
                    },
                },
                queryCache: new QueryCache({
                    onError: (error: unknown, query) => {
                        const queryKey = JSON.stringify(query.queryKey);
                        console.error("[Query Error]", queryKey, formatError(error));
                        errorHandler(error);
                    },
                }),
                mutationCache: new MutationCache({
                    onError: (error: unknown) => {
                        console.error("[Mutation Error]", formatError(error));
                        errorHandler(error);
                    },
                }),
            }),
    );

    return (
        <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    {children}
                    <Toaster position="bottom-right" richColors closeButton duration={4000} />
                </AuthProvider>
                {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
        </NuqsAdapter>
    );
}
