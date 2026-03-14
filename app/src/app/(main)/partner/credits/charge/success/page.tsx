"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "@/api-client/payments";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Button } from "@/components/ui/Button/button";
import { CheckCircle2 } from "lucide-react";

function formatKRW(amount: number): string {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

export default function ChargeSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();

    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    const confirmMutation = useMutation({
        mutationFn: () => {
            if (!paymentKey || !orderId || !amount) {
                throw new Error("결제 정보가 누락되었습니다.");
            }
            return paymentsApi.confirm({
                paymentKey,
                orderId,
                amount: Number(amount),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["credits"] });
        },
    });

    useEffect(() => {
        if (paymentKey && orderId && amount) {
            confirmMutation.mutate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentKey, orderId, amount]);

    if (confirmMutation.isPending) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Spinner size="lg" />
                <p className="text-gray-500">결제를 확인하고 있습니다...</p>
            </div>
        );
    }

    if (confirmMutation.isError) {
        const errorMessage = (confirmMutation.error as { message?: string }).message ?? "결제 확인에 실패했습니다.";
        return (
            <div className="max-w-md mx-auto py-10 text-center">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <p className="text-red-600 font-medium">결제 확인 실패</p>
                    <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
                    <p className="text-xs text-gray-400 mt-2">
                        웹훅을 통해 자동으로 처리될 수 있습니다. 잠시 후 확인해주세요.
                    </p>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="mt-4"
                        onClick={() => router.push("/partner/credits")}
                    >
                        크레딧 관리로 이동
                    </Button>
                </div>
            </div>
        );
    }

    if (confirmMutation.isSuccess) {
        const data = confirmMutation.data.data;
        return (
            <div className="max-w-md mx-auto py-10 text-center">
                <div className="bg-white border border-gray-200 rounded-xl p-8">
                    <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
                    <h2 className="text-xl font-bold text-content-primary mt-4">충전 완료!</h2>
                    <p className="text-gray-500 mt-2">
                        {formatKRW(data.payment.amount)}이 충전되었습니다.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <p className="text-sm text-gray-500">현재 잔액</p>
                        <p className="text-2xl font-bold text-content-primary">
                            {formatKRW(data.creditBalance)}
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        size="lg"
                        className="mt-6 w-full"
                        onClick={() => router.push("/partner/credits")}
                    >
                        크레딧 관리로 이동
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
