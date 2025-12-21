import { create } from "zustand";

export type UserRole = "guest" | "doctor" | "vendor" | "admin";
export type ProfileStatus = "active" | "inactive" | "banned";

export interface Profile {
    id: string;
    role: Exclude<UserRole, "guest">;
    status: ProfileStatus;
    displayName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    email: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    email: string | null;
    phone: string | null;
}

export interface VerificationSummary {
    status: "pending" | "approved" | "rejected";
    reviewedAt: string | null;
    rejectReason: string | null;
}

interface AuthState {
    user: User | null;
    profile: Profile | null;
    doctorVerification: VerificationSummary | null;
    vendorVerification: VerificationSummary | null;
    onboardingRequired: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    setAuth: (data: {
        user: User | null;
        profile: Profile | null;
        doctorVerification: VerificationSummary | null;
        vendorVerification: VerificationSummary | null;
        onboardingRequired: boolean;
    }) => void;
    setLoading: (loading: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    reset: () => void;
}

const initialState = {
    user: null,
    profile: null,
    doctorVerification: null,
    vendorVerification: null,
    onboardingRequired: false,
    isLoading: true,
    isInitialized: false,
};

export const useAuthStore = create<AuthState>((set) => ({
    ...initialState,
    setAuth: (data) =>
        set({
            user: data.user,
            profile: data.profile,
            doctorVerification: data.doctorVerification,
            vendorVerification: data.vendorVerification,
            onboardingRequired: data.onboardingRequired,
            isLoading: false,
            isInitialized: true,
        }),
    setLoading: (isLoading) => set({ isLoading }),
    setInitialized: (isInitialized) => set({ isInitialized }),
    reset: () => set(initialState),
}));

// 편의 셀렉터
export const useUser = () => useAuthStore((state) => state.user);
export const useProfile = () => useAuthStore((state) => state.profile);
export const useUserRole = () => useAuthStore((state) => state.profile?.role ?? "guest");
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useIsApproved = () => {
    const profile = useAuthStore((state) => state.profile);
    const doctorVerification = useAuthStore((state) => state.doctorVerification);
    const vendorVerification = useAuthStore((state) => state.vendorVerification);

    if (!profile) return false;
    if (profile.role === "admin") return true;
    if (profile.role === "doctor") return doctorVerification?.status === "approved";
    if (profile.role === "vendor") return vendorVerification?.status === "approved";
    return false;
};
