"use client";

import { useIsApproved } from "@/stores/auth";
import { toast } from "sonner";
import type { ReactNode, MouseEvent } from "react";

interface RequireApprovalProps {
    children: ReactNode;
    message?: string;
}

/**
 * 인증 미승인 사용자의 액션을 차단하는 래퍼.
 * 클릭 이벤트를 가로채서 토스트 안내를 보여줌.
 */
export function RequireApproval({
    children,
    message = "인증 완료 후 이용할 수 있습니다.",
}: RequireApprovalProps) {
    const isApproved = useIsApproved();

    if (isApproved) {
        return <>{children}</>;
    }

    const handleBlock = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toast.error(message);
    };

    return (
        <div onClick={handleBlock} className="cursor-not-allowed [&>*]:pointer-events-none [&>*]:opacity-60">
            {children}
        </div>
    );
}
