"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button/button";
import { XCircle } from "lucide-react";

export default function ChargeFailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const code = searchParams.get("code");
    const message = searchParams.get("message");

    return (
        <div className="max-w-md mx-auto py-10 text-center">
            <div className="bg-white border border-gray-200 rounded-xl p-8">
                <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                <h2 className="text-xl font-bold text-content-primary mt-4">결제 실패</h2>
                <p className="text-gray-500 mt-2">
                    {message || "결제가 완료되지 않았습니다."}
                </p>
                {code && (
                    <p className="text-xs text-gray-400 mt-1">오류 코드: {code}</p>
                )}
                <div className="flex gap-3 mt-6">
                    <Button
                        variant="secondary"
                        size="lg"
                        className="flex-1"
                        onClick={() => router.push("/partner/credits")}
                    >
                        돌아가기
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        className="flex-1"
                        onClick={() => router.back()}
                    >
                        다시 시도
                    </Button>
                </div>
            </div>
        </div>
    );
}
