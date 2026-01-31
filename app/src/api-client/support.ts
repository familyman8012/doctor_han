import type {
	SupportTicketListQuery,
	SupportTicketListResponse,
	SupportTicketDetailResponse,
	SupportTicketCreateBody,
	SupportTicketCreateResponse,
	SupportMessageCreateBody,
	SupportMessageCreateResponse,
	SupportMessagesReadResponse,
} from "@/lib/schema/support";
import api from "./client";

export const supportApi = {
	// 내 티켓 목록 조회
	list: async (params?: Partial<SupportTicketListQuery>): Promise<SupportTicketListResponse> => {
		const response = await api.get<SupportTicketListResponse>("/api/support/tickets", { params });
		return response.data;
	},

	// 티켓 상세 조회
	getDetail: async (id: string): Promise<SupportTicketDetailResponse> => {
		const response = await api.get<SupportTicketDetailResponse>(`/api/support/tickets/${id}`);
		return response.data;
	},

	// 티켓 생성
	create: async (body: SupportTicketCreateBody): Promise<SupportTicketCreateResponse> => {
		const response = await api.post<SupportTicketCreateResponse>("/api/support/tickets", body);
		return response.data;
	},

	// 메시지 발송
	sendMessage: async (ticketId: string, body: SupportMessageCreateBody): Promise<SupportMessageCreateResponse> => {
		const response = await api.post<SupportMessageCreateResponse>(
			`/api/support/tickets/${ticketId}/messages`,
			body,
		);
		return response.data;
	},

	// 메시지 읽음 표시
	markMessagesAsRead: async (ticketId: string): Promise<SupportMessagesReadResponse> => {
		const response = await api.patch<SupportMessagesReadResponse>(
			`/api/support/tickets/${ticketId}/messages/read`,
		);
		return response.data;
	},

	// 티켓 재오픈
	reopen: async (ticketId: string): Promise<SupportTicketCreateResponse> => {
		const response = await api.post<SupportTicketCreateResponse>(`/api/support/tickets/${ticketId}/reopen`);
		return response.data;
	},
};
