import "server-only";

import type { Database, Tables } from "@/lib/database.types";
import { approvalRequired, forbidden, notFound, unauthorized } from "@/server/api/errors";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export type ProfileRow = Tables<"profiles">;
export type ProfileRole = ProfileRow["role"];

type NextRouteContext<TParams> = {
    params: Promise<TParams>;
};

export type UserContext<TParams = Record<string, string>> = {
    req: NextRequest;
    params: TParams;
    supabase: SupabaseClient<Database>;
    user: User;
};

export type AuthedContext<TParams = Record<string, string>> = {
    req: NextRequest;
    params: TParams;
    supabase: SupabaseClient<Database>;
    user: User;
    profile: ProfileRow;
};

export async function requireUser(supabase: SupabaseClient<Database>): Promise<User> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        throw unauthorized();
    }
    return data.user;
}

export async function requireProfile(supabase: SupabaseClient<Database>, userId: string): Promise<ProfileRow> {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error || !data) {
        throw notFound("프로필이 없습니다.");
    }
    return data;
}

export async function requireApprovedDoctor(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
    const { data, error } = await supabase
        .from("doctor_verifications")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw unauthorized("검수 상태를 확인할 수 없습니다.");
    }

    if (!data || data.status !== "approved") {
        throw approvalRequired("승인 대기/반려 상태입니다. 검수 상태를 확인해주세요.", {
            status: data?.status ?? null,
        });
    }
}

export async function requireApprovedVendor(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
    const { data, error } = await supabase
        .from("vendor_verifications")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw unauthorized("검수 상태를 확인할 수 없습니다.");
    }

    if (!data || data.status !== "approved") {
        throw approvalRequired("승인 대기/반려 상태입니다. 검수 상태를 확인해주세요.", {
            status: data?.status ?? null,
        });
    }
}

export function withUser<TParams = Record<string, string>>(
    handler: (ctx: UserContext<TParams>) => Promise<Response>,
): (req: NextRequest, routeCtx: NextRouteContext<TParams>) => Promise<Response> {
    return async (req, routeCtx) => {
        const supabase = await createSupabaseServerClient();
        const user = await requireUser(supabase);
        const params = await routeCtx.params;

        return handler({
            req,
            params,
            supabase,
            user,
        });
    };
}

export function withAuth<TParams = Record<string, string>>(
    handler: (ctx: AuthedContext<TParams>) => Promise<Response>,
): (req: NextRequest, routeCtx: NextRouteContext<TParams>) => Promise<Response> {
    return withUser(async (ctx) => {
        let profile = await requireProfile(ctx.supabase, ctx.user.id);

        // suspended 자동 해제: suspended_until이 지났으면 active로 복구
        if (profile.status === "suspended") {
            const row = profile as ProfileRow & { suspended_until?: string | null };
            if (row.suspended_until && new Date(row.suspended_until).getTime() <= Date.now()) {
                const { data: updated } = await ctx.supabase
                    .from("profiles")
                    .update({
                        status: "active",
                        suspended_until: null,
                        status_reason: null,
                        status_changed_at: new Date().toISOString(),
                    })
                    .eq("id", profile.id)
                    .select("*")
                    .single();
                if (updated) {
                    profile = updated;
                }
            }
        }

        if (profile.status !== "active") {
            const row = profile as ProfileRow & {
                suspended_until?: string | null;
                status_reason?: string | null;
            };
            const reason = row.status_reason ? ` 사유: ${row.status_reason}` : "";
            if (profile.status === "banned") {
                throw forbidden(`영구 정지된 계정입니다.${reason}`);
            }
            if (profile.status === "suspended") {
                const until = row.suspended_until
                    ? ` (해제 예정: ${new Date(row.suspended_until).toLocaleString("ko-KR")})`
                    : "";
                throw forbidden(`일시 정지된 계정입니다.${until}${reason}`);
            }
            if (profile.status === "inactive") {
                throw forbidden(`탈퇴 처리된 계정입니다.${reason}`);
            }
            throw forbidden("비활성 계정입니다.");
        }
        return handler({ ...ctx, profile });
    });
}

export function withRole<TParams = Record<string, string>>(
    allowedRoles: readonly ProfileRole[],
    handler: (ctx: AuthedContext<TParams>) => Promise<Response>,
): (req: NextRequest, routeCtx: NextRouteContext<TParams>) => Promise<Response> {
    return withAuth(async (ctx) => {
        if (!allowedRoles.includes(ctx.profile.role)) {
            throw forbidden();
        }
        return handler(ctx);
    });
}

export function withApprovedDoctor<TParams = Record<string, string>>(
    handler: (ctx: AuthedContext<TParams>) => Promise<Response>,
): (req: NextRequest, routeCtx: NextRouteContext<TParams>) => Promise<Response> {
    return withRole(["doctor"], async (ctx) => {
        await requireApprovedDoctor(ctx.supabase, ctx.user.id);
        return handler(ctx);
    });
}

export async function requireActiveVendor(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
    const { data, error } = await supabase
        .from("vendors")
        .select("status")
        .eq("owner_user_id", userId)
        .maybeSingle();

    if (error) {
        throw unauthorized("업체 상태를 확인할 수 없습니다.");
    }

    if (!data || data.status !== "active") {
        throw forbidden(
            data?.status === "banned" ? "정지된 업체입니다." : "비활성 업체입니다.",
        );
    }
}

export function withApprovedVendor<TParams = Record<string, string>>(
    handler: (ctx: AuthedContext<TParams>) => Promise<Response>,
): (req: NextRequest, routeCtx: NextRouteContext<TParams>) => Promise<Response> {
    return withRole(["vendor"], async (ctx) => {
        await requireApprovedVendor(ctx.supabase, ctx.user.id);
        await requireActiveVendor(ctx.supabase, ctx.user.id);
        return handler(ctx);
    });
}
