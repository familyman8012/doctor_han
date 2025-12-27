import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/supabase/server";

function sanitizeReturnUrl(value: string | null): string {
    if (!value) return "/";
    if (value.startsWith("/") && !value.startsWith("//")) return value;
    return "/";
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const mode = searchParams.get("mode") || "login";
    const authEntryPath = mode === "signup" ? "/signup" : "/login";
    const isLinkMode = mode === "link";
    const returnUrl = sanitizeReturnUrl(searchParams.get("returnUrl"));
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const redirectWithError = (message: string) => {
        if (isLinkMode) {
            const url = new URL(`${origin}${returnUrl}`);
            url.searchParams.set("linkError", message);
            return NextResponse.redirect(url);
        }

        const url = new URL(`${origin}${authEntryPath}`);
        url.searchParams.set("error", message);
        return NextResponse.redirect(url);
    };

    // OAuth 에러 처리
    if (error) {
        const errorMessage = errorDescription || error;
        return redirectWithError(errorMessage);
    }

    // code 없음
    if (!code) {
        return redirectWithError("no_code");
    }

    const supabase = await createSupabaseServerClient();

    // code를 세션으로 교환
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
        return redirectWithError(exchangeError.message);
    }

    // 계정 연결 모드면 바로 returnUrl로 이동
    if (isLinkMode) {
        const url = new URL(`${origin}${returnUrl}`);
        url.searchParams.set("linked", "1");
        return NextResponse.redirect(url);
    }

    // 프로필 존재 여부 확인
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirectWithError("auth_failed");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    // 프로필이 없으면 온보딩으로
    if (!profile) {
        const url = new URL(`${origin}/onboarding`);
        url.searchParams.set("returnUrl", returnUrl);
        return NextResponse.redirect(url);
    }

    // 프로필이 있으면 returnUrl로
    return NextResponse.redirect(`${origin}${returnUrl}`);
}
