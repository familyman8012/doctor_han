import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
    BidProjectRow,
    BidProjectScoreRow,
    BidResponseRow,
    BidContractRow,
    BidStatusHistoryRow,
} from "./mapper";

// ============================================
// bid_projects
// ============================================

export async function insertBidProject(
    supabase: SupabaseClient<Database>,
    payload: Database["public"]["Tables"]["bid_projects"]["Insert"],
): Promise<BidProjectRow> {
    const { data, error } = await supabase
        .from("bid_projects")
        .insert(payload)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("비딩 프로젝트를 생성할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as BidProjectRow;
}

export async function getBidProject(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<BidProjectRow | null> {
    const { data, error } = await supabase
        .from("bid_projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw internalServerError("비딩 프로젝트를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as BidProjectRow) ?? null;
}

export async function updateBidProject(
    supabase: SupabaseClient<Database>,
    id: string,
    payload: Database["public"]["Tables"]["bid_projects"]["Update"],
): Promise<BidProjectRow> {
    const { data, error } = await supabase
        .from("bid_projects")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("비딩 프로젝트를 업데이트할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as BidProjectRow;
}

export async function listBidProjects(
    supabase: SupabaseClient<Database>,
    params: { page: number; pageSize: number; status?: string; doctorUserId?: string },
): Promise<{ rows: BidProjectRow[]; total: number }> {
    let countQuery = supabase
        .from("bid_projects")
        .select("*", { count: "exact", head: true });

    if (params.status) {
        countQuery = countQuery.eq("status", params.status as Database["public"]["Enums"]["bid_project_status"]);
    }
    if (params.doctorUserId) {
        countQuery = countQuery.eq("doctor_user_id", params.doctorUserId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
        throw internalServerError("프로젝트 개수를 조회할 수 없습니다.", {
            message: countError.message,
            code: countError.code,
        });
    }

    const total = count ?? 0;
    const offset = (params.page - 1) * params.pageSize;

    let dataQuery = supabase
        .from("bid_projects")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + params.pageSize - 1);

    if (params.status) {
        dataQuery = dataQuery.eq("status", params.status as Database["public"]["Enums"]["bid_project_status"]);
    }
    if (params.doctorUserId) {
        dataQuery = dataQuery.eq("doctor_user_id", params.doctorUserId);
    }

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
        throw internalServerError("프로젝트 목록을 조회할 수 없습니다.", {
            message: dataError.message,
            code: dataError.code,
        });
    }

    return { rows: (data ?? []) as BidProjectRow[], total };
}

export async function listBidProjectsByVendor(
    supabase: SupabaseClient<Database>,
    params: { page: number; pageSize: number; status?: string; vendorId: string },
): Promise<{ rows: BidProjectRow[]; total: number }> {
    let countQuery = supabase
        .from("bid_projects")
        .select("id, bid_responses!inner(vendor_id)", { count: "exact", head: true })
        .eq("bid_responses.vendor_id", params.vendorId);

    if (params.status) {
        countQuery = countQuery.eq("status", params.status as Database["public"]["Enums"]["bid_project_status"]);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
        throw internalServerError("업체 프로젝트 개수를 조회할 수 없습니다.", {
            message: countError.message,
            code: countError.code,
        });
    }

    const total = count ?? 0;
    const offset = (params.page - 1) * params.pageSize;

    let dataQuery = supabase
        .from("bid_projects")
        .select("*, bid_responses!inner(vendor_id)")
        .eq("bid_responses.vendor_id", params.vendorId)
        .order("created_at", { ascending: false })
        .range(offset, offset + params.pageSize - 1);

    if (params.status) {
        dataQuery = dataQuery.eq("status", params.status as Database["public"]["Enums"]["bid_project_status"]);
    }

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
        throw internalServerError("업체 프로젝트 목록을 조회할 수 없습니다.", {
            message: dataError.message,
            code: dataError.code,
        });
    }

    const rows = (data ?? []).map((row) => {
        const project = { ...(row as Record<string, unknown>) };
        delete project.bid_responses;
        return project as BidProjectRow;
    });

    return { rows, total };
}

// ============================================
// bid_project_scores
// ============================================

export async function insertBidProjectScores(
    supabase: SupabaseClient<Database>,
    rows: Database["public"]["Tables"]["bid_project_scores"]["Insert"][],
): Promise<BidProjectScoreRow[]> {
    if (rows.length === 0) return [];

    const { data, error } = await supabase
        .from("bid_project_scores")
        .insert(rows)
        .select("*");

    if (error) {
        throw internalServerError("스코어링 결과를 저장할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as BidProjectScoreRow[];
}

export async function listBidProjectScores(
    supabase: SupabaseClient<Database>,
    projectId: string,
): Promise<BidProjectScoreRow[]> {
    const { data, error } = await supabase
        .from("bid_project_scores")
        .select("*")
        .eq("project_id", projectId)
        .order("total_score", { ascending: false });

    if (error) {
        throw internalServerError("스코어링 결과를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as BidProjectScoreRow[];
}

// ============================================
// bid_responses
// ============================================

export async function insertBidResponses(
    supabase: SupabaseClient<Database>,
    rows: Database["public"]["Tables"]["bid_responses"]["Insert"][],
): Promise<BidResponseRow[]> {
    if (rows.length === 0) return [];

    const { data, error } = await supabase
        .from("bid_responses")
        .insert(rows)
        .select("*");

    if (error) {
        throw internalServerError("입찰 초대를 생성할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as BidResponseRow[];
}

export async function getBidResponse(
    supabase: SupabaseClient<Database>,
    projectId: string,
    vendorId: string,
): Promise<BidResponseRow | null> {
    const { data, error } = await supabase
        .from("bid_responses")
        .select("*")
        .eq("project_id", projectId)
        .eq("vendor_id", vendorId)
        .maybeSingle();

    if (error) {
        throw internalServerError("입찰 응답을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as BidResponseRow) ?? null;
}

export async function updateBidResponse(
    supabase: SupabaseClient<Database>,
    id: string,
    payload: Database["public"]["Tables"]["bid_responses"]["Update"],
): Promise<BidResponseRow> {
    const { data, error } = await supabase
        .from("bid_responses")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("입찰 응답을 업데이트할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as BidResponseRow;
}

export async function listBidResponses(
    supabase: SupabaseClient<Database>,
    projectId: string,
): Promise<BidResponseRow[]> {
    const { data, error } = await supabase
        .from("bid_responses")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("입찰 응답 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as BidResponseRow[];
}

export async function listBidResponsesByVendor(
    supabase: SupabaseClient<Database>,
    vendorId: string,
    params: { page: number; pageSize: number; status?: string },
): Promise<{ rows: BidResponseRow[]; total: number }> {
    let countQuery = supabase
        .from("bid_responses")
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", vendorId);

    if (params.status) {
        countQuery = countQuery.eq("status", params.status as Database["public"]["Enums"]["bid_response_status"]);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
        throw internalServerError("입찰 응답 개수를 조회할 수 없습니다.", {
            message: countError.message,
            code: countError.code,
        });
    }

    const total = count ?? 0;
    const offset = (params.page - 1) * params.pageSize;

    let dataQuery = supabase
        .from("bid_responses")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .range(offset, offset + params.pageSize - 1);

    if (params.status) {
        dataQuery = dataQuery.eq("status", params.status as Database["public"]["Enums"]["bid_response_status"]);
    }

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
        throw internalServerError("입찰 응답 목록을 조회할 수 없습니다.", {
            message: dataError.message,
            code: dataError.code,
        });
    }

    return { rows: (data ?? []) as BidResponseRow[], total };
}

// ============================================
// bid_contracts
// ============================================

export async function insertBidContract(
    supabase: SupabaseClient<Database>,
    payload: Database["public"]["Tables"]["bid_contracts"]["Insert"],
): Promise<BidContractRow> {
    const { data, error } = await supabase
        .from("bid_contracts")
        .insert(payload)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("계약을 생성할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as BidContractRow;
}

export async function getBidContract(
    supabase: SupabaseClient<Database>,
    projectId: string,
): Promise<BidContractRow | null> {
    const { data, error } = await supabase
        .from("bid_contracts")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

    if (error) {
        throw internalServerError("계약을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as BidContractRow) ?? null;
}

export async function updateBidContract(
    supabase: SupabaseClient<Database>,
    id: string,
    payload: Database["public"]["Tables"]["bid_contracts"]["Update"],
): Promise<BidContractRow> {
    const { data, error } = await supabase
        .from("bid_contracts")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("계약을 업데이트할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as BidContractRow;
}

// ============================================
// bid_project_status_history
// ============================================

export async function insertBidStatusHistory(
    supabase: SupabaseClient<Database>,
    payload: Database["public"]["Tables"]["bid_project_status_history"]["Insert"],
): Promise<BidStatusHistoryRow> {
    const { data, error } = await supabase
        .from("bid_project_status_history")
        .insert(payload)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("상태 변경 이력을 저장할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as BidStatusHistoryRow;
}

export async function listBidStatusHistory(
    supabase: SupabaseClient<Database>,
    projectId: string,
): Promise<BidStatusHistoryRow[]> {
    const { data, error } = await supabase
        .from("bid_project_status_history")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("상태 변경 이력을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as BidStatusHistoryRow[];
}
