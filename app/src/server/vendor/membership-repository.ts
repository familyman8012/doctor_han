import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MembershipPlanRow, VendorMembershipRow } from "./membership-mapper";

export async function listActiveMembershipPlans(
    supabase: SupabaseClient<Database>,
): Promise<MembershipPlanRow[]> {
    const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (error) {
        throw internalServerError("멤버십 플랜을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as MembershipPlanRow[];
}

export async function getMembershipPlanById(
    supabase: SupabaseClient<Database>,
    planId: string,
): Promise<MembershipPlanRow | null> {
    const { data, error } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("id", planId)
        .maybeSingle();

    if (error) {
        throw internalServerError("멤버십 플랜을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data as MembershipPlanRow | null;
}

export async function getActiveMembership(
    supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<VendorMembershipRow | null> {
    const { data, error } = await supabase
        .from("vendor_memberships")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        throw internalServerError("활성 멤버십을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data as VendorMembershipRow | null;
}

export async function getMembershipById(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<VendorMembershipRow | null> {
    const { data, error } = await supabase
        .from("vendor_memberships")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw internalServerError("멤버십을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data as VendorMembershipRow | null;
}

export async function listAllMemberships(
    supabase: SupabaseClient<Database>,
    params: {
        status?: string;
        vendorId?: string;
        page: number;
        pageSize: number;
    },
): Promise<{ rows: VendorMembershipRow[]; total: number }> {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    const nowIso = new Date().toISOString();

    let qb = supabase.from("vendor_memberships").select("*", { count: "exact" });

    if (params.status === "active") {
        qb = qb.eq("status", "active").gt("expires_at", nowIso);
    } else if (params.status === "expired") {
        qb = qb.or(`status.eq.expired,and(status.eq.active,expires_at.lte.${nowIso})`);
    } else if (params.status === "canceled") {
        qb = qb.eq("status", "canceled");
    } else if (params.status) {
        qb = qb.eq("status", params.status);
    }
    if (params.vendorId) {
        qb = qb.eq("vendor_id", params.vendorId);
    }

    qb = qb.order("created_at", { ascending: false });

    const { data, error, count } = await qb.range(from, to);

    if (error) {
        throw internalServerError("멤버십 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return {
        rows: (data ?? []) as VendorMembershipRow[],
        total: count ?? 0,
    };
}
