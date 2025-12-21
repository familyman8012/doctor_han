"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { useAuthStore, type UserRole } from "@/stores/auth";

interface AuthGuardProps {
    children: ReactNode;
    /** 허용된 역할. 비어있으면 로그인만 검사 */
    allowedRoles?: UserRole[];
    /** 미승인 사용자도 허용할지 여부 (기본: false) */
    allowPending?: boolean;
    /** 로그인 안 된 경우 리다이렉트할 경로 (기본: /login) */
    loginRedirect?: string;
    /** 권한 없을 때 리다이렉트할 경로 (기본: /) */
    unauthorizedRedirect?: string;
    /** 미승인 상태일 때 리다이렉트할 경로 (기본: /verification) */
    pendingRedirect?: string;
    /** 로딩 중 표시할 컴포넌트 */
    loadingComponent?: ReactNode;
}

export function AuthGuard({
    children,
    allowedRoles = [],
    allowPending = false,
    loginRedirect = "/login",
    unauthorizedRedirect = "/",
    pendingRedirect = "/verification",
    loadingComponent,
}: AuthGuardProps) {
    const router = useRouter();
    const {
        user,
        profile,
        doctorVerification,
        vendorVerification,
        onboardingRequired,
        isLoading,
        isInitialized,
    } = useAuthStore();

    useEffect(() => {
        if (!isInitialized || isLoading) return;

        // 로그인 체크
        if (!user) {
            const returnUrl =
                typeof window !== "undefined"
                    ? `${window.location.pathname}${window.location.search}`
                    : "";
            router.replace(`${loginRedirect}${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`);
            return;
        }

        // 프로필 없음(온보딩 필요)
        if (onboardingRequired || !profile) {
            router.replace("/signup");
            return;
        }

        // 역할 체크 (allowedRoles가 있는 경우에만)
        if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
            router.replace(unauthorizedRedirect);
            return;
        }

        // 승인 상태 체크 (allowPending이 false인 경우)
        if (!allowPending) {
            const isApproved = checkApprovalStatus(
                profile.role,
                doctorVerification?.status,
                vendorVerification?.status
            );
            if (!isApproved) {
                router.replace(pendingRedirect);
            }
        }
    }, [
        user,
        profile,
        doctorVerification,
        vendorVerification,
        onboardingRequired,
        isLoading,
        isInitialized,
        allowedRoles,
        allowPending,
        router,
        loginRedirect,
        unauthorizedRedirect,
        pendingRedirect,
    ]);

    // 로딩 중
    if (!isInitialized || isLoading) {
        return loadingComponent ?? <LoadingScreen />;
    }

    // 인증 안 됨
    if (!user) {
        return loadingComponent ?? <LoadingScreen />;
    }

    // 프로필 없음(온보딩 필요)
    if (onboardingRequired || !profile) {
        return loadingComponent ?? <LoadingScreen />;
    }

    // 역할 체크
    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
        return loadingComponent ?? <LoadingScreen />;
    }

    // 승인 상태 체크
    if (!allowPending) {
        const isApproved = checkApprovalStatus(
            profile.role,
            doctorVerification?.status,
            vendorVerification?.status
        );
        if (!isApproved) {
            return loadingComponent ?? <LoadingScreen />;
        }
    }

    return <>{children}</>;
}

function checkApprovalStatus(
    role: UserRole,
    doctorStatus?: string | null,
    vendorStatus?: string | null
): boolean {
    if (role === "admin") return true;
    if (role === "doctor") return doctorStatus === "approved";
    if (role === "vendor") return vendorStatus === "approved";
    return true; // guest는 승인 불필요
}

function LoadingScreen() {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Spinner className="w-8 h-8" />
        </div>
    );
}

// 편의 컴포넌트들

/** 한의사 전용 가드 */
export function DoctorGuard({ children, ...props }: Omit<AuthGuardProps, "allowedRoles">) {
    return (
        <AuthGuard allowedRoles={["doctor", "admin"]} {...props}>
            {children}
        </AuthGuard>
    );
}

/** 업체 전용 가드 */
export function VendorGuard({ children, ...props }: Omit<AuthGuardProps, "allowedRoles">) {
    return (
        <AuthGuard allowedRoles={["vendor", "admin"]} {...props}>
            {children}
        </AuthGuard>
    );
}

/** 관리자 전용 가드 */
export function AdminGuard({ children, ...props }: Omit<AuthGuardProps, "allowedRoles">) {
    return (
        <AuthGuard allowedRoles={["admin"]} {...props}>
            {children}
        </AuthGuard>
    );
}

/** 로그인된 사용자 (역할 무관) */
export function LoggedInGuard({ children, ...props }: Omit<AuthGuardProps, "allowedRoles" | "allowPending">) {
    return (
        <AuthGuard allowedRoles={[]} allowPending {...props}>
            {children}
        </AuthGuard>
    );
}
