"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { creditsApi } from "@/api-client/credits";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Button } from "@/components/ui/Button/button";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

export default function ChargePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const packageId = searchParams.get("packageId");
    const widgetRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const paymentWidgetRef = useRef<Awaited<ReturnType<Awaited<ReturnType<typeof loadTossPayments>>["widgets"]>> | null>(null);

    const prepareMutation = useMutation({
        mutationFn: () => {
            if (!packageId) throw new Error("패키지를 선택해주세요.");
            return creditsApi.prepareCharge({ packageId });
        },
    });

    useEffect(() => {
        if (!packageId) {
            router.replace("/partner/credits");
            return;
        }

        prepareMutation.mutate(undefined, {
            onSuccess: async (result) => {
                try {
                    const { clientKey, orderId, amount } = result.data;

                    const tossPayments = await loadTossPayments(clientKey);
                    const widgets = tossPayments.widgets({ customerKey: orderId });

                    await widgets.setAmount({ currency: "KRW", value: amount });

                    if (widgetRef.current) {
                        await widgets.renderPaymentMethods({
                            selector: "#payment-widget",
                            variantKey: "DEFAULT",
                        });
                    }

                    paymentWidgetRef.current = widgets;
                } catch (err) {
                    setError(err instanceof Error ? err.message : "결제 위젯 초기화에 실패했습니다.");
                }
            },
            onError: (err) => {
                setError((err as { message?: string }).message ?? "충전 준비에 실패했습니다.");
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [packageId]);

    const handlePayment = async () => {
        if (!paymentWidgetRef.current || !prepareMutation.data) return;

        const { orderId, orderName, customerName } = prepareMutation.data.data;

        try {
            await paymentWidgetRef.current.requestPayment({
                orderId,
                orderName,
                customerName,
                successUrl: `${window.location.origin}/partner/credits/charge/success`,
                failUrl: `${window.location.origin}/partner/credits/charge/fail`,
            });
        } catch (err) {
            // 사용자가 결제를 취소한 경우
            if ((err as { code?: string }).code === "USER_CANCEL") {
                return;
            }
            setError(err instanceof Error ? err.message : "결제 요청에 실패했습니다.");
        }
    };

    if (error) {
        return (
            <div className="max-w-md mx-auto py-10 text-center">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <p className="text-red-600 font-medium">오류 발생</p>
                    <p className="text-sm text-red-500 mt-2">{error}</p>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="mt-4"
                        onClick={() => router.push("/partner/credits")}
                    >
                        돌아가기
                    </Button>
                </div>
            </div>
        );
    }

    if (prepareMutation.isPending) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Spinner size="lg" />
                <p className="text-gray-500">결제를 준비하고 있습니다...</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-bold text-content-primary">크레딧 충전</h1>
                {prepareMutation.data && (
                    <p className="text-gray-500 mt-1">
                        {prepareMutation.data.data.orderName} -{" "}
                        {new Intl.NumberFormat("ko-KR").format(prepareMutation.data.data.amount)}원
                    </p>
                )}
            </div>

            <div id="payment-widget" ref={widgetRef} />

            <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handlePayment}
                disabled={!paymentWidgetRef.current}
            >
                결제하기
            </Button>
        </div>
    );
}
