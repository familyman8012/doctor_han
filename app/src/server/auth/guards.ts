import "server-only";

import type { Database, Tables } from "@/lib/database.types";
import { approvalRequired, forbidden, unauthorized } from "@/server/api/errors";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export type ProfileRow = Tables<"profiles">;
export type ProfileRole = ProfileRow["role"];

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
        throw unauthorized("프로필이 없습니다.");
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

export function withAuth<TParams = Record<string, string>>(
    handler: (ctx: AuthedContext<TParams>) => Promise<Response>,
): (req: NextRequest, routeCtx: { params?: TParams }) => Promise<Response> {
    return async (req, routeCtx) => {
        const supabase = await createSupabaseServerClient();
        const user = await requireUser(supabase);
        const profile = await requireProfile(supabase, user.id);

        return handler({
            req,
            params: (routeCtx?.params ?? {}) as TParams,
            supabase,
            user,
            profile,
        });
    };
}

export function withRole<TParams = Record<string, string>>(
    allowedRoles: readonly ProfileRole[],
    handler: (ctx: AuthedContext<TParams>) => Promise<Response>,
): (req: NextRequest, routeCtx: { params?: TParams }) => Promise<Response> {
    return withAuth(async (ctx) => {
        if (!allowedRoles.includes(ctx.profile.role)) {
            throw forbidden();
        }
        return handler(ctx);
    });
}

export function withApprovedDoctor<TParams = Record<string, string>>(
    handler: (ctx: AuthedContext<TParams>) => Promise<Response>,
): (req: NextRequest, routeCtx: { params?: TParams }) => Promise<Response> {
    return withRole(["doctor"], async (ctx) => {
        await requireApprovedDoctor(ctx.supabase, ctx.user.id);
        return handler(ctx);
    });
}

export function withApprovedVendor<TParams = Record<string, string>>(
    handler: (ctx: AuthedContext<TParams>) => Promise<Response>,
): (req: NextRequest, routeCtx: { params?: TParams }) => Promise<Response> {
    return withRole(["vendor"], async (ctx) => {
        await requireApprovedVendor(ctx.supabase, ctx.user.id);
        return handler(ctx);
    });
}
