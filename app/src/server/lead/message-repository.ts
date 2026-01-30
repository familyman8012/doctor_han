import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadMessageAttachmentRow, LeadMessageRow } from "./message-mapper";

const MESSAGE_RATE_LIMIT_PER_MINUTE = 10;

/**
 * 메시지 목록 조회 (페이지네이션, 오래된 순 정렬)
 */
export async function fetchMessages(
    supabase: SupabaseClient<Database>,
    leadId: string,
    page: number,
    pageSize: number,
): Promise<{ rows: LeadMessageRow[]; attachmentsByMessageId: Map<string, LeadMessageAttachmentRow[]>; total: number }> {
    // 전체 개수 조회
    const { count, error: countError } = await supabase
        .from("lead_messages")
        .select("*", { count: "exact", head: true })
        .eq("lead_id", leadId);

    if (countError) {
        throw internalServerError("메시지 개수를 조회할 수 없습니다.", {
            message: countError.message,
            code: countError.code,
        });
    }

    const total = count ?? 0;

    // 메시지 목록 조회 (오래된 순)
    const offset = (page - 1) * pageSize;
    const { data: messages, error: messagesError } = await supabase
        .from("lead_messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true })
        .range(offset, offset + pageSize - 1);

    if (messagesError) {
        throw internalServerError("메시지를 조회할 수 없습니다.", {
            message: messagesError.message,
            code: messagesError.code,
        });
    }

    const rows = messages ?? [];

    // 첨부파일 조회 (메시지가 있는 경우에만)
    const attachmentsByMessageId = new Map<string, LeadMessageAttachmentRow[]>();

    if (rows.length > 0) {
        const messageIds = rows.map((m) => m.id);
        const { data: attachments, error: attachmentsError } = await supabase
            .from("lead_message_attachments")
            .select("*")
            .in("message_id", messageIds);

        if (attachmentsError) {
            throw internalServerError("메시지 첨부파일을 조회할 수 없습니다.", {
                message: attachmentsError.message,
                code: attachmentsError.code,
            });
        }

        for (const attachment of attachments ?? []) {
            const existing = attachmentsByMessageId.get(attachment.message_id) ?? [];
            existing.push(attachment);
            attachmentsByMessageId.set(attachment.message_id, existing);
        }
    }

    return { rows, attachmentsByMessageId, total };
}

/**
 * 메시지 생성
 */
export async function insertMessage(
    supabase: SupabaseClient<Database>,
    payload: { leadId: string; senderId: string; content: string },
): Promise<LeadMessageRow> {
    const { data, error } = await supabase
        .from("lead_messages")
        .insert({
            lead_id: payload.leadId,
            sender_id: payload.senderId,
            content: payload.content,
        })
        .select("*")
        .single();

    if (error) {
        throw internalServerError("메시지를 저장할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data;
}

/**
 * 메시지 첨부파일 일괄 생성
 */
export async function insertMessageAttachments(
    supabase: SupabaseClient<Database>,
    messageId: string,
    fileIds: string[],
): Promise<LeadMessageAttachmentRow[]> {
    if (fileIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from("lead_message_attachments")
        .insert(
            fileIds.map((fileId) => ({
                message_id: messageId,
                file_id: fileId,
            })),
        )
        .select("*");

    if (error) {
        throw internalServerError("메시지 첨부파일을 저장할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data ?? [];
}

/**
 * 메시지 읽음 표시 (bulk)
 * RLS가 sender_id != auth.uid() 조건을 검증함
 * leadId 조건으로 다른 리드의 메시지가 처리되지 않도록 방지
 */
export async function markMessagesAsRead(
    supabase: SupabaseClient<Database>,
    leadId: string,
    messageIds: string[],
): Promise<void> {
    if (messageIds.length === 0) {
        return;
    }

    const { error } = await supabase
        .from("lead_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("lead_id", leadId)
        .in("id", messageIds)
        .is("read_at", null);

    if (error) {
        throw internalServerError("메시지 읽음 상태를 업데이트할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }
}

/**
 * 안 읽은 메시지 개수 조회
 */
export async function getUnreadCount(
    supabase: SupabaseClient<Database>,
    leadId: string,
    userId: string,
): Promise<number> {
    const { count, error } = await supabase
        .from("lead_messages")
        .select("*", { count: "exact", head: true })
        .eq("lead_id", leadId)
        .neq("sender_id", userId) // 내가 보낸 메시지 제외
        .is("read_at", null);

    if (error) {
        throw internalServerError("안 읽은 메시지 개수를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return count ?? 0;
}

/**
 * Rate limit 확인 (분당 메시지 발송 제한)
 * @returns true이면 제한 초과
 */
export async function checkMessageRateLimit(
    supabase: SupabaseClient<Database>,
    userId: string,
    leadId: string,
): Promise<boolean> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const { count, error } = await supabase
        .from("lead_messages")
        .select("*", { count: "exact", head: true })
        .eq("lead_id", leadId)
        .eq("sender_id", userId)
        .gte("created_at", oneMinuteAgo);

    if (error) {
        // Rate limit 확인 실패 시 요청 허용 (fail-open)
        console.error("[Rate Limit] Failed to check rate limit", error);
        return false;
    }

    return (count ?? 0) >= MESSAGE_RATE_LIMIT_PER_MINUTE;
}

/**
 * 리드 존재 여부 및 참여자 정보 조회
 */
export async function fetchLeadParticipants(
    supabase: SupabaseClient<Database>,
    leadId: string,
): Promise<{ doctorUserId: string; vendorId: string } | null> {
    const { data, error } = await supabase
        .from("leads")
        .select("doctor_user_id, vendor_id")
        .eq("id", leadId)
        .maybeSingle();

    if (error) {
        throw internalServerError("리드 정보를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (!data) {
        return null;
    }

    return {
        doctorUserId: data.doctor_user_id,
        vendorId: data.vendor_id,
    };
}

/**
 * 업체 소유자 여부 확인
 */
export async function isVendorOwner(
    supabase: SupabaseClient<Database>,
    vendorId: string,
    userId: string,
): Promise<boolean> {
    const { data, error } = await supabase
        .from("vendors")
        .select("owner_user_id")
        .eq("id", vendorId)
        .maybeSingle();

    if (error || !data) {
        return false;
    }

    return data.owner_user_id === userId;
}

/**
 * 사용자 프로필 조회 (알림 발송용)
 */
export async function fetchUserProfile(
    supabase: SupabaseClient<Database>,
    userId: string,
): Promise<{ email: string | null; phone: string | null; name: string | null } | null> {
    const { data, error } = await supabase
        .from("profiles")
        .select("email, phone, display_name")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error("[Message] Failed to fetch user profile", error);
        return null;
    }

    if (!data) {
        return null;
    }

    return {
        email: data.email,
        phone: data.phone,
        name: data.display_name,
    };
}
