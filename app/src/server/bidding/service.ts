import "server-only";

import { ApiError } from "@/server/api/errors";
import type { Database } from "@/lib/database.types";
import type {
    BidProjectCreateBody,
    BidProjectDetail,
    BidProjectListItem,
    BidProjectStatus,
    BidResponse,
    BidResponseSubmitBody,
} from "@/lib/schema/bidding";
import { badRequest, conflict, notFound } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateCommission } from "./commission-service";
import {
    mapBidContract,
    mapBidProjectDetail,
    mapBidProjectListItem,
    mapBidProjectScore,
    mapBidResponse,
    mapBidStatusHistory,
} from "./mapper";
import {
    getBidContract,
    getBidProject,
    getBidResponse,
    insertBidContract,
    insertBidStatusHistory,
    listBidProjects,
    listBidProjectsByVendor,
    listBidResponses,
    listBidProjectScores,
    listBidStatusHistory,
    updateBidProject,
    updateBidResponse,
    insertBidProject,
} from "./repository";
import { scoreAndMatchVendors } from "./scoring-service";

// ============================================
// 1. 프로젝트 생성 (doctor)
// ============================================

export async function createBidProject(
    _supabase: SupabaseClient<Database>,
    doctorUserId: string,
    body: BidProjectCreateBody,
): Promise<BidProjectDetail> {
    const admin = createSupabaseAdminClient();

    // 활성 프로젝트 중복 체크 (한 번에 한 건만 등록 가능)
    const { count } = await admin
        .from("bid_projects")
        .select("*", { count: "exact", head: true })
        .eq("doctor_user_id", doctorUserId)
        .not("status", "in", '("completed","settled","canceled")');
    if (count && count > 0) {
        throw new ApiError({ status: 409, code: "4090", message: "이미 진행 중인 인테리어 프로젝트가 있습니다. 기존 프로젝트가 종료된 후 새로 등록할 수 있습니다." });
    }

    // 프로젝트 생성
    const projectRow = await insertBidProject(admin, {
        doctor_user_id: doctorUserId,
        title: body.title,
        location: body.location,
        budget_min: body.budgetMin,
        budget_max: body.budgetMax,
        space_size: body.spaceSize ?? null,
        schedule: body.schedule ?? null,
        requirements: body.requirements ?? null,
        attachments: (body.attachments ?? []) as Database["public"]["Tables"]["bid_projects"]["Insert"]["attachments"],
        status: "open",
    });

    // 상태 이력
    await insertBidStatusHistory(admin, {
        project_id: projectRow.id,
        from_status: null,
        to_status: "open",
        changed_by: doctorUserId,
    });

    // 스코어링 + 매칭 (비동기로 실행하되 결과 대기)
    const scoreRows = await scoreAndMatchVendors(admin as unknown as SupabaseClient<Database>, projectRow);

    // 매칭 결과가 있으면 bidding 상태로 전환
    if (scoreRows.length > 0) {
        const bidDeadline = new Date();
        bidDeadline.setDate(bidDeadline.getDate() + 7);

        await updateBidProject(admin, projectRow.id, {
            status: "bidding",
            bid_deadline: bidDeadline.toISOString(),
        });

        await insertBidStatusHistory(admin, {
            project_id: projectRow.id,
            from_status: "open",
            to_status: "bidding",
            changed_by: null,
        });

        projectRow.status = "bidding";
        projectRow.bid_deadline = bidDeadline.toISOString();
    }

    return getProjectDetail(admin, projectRow.id);
}

// ============================================
// 2. 프로젝트 목록 (역할별)
// ============================================

export async function listDoctorProjects(
    supabase: SupabaseClient<Database>,
    doctorUserId: string,
    params: { page: number; pageSize: number; status?: string },
): Promise<{ items: BidProjectListItem[]; page: number; pageSize: number; total: number }> {
    const { rows, total } = await listBidProjects(supabase, { ...params, doctorUserId });
    const items = rows.map((r) => mapBidProjectListItem(r));
    return { items, page: params.page, pageSize: params.pageSize, total };
}

export async function listVendorProjects(
    supabase: SupabaseClient<Database>,
    vendorId: string,
    params: { page: number; pageSize: number; status?: string },
): Promise<{ items: BidProjectListItem[]; page: number; pageSize: number; total: number }> {
    const { rows, total } = await listBidProjectsByVendor(supabase, { ...params, vendorId });
    const items = rows.map((r) => mapBidProjectListItem(r));
    return { items, page: params.page, pageSize: params.pageSize, total };
}

export async function listAllProjects(
    _supabase: SupabaseClient<Database>,
    params: { page: number; pageSize: number; status?: string },
): Promise<{ items: BidProjectListItem[]; page: number; pageSize: number; total: number }> {
    const admin = createSupabaseAdminClient();
    const { rows, total } = await listBidProjects(admin, params);

    const items = rows.map((r) => mapBidProjectListItem(r));
    return { items, page: params.page, pageSize: params.pageSize, total };
}

// ============================================
// 3. 프로젝트 상세
// ============================================

export async function getProjectDetail(
    supabase: SupabaseClient<Database>,
    projectId: string,
): Promise<BidProjectDetail> {
    const projectRow = await getBidProject(supabase, projectId);
    if (!projectRow) {
        throw notFound("프로젝트를 찾을 수 없습니다.");
    }

    // vendor 이름 조회를 위한 맵
    const [scoreRows, responseRows, contractRow, historyRows] = await Promise.all([
        listBidProjectScores(supabase, projectId),
        listBidResponses(supabase, projectId),
        getBidContract(supabase, projectId),
        listBidStatusHistory(supabase, projectId),
    ]);

    // vendor 이름 일괄 조회
    const vendorIds = [
        ...new Set([
            ...scoreRows.map((s) => s.vendor_id),
            ...responseRows.map((r) => r.vendor_id),
            ...(contractRow ? [contractRow.vendor_id] : []),
        ]),
    ];

    const vendorNameMap = await getVendorNameMap(supabase, vendorIds);

    const scores = scoreRows.map((s) => mapBidProjectScore(s, vendorNameMap.get(s.vendor_id)));
    const responses = responseRows.map((r) => mapBidResponse(r, vendorNameMap.get(r.vendor_id)));
    const contract = contractRow
        ? mapBidContract(contractRow, vendorNameMap.get(contractRow.vendor_id))
        : null;
    const statusHistory = historyRows.map(mapBidStatusHistory);

    return mapBidProjectDetail(projectRow, scores, responses, contract, statusHistory);
}

// ============================================
// 4. 업체 선정 (doctor)
// ============================================

export async function selectVendor(
    _supabase: SupabaseClient<Database>,
    projectId: string,
    vendorId: string,
    doctorUserId: string,
): Promise<BidProjectDetail> {
    const admin = createSupabaseAdminClient();

    const project = await getBidProject(admin, projectId);
    if (!project) throw notFound("프로젝트를 찾을 수 없습니다.");
    if (project.doctor_user_id !== doctorUserId) throw notFound("프로젝트를 찾을 수 없습니다.");

    if (project.status !== "bidding" && project.status !== "selecting") {
        throw badRequest(`현재 상태에서 업체를 선정할 수 없습니다. 상태: ${project.status}`);
    }

    // 해당 업체의 입찰 확인
    const response = await getBidResponse(admin, projectId, vendorId);
    if (!response) throw notFound("해당 업체의 입찰을 찾을 수 없습니다.");
    if (response.status !== "submitted") {
        throw badRequest("입찰이 제출된 업체만 선정할 수 있습니다.");
    }

    // 계약 금액 = 업체 입찰가
    const contractAmount = response.price ?? 0;
    const commissionAmount = calculateCommission(contractAmount);

    // 계약 생성
    await insertBidContract(admin, {
        project_id: projectId,
        vendor_id: vendorId,
        response_id: response.id,
        contract_amount: contractAmount,
        commission_amount: commissionAmount,
        commission_status: "pending",
    });

    // 선정된 업체 응답 상태 변경
    await updateBidResponse(admin, response.id, { status: "selected" });

    // 나머지 업체 응답 rejected
    const allResponses = await listBidResponses(admin, projectId);
    for (const r of allResponses) {
        if (r.vendor_id !== vendorId && (r.status === "submitted" || r.status === "invited")) {
            await updateBidResponse(admin, r.id, { status: "rejected" });
        }
    }

    // 프로젝트 상태 → contracted
    await updateBidProject(admin, projectId, { status: "contracted" });
    await insertBidStatusHistory(admin, {
        project_id: projectId,
        from_status: project.status,
        to_status: "contracted",
        changed_by: doctorUserId,
    });

    return getProjectDetail(admin, projectId);
}

// ============================================
// 5. 프로젝트 취소 (doctor)
// ============================================

export async function cancelProject(
    _supabase: SupabaseClient<Database>,
    projectId: string,
    doctorUserId: string,
): Promise<BidProjectDetail> {
    const admin = createSupabaseAdminClient();

    const project = await getBidProject(admin, projectId);
    if (!project) throw notFound("프로젝트를 찾을 수 없습니다.");
    if (project.doctor_user_id !== doctorUserId) throw notFound("프로젝트를 찾을 수 없습니다.");

    const cancelable: BidProjectStatus[] = ["draft", "open", "bidding", "selecting"];
    if (!cancelable.includes(project.status as BidProjectStatus)) {
        throw badRequest(`현재 상태에서 취소할 수 없습니다. 상태: ${project.status}`);
    }

    await updateBidProject(admin, projectId, { status: "canceled" });
    await insertBidStatusHistory(admin, {
        project_id: projectId,
        from_status: project.status,
        to_status: "canceled",
        changed_by: doctorUserId,
    });

    // 모든 invited/submitted 응답 expired 처리
    const responses = await listBidResponses(admin, projectId);
    for (const r of responses) {
        if (r.status === "invited" || r.status === "submitted") {
            await updateBidResponse(admin, r.id, { status: "expired" });
        }
    }

    return getProjectDetail(admin, projectId);
}

// ============================================
// 6. 입찰 제출 (vendor)
// ============================================

export async function submitBidResponse(
    _supabase: SupabaseClient<Database>,
    projectId: string,
    vendorId: string,
    body: BidResponseSubmitBody,
): Promise<BidResponse> {
    const admin = createSupabaseAdminClient();

    const project = await getBidProject(admin, projectId);
    if (!project) throw notFound("프로젝트를 찾을 수 없습니다.");
    if (project.status !== "bidding") {
        throw badRequest("입찰 기간이 아닙니다.");
    }
    if (!project.bid_deadline) {
        throw badRequest("입찰 마감 정보가 없습니다.");
    }
    if (new Date(project.bid_deadline).getTime() < Date.now()) {
        throw badRequest("입찰 마감일이 지났습니다.");
    }

    const response = await getBidResponse(admin, projectId, vendorId);
    if (!response) throw notFound("입찰 초대를 찾을 수 없습니다.");
    if (response.status !== "invited") {
        throw conflict("이미 입찰이 처리되었습니다.");
    }

    const updatedRow = await updateBidResponse(admin, response.id, {
        status: "submitted",
        price: body.price,
        proposal: body.proposal,
        estimated_days: body.estimatedDays ?? null,
        attachments: (body.attachments ?? []) as Database["public"]["Tables"]["bid_responses"]["Update"]["attachments"],
        submitted_at: new Date().toISOString(),
    });

    // vendor 이름 조회
    const nameMap = await getVendorNameMap(admin, [vendorId]);
    return mapBidResponse(updatedRow, nameMap.get(vendorId));
}

// ============================================
// 7. 입찰 철회 (vendor)
// ============================================

export async function withdrawBidResponse(
    _supabase: SupabaseClient<Database>,
    projectId: string,
    vendorId: string,
): Promise<BidResponse> {
    const admin = createSupabaseAdminClient();

    const response = await getBidResponse(admin, projectId, vendorId);
    if (!response) throw notFound("입찰을 찾을 수 없습니다.");

    if (response.status !== "invited" && response.status !== "submitted") {
        throw badRequest("철회할 수 없는 상태입니다.");
    }

    const updatedRow = await updateBidResponse(admin, response.id, {
        status: "withdrawn",
    });

    const nameMap = await getVendorNameMap(admin, [vendorId]);
    return mapBidResponse(updatedRow, nameMap.get(vendorId));
}

// ============================================
// 8. Admin: 상태 변경
// ============================================

export async function adminUpdateProjectStatus(
    _supabase: SupabaseClient<Database>,
    projectId: string,
    newStatus: BidProjectStatus,
    adminUserId: string,
): Promise<BidProjectDetail> {
    const admin = createSupabaseAdminClient();

    const project = await getBidProject(admin, projectId);
    if (!project) throw notFound("프로젝트를 찾을 수 없습니다.");

    await updateBidProject(admin, projectId, { status: newStatus });
    await insertBidStatusHistory(admin, {
        project_id: projectId,
        from_status: project.status,
        to_status: newStatus,
        changed_by: adminUserId,
    });

    return getProjectDetail(admin, projectId);
}

// ============================================
// Helpers
// ============================================

async function getVendorNameMap(
    supabase: SupabaseClient<Database>,
    vendorIds: string[],
): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (vendorIds.length === 0) return map;

    const { data } = await supabase
        .from("vendors")
        .select("id, name")
        .in("id", vendorIds);

    for (const v of data ?? []) {
        map.set(v.id, v.name);
    }

    return map;
}
