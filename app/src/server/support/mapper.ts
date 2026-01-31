import "server-only";

import type {
	AdminSupportTicketListItem,
	AdminSupportTicketView,
	SlaStatus,
	SupportTicketListItem,
	SupportTicketMessageView,
	SupportTicketStatusHistoryView,
	SupportTicketView,
} from "@/lib/schema/support";
import type {
	SupportTicketMessageRow,
	SupportTicketRowWithRelations,
	SupportTicketStatusHistoryRowWithRelations,
} from "./repository";

// ===========================
// SLA Status Calculator
// ===========================

/**
 * Calculate SLA status based on ticket status and deadlines
 */
export function calculateSlaStatus(
	ticket: Pick<SupportTicketRowWithRelations, "status" | "sla_first_response_due" | "sla_resolution_due">,
): SlaStatus {
	const now = new Date();
	const warningThresholdMs = 4 * 60 * 60 * 1000; // 4 hours

	// resolved/closed tickets are always "normal"
	if (ticket.status === "resolved" || ticket.status === "closed") {
		return "normal";
	}

	const firstResponseDue = new Date(ticket.sla_first_response_due);
	const resolutionDue = new Date(ticket.sla_resolution_due);

	// Check for open tickets (first response SLA)
	if (ticket.status === "open") {
		if (now > firstResponseDue) {
			return "violated";
		}
		if (firstResponseDue.getTime() - now.getTime() <= warningThresholdMs) {
			return "warning";
		}
		return "normal";
	}

	// Check for in_progress tickets (resolution SLA)
	if (ticket.status === "in_progress") {
		if (now > resolutionDue) {
			return "violated";
		}
		if (resolutionDue.getTime() - now.getTime() <= warningThresholdMs) {
			return "warning";
		}
		return "normal";
	}

	return "normal";
}

// ===========================
// Ticket Mappers
// ===========================

/**
 * Map ticket row to user view
 */
export function mapTicketToView(row: SupportTicketRowWithRelations): SupportTicketView {
	return {
		id: row.id,
		userId: row.user_id,
		categoryId: row.category_id,
		category: row.category
			? {
				id: row.category.id,
				name: row.category.name,
				slug: row.category.slug,
			}
			: null,
		title: row.title,
		content: row.content,
		status: row.status,
		firstResponseAt: row.first_response_at,
		resolvedAt: row.resolved_at,
		slaFirstResponseDue: row.sla_first_response_due,
		slaResolutionDue: row.sla_resolution_due,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

/**
 * Map ticket row to user list item
 */
export function mapTicketToListItem(
	row: SupportTicketRowWithRelations,
	unreadCount: number,
	lastMessagePreview: string | null,
): SupportTicketListItem {
	return {
		id: row.id,
		categoryId: row.category_id,
		category: row.category
			? {
				id: row.category.id,
				name: row.category.name,
				slug: row.category.slug,
			}
			: null,
		title: row.title,
		status: row.status,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		unreadCount,
		lastMessagePreview,
	};
}

/**
 * Map ticket row to admin view
 */
export function mapTicketToAdminView(row: SupportTicketRowWithRelations): AdminSupportTicketView {
	return {
		id: row.id,
		userId: row.user_id,
		categoryId: row.category_id,
		category: row.category
			? {
				id: row.category.id,
				name: row.category.name,
				slug: row.category.slug,
			}
			: null,
		title: row.title,
		content: row.content,
		status: row.status,
		firstResponseAt: row.first_response_at,
		resolvedAt: row.resolved_at,
		slaFirstResponseDue: row.sla_first_response_due,
		slaResolutionDue: row.sla_resolution_due,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		user: row.user
			? {
				id: row.user.id,
				displayName: row.user.display_name ?? row.user.email ?? "Unknown",
				email: row.user.email,
				role: row.user.role,
			}
			: {
				id: row.user_id,
				displayName: "Unknown",
				email: null,
				role: "unknown",
			},
		slaStatus: calculateSlaStatus(row),
	};
}

/**
 * Map ticket row to admin list item
 */
export function mapTicketToAdminListItem(row: SupportTicketRowWithRelations): AdminSupportTicketListItem {
	return {
		id: row.id,
		categoryId: row.category_id,
		category: row.category
			? {
				id: row.category.id,
				name: row.category.name,
				slug: row.category.slug,
			}
			: null,
		title: row.title,
		status: row.status,
		user: row.user
			? {
				id: row.user.id,
				displayName: row.user.display_name ?? row.user.email ?? "Unknown",
				email: row.user.email,
				role: row.user.role,
			}
			: {
				id: row.user_id,
				displayName: "Unknown",
				email: null,
				role: "unknown",
			},
		slaStatus: calculateSlaStatus(row),
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

// ===========================
// Message Mappers
// ===========================

/**
 * Map message row to view
 */
export function mapMessageToView(row: SupportTicketMessageRow): SupportTicketMessageView {
	return {
		id: row.id,
		ticketId: row.ticket_id,
		senderId: row.sender_id,
		content: row.content,
		isAdmin: row.is_admin,
		readAt: row.read_at,
		createdAt: row.created_at,
	};
}

// ===========================
// Status History Mappers
// ===========================

/**
 * Map status history row to view
 */
export function mapStatusHistoryToView(
	row: SupportTicketStatusHistoryRowWithRelations,
): SupportTicketStatusHistoryView {
	return {
		id: row.id,
		ticketId: row.ticket_id,
		fromStatus: row.from_status,
		toStatus: row.to_status,
		changedBy: row.changed_by,
		changedByUser: row.changed_by_user
			? {
				id: row.changed_by_user.id,
				displayName: row.changed_by_user.display_name ?? "Unknown",
				email: null,
				role: "admin",
			}
			: null,
		note: row.note,
		createdAt: row.created_at,
	};
}
