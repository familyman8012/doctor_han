// OAuth Provider 설정
export const SOCIAL_PROVIDERS = [
    {
        id: "kakao",
        name: "카카오",
        bgColor: "bg-[#FEE500]",
        textColor: "text-[#191919]",
        hoverBgColor: "hover:bg-[#F5DC00]",
    },
    {
        id: "google",
        name: "Google",
        bgColor: "bg-white",
        textColor: "text-gray-700",
        hoverBgColor: "hover:bg-gray-50",
        border: true,
    },
] as const;

export type SocialProviderId = (typeof SOCIAL_PROVIDERS)[number]["id"];
