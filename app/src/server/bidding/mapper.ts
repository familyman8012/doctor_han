import type {
    BidContract,
    BidProjectDetail,
    BidProjectListItem,
    BidProjectScore,
    BidProjectStatusHistory,
    BidResponse,
} from "@/lib/schema/bidding";
import type { Tables } from "@/lib/database.types";

// ============================================
// Row Types
// ============================================

export type BidProjectRow = Tables<"bid_projects">;
export type BidProjectScoreRow = Tables<"bid_project_scores">;
export type BidResponseRow = Tables<"bid_responses">;
export type BidContractRow = Tables<"bid_contracts">;
export type BidStatusHistoryRow = Tables<"bid_project_status_history">;

// ============================================
// Mappers
// ============================================

export function mapBidProjectListItem(
    row: BidProjectRow,
    responseCount?: number,
): BidProjectListItem {
    return {
        id: row.id,
        doctorUserId: row.doctor_user_id,
        title: row.title,
        location: row.location,
        budgetMin: row.budget_min,
        budgetMax: row.budget_max,
        spaceSize: row.space_size,
        schedule: row.schedule,
        status: row.status,
        bidDeadline: row.bid_deadline,
        responseCount: responseCount ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapBidProjectDetail(
    row: BidProjectRow,
    scores: BidProjectScore[],
    responses: BidResponse[],
    contract: BidContract | null,
    statusHistory: BidProjectStatusHistory[],
): BidProjectDetail {
    return {
        id: row.id,
        doctorUserId: row.doctor_user_id,
        title: row.title,
        location: row.location,
        budgetMin: row.budget_min,
        budgetMax: row.budget_max,
        spaceSize: row.space_size,
        schedule: row.schedule,
        status: row.status,
        bidDeadline: row.bid_deadline,
        requirements: row.requirements,
        attachments: (row.attachments as unknown[]) ?? [],
        scores,
        responses,
        contract,
        statusHistory,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapBidProjectScore(row: BidProjectScoreRow, vendorName?: string): BidProjectScore {
    return {
        id: row.id,
        projectId: row.project_id,
        vendorId: row.vendor_id,
        regionScore: Number(row.region_score),
        ratingScore: Number(row.rating_score),
        responseScore: Number(row.response_score),
        portfolioScore: Number(row.portfolio_score),
        priceScore: Number(row.price_score),
        totalScore: Number(row.total_score),
        isRecommended: row.is_recommended,
        createdAt: row.created_at,
        vendorName,
    };
}

export function mapBidResponse(row: BidResponseRow, vendorName?: string): BidResponse {
    return {
        id: row.id,
        projectId: row.project_id,
        vendorId: row.vendor_id,
        status: row.status,
        price: row.price,
        proposal: row.proposal,
        estimatedDays: row.estimated_days,
        attachments: (row.attachments as unknown[]) ?? [],
        submittedAt: row.submitted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        vendorName,
    };
}

export function mapBidContract(row: BidContractRow, vendorName?: string): BidContract {
    return {
        id: row.id,
        projectId: row.project_id,
        vendorId: row.vendor_id,
        responseId: row.response_id,
        contractAmount: row.contract_amount,
        commissionAmount: row.commission_amount,
        commissionStatus: row.commission_status,
        commissionTransactionId: row.commission_transaction_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        vendorName,
    };
}

export function mapBidStatusHistory(row: BidStatusHistoryRow): BidProjectStatusHistory {
    return {
        id: row.id,
        projectId: row.project_id,
        fromStatus: row.from_status,
        toStatus: row.to_status,
        changedBy: row.changed_by,
        createdAt: row.created_at,
    };
}
