"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { errorHandler } from "@/api-client/error-handler";
import { ClientPermissionProvider } from "@/components/features/agents-ncos/providers/client-permission-provider";

/**
 * 새로운 작업을 위한 Provider
 * - React Query v5 대응 (QueryCache/MutationCache로 중앙 에러 처리)
 * - axios interceptor와 연동된 중앙집중형 에러 처리
 * - 권한 관리 포함
 */
export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60_000, // 1분 기본 캐시 시간
                        refetchOnWindowFocus: false, // 창 포커스 시 자동 재요청 비활성화
                        retry: false, // 재시도 안 함 (필요시 개별 query에서 설정)
                    },
                    mutations: {
                        retry: false, // 재시도 안 함 (필요시 개별 mutation에서 설정)
                    },
                },
                // QueryCache로 모든 Query 에러 처리
                queryCache: new QueryCache({
                    onError: (error: unknown) => {
                        // 더 자세한 에러 정보 출력
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
                // MutationCache로 모든 Mutation 에러 처리
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
                <ClientPermissionProvider>
                    {children}
                    {/* Toast 알림 컴포넌트 */}
                    <Toaster position="bottom-right" richColors closeButton duration={4000} />
                </ClientPermissionProvider>
                {/* 개발 환경에서만 React Query 디버깅 도구 표시 */}
                {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
        </NuqsAdapter>
    );
}
