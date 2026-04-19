"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button/button";

function PaymentsFailInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const message = searchParams.get("message") ?? "결제가 취소되었거나 실패했습니다.";

    return (
        <div className="max-w-md mx-auto py-16 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-xl font-semibold mt-4">결제에 실패했습니다.</h1>
            <p className="text-sm text-gray-500 mt-2">{message}</p>
            {code && <p className="text-xs text-gray-400 mt-1">code: {code}</p>}
            <div className="mt-6 flex gap-2 justify-center">
                <Button variant="secondary" onClick={() => router.back()}>
                    다시 시도
                </Button>
                <Button variant="primary" onClick={() => router.push("/partner")}>
                    대시보드로
                </Button>
            </div>
        </div>
    );
}

export default function PaymentsFailPage() {
    return (
        <Suspense fallback={null}>
            <PaymentsFailInner />
        </Suspense>
    );
}
