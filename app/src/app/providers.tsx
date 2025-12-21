"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { errorHandler } from "@/api-client/error-handler";
import { AuthProvider } from "@/components/providers/AuthProvider";

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
                    onError: (error: unknown) => {
                        if (error instanceof Error) {
                            console.error("[Query Error]", {
                                error: error.message,
                                stack: error.stack,
                                cause: error.cause,
                                ...error,
                            });
                        } else {
                            console.error("[Query Error]", error);
                        }
                        errorHandler(error);
                    },
                }),
                mutationCache: new MutationCache({
                    onError: (error: unknown) => {
                        console.error("[Mutation Error]", error);
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
