"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import api from "@/api-client/client";
import type { ApiSuccessResponse } from "@/lib/api/types";

type ConfirmResult = {
    purpose: "credit_charge" | "subscription" | "membership" | "ad_priority";
    resultId: string | null;
    creditBalance: number;
};

const PURPOSE_MESSAGES: Record<ConfirmResult["purpose"], { title: string; back: string; href: string }> = {
    credit_charge: { title: "크레딧 충전이 완료되었습니다.", back: "크레딧 내역 보기", href: "/partner/credits" },
    subscription: { title: "구독 구매가 완료되었습니다.", back: "구독 관리로 이동", href: "/partner/subscriptions" },
    membership: { title: "멤버십 구매가 완료되었습니다.", back: "멤버십 관리로 이동", href: "/partner/membership" },
    ad_priority: { title: "광고 우선순위 구매가 완료되었습니다.", back: "광고 관리로 이동", href: "/partner/ads" },
};

function PaymentsSuccessInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ConfirmResult | null>(null);

    useEffect(() => {
        const paymentKey = searchParams.get("paymentKey");
        const orderId = searchParams.get("orderId");
        const amountStr = searchParams.get("amount");
        if (!paymentKey || !orderId || !amountStr) {
            setStatus("error");
            setError("결제 정보가 누락되었습니다.");
            return;
        }
        const amount = Number(amountStr);

        api
            .post<ApiSuccessResponse<ConfirmResult>>("/api/payments/confirm", {
                paymentKey,
                orderId,
                amount,
            })
            .then((res) => {
                setResult(res.data.data);
                setStatus("ok");
            })
            .catch((err) => {
                setStatus("error");
                const msg =
                    (err as { response?: { data?: { message?: string } }; message?: string })
                        .response?.data?.message ?? (err as Error).message ?? "결제 승인 실패";
                setError(msg);
            });
    }, [searchParams]);

    if (status === "loading") {
        return (
            <div className="max-w-md mx-auto py-16 text-center">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-500">결제를 승인하는 중입니다...</p>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="max-w-md mx-auto py-10 text-center">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <p className="text-red-600 font-medium">결제 승인 실패</p>
                    <p className="text-sm text-red-500 mt-2">{error}</p>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="mt-4"
                        onClick={() => router.push("/partner")}
                    >
                        돌아가기
                    </Button>
                </div>
            </div>
        );
    }

    const info = result ? PURPOSE_MESSAGES[result.purpose] : null;
    return (
        <div className="max-w-md mx-auto py-16 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold mt-4">{info?.title ?? "결제가 완료되었습니다."}</h1>
            <Button className="mt-6" onClick={() => router.push(info?.href ?? "/partner")}>
                {info?.back ?? "돌아가기"}
            </Button>
        </div>
    );
}

export default function PaymentsSuccessPage() {
    return (
        <Suspense fallback={<div className="py-16 text-center"><Spinner size="lg" /></div>}>
            <PaymentsSuccessInner />
        </Suspense>
    );
}
