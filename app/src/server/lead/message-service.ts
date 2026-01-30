import "server-only";

import type { Database, Json } from "@/lib/database.types";
import type { LeadMessage, LeadMessageCreateBody, LeadMessagesListQuery } from "@/lib/schema/lead";
import { forbidden, notFound, tooManyRequests } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapMessageRow } from "./message-mapper";
import {
    checkMessageRateLimit,
    fetchLeadParticipants,
    fetchMessages,
    fetchUserProfile,
    getUnreadCount,
    insertMessage,
    insertMessageAttachments,
    isVendorOwner,
    markMessagesAsRead,
} from "./message-repository";
import { fetchNotificationSettings, insertNotificationDelivery } from "@/server/notification/repository";
import { resend, RESEND_FROM_EMAIL } from "@/server/notification/resend";
import { sendKakaoAlimtalk } from "@/server/notification/service";
import { getLeadMessageReceivedKakaoTemplate } from "@/server/notification/kakao-templates";

interface GetMessagesResult {
    items: LeadMessage[];
    page: number;
    pageSize: number;
    total: number;
    unreadCount: number;
}

/**
 * 메시지 목록 조회
 * @throws notFound - 리드가 존재하지 않을 때
 * @throws forbidden - 리드 참여자가 아닐 때
 */
export async function getMessages(
    supabase: SupabaseClient<Database>,
    leadId: string,
    query: LeadMessagesListQuery,
    userId: string,
    userRole: string,
): Promise<GetMessagesResult> {
    // 리드 존재 및 참여자 검증
    const lead = await fetchLeadParticipants(supabase, leadId);
    if (!lead) {
        throw notFound("리드를 찾을 수 없습니다.");
    }

    // 참여자 검증 (관리자는 RLS에서 허용)
    const isAdmin = userRole === "admin";
    const isDoctor = lead.doctorUserId === userId;
    const isVendor = await isVendorOwner(supabase, lead.vendorId, userId);

    if (!isAdmin && !isDoctor && !isVendor) {
        throw forbidden("리드 참여자만 메시지를 조회할 수 있습니다.");
    }

    const { page, pageSize } = query;
    const [{ rows, attachmentsByMessageId, total }, unreadCount] = await Promise.all([
        fetchMessages(supabase, leadId, page, pageSize),
        getUnreadCount(supabase, leadId, userId),
    ]);

    const items = rows.map((row) => {
        const attachments = attachmentsByMessageId.get(row.id) ?? [];
        return mapMessageRow(row, attachments);
    });

    return { items, page, pageSize, total, unreadCount };
}

/**
 * 메시지 발송
 * @throws notFound - 리드가 존재하지 않을 때
 * @throws forbidden - 관리자이거나 리드 참여자가 아닐 때
 * @throws tooManyRequests - Rate limit 초과 시
 */
export async function sendMessage(
    supabase: SupabaseClient<Database>,
    leadId: string,
    body: LeadMessageCreateBody,
    userId: string,
    userRole: string,
): Promise<LeadMessage> {
    // 관리자는 메시지 작성 불가
    if (userRole === "admin") {
        throw forbidden("관리자는 메시지를 작성할 수 없습니다.");
    }

    // 리드 존재 및 참여자 검증
    const lead = await fetchLeadParticipants(supabase, leadId);
    if (!lead) {
        throw notFound("리드를 찾을 수 없습니다.");
    }

    // 참여자 검증
    const isDoctor = lead.doctorUserId === userId;
    const isVendor = await isVendorOwner(supabase, lead.vendorId, userId);

    if (!isDoctor && !isVendor) {
        throw forbidden("리드 참여자만 메시지를 발송할 수 있습니다.");
    }

    // Rate limit 확인
    const isRateLimited = await checkMessageRateLimit(supabase, userId, leadId);
    if (isRateLimited) {
        throw tooManyRequests("메시지 발송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.", {
            retryAfter: 60,
        });
    }

    // 메시지 저장
    const messageRow = await insertMessage(supabase, {
        leadId,
        senderId: userId,
        content: body.content,
    });

    // 첨부파일 저장
    const attachments = body.attachmentFileIds?.length
        ? await insertMessageAttachments(supabase, messageRow.id, body.attachmentFileIds)
        : [];

    // 알림 발송 (비동기, 실패해도 메시지는 저장됨)
    const recipientUserId = isDoctor ? await getVendorOwnerUserId(lead.vendorId) : lead.doctorUserId;
    if (recipientUserId) {
        sendMessageNotification({
            recipientUserId,
            senderUserId: userId,
            messagePreview: body.content.slice(0, 100),
        }).catch((err) => {
            console.error("[Message] Failed to send notification", err);
        });
    }

    return mapMessageRow(messageRow, attachments);
}

/**
 * 메시지 읽음 표시
 * @throws notFound - 리드가 존재하지 않을 때
 * @throws forbidden - 리드 참여자가 아닐 때
 */
export async function markAsRead(
    supabase: SupabaseClient<Database>,
    leadId: string,
    messageIds: string[],
    userId: string,
    userRole: string,
): Promise<void> {
    // 리드 존재 및 참여자 검증
    const lead = await fetchLeadParticipants(supabase, leadId);
    if (!lead) {
        throw notFound("리드를 찾을 수 없습니다.");
    }

    // 관리자는 읽음 표시 가능 (열람만)
    const isAdmin = userRole === "admin";
    const isDoctor = lead.doctorUserId === userId;
    const isVendor = await isVendorOwner(supabase, lead.vendorId, userId);

    if (!isAdmin && !isDoctor && !isVendor) {
        throw forbidden("리드 참여자만 읽음 표시를 할 수 있습니다.");
    }

    // RLS에서 sender_id != auth.uid() 조건으로 자신이 보낸 메시지는 업데이트 불가
    // leadId 조건으로 다른 리드의 메시지가 처리되지 않도록 방지
    await markMessagesAsRead(supabase, leadId, messageIds);
}

// ============================================
// Private helpers
// ============================================

async function getVendorOwnerUserId(vendorId: string): Promise<string | null> {
    // admin client를 사용하여 RLS 제한 없이 조회
    const adminSupabase = createSupabaseAdminClient();
    const { data, error } = await adminSupabase
        .from("vendors")
        .select("owner_user_id")
        .eq("id", vendorId)
        .maybeSingle();

    if (error || !data) {
        return null;
    }

    return data.owner_user_id;
}

// ============================================
// 알림 발송
// ============================================

interface SendMessageNotificationParams {
    recipientUserId: string;
    senderUserId: string;
    messagePreview: string;
}

/**
 * 메시지 수신 알림 발송 (Email + 카카오 병렬)
 */
async function sendMessageNotification(params: SendMessageNotificationParams): Promise<void> {
    const { recipientUserId, senderUserId, messagePreview } = params;

    const adminSupabase = createSupabaseAdminClient();

    // 1. 알림 설정 조회
    const settings = await fetchNotificationSettings(adminSupabase, recipientUserId);

    const emailEnabled = settings?.email_enabled ?? true;
    const kakaoEnabled = settings?.kakao_enabled ?? false;
    const leadEnabled = settings?.lead_enabled ?? true;

    // 리드 알림 자체가 비활성화된 경우
    if (!leadEnabled) {
        console.log(`[Notification] Lead notification disabled for user ${recipientUserId}`);
        return;
    }

    // 2. 수신자/발신자 정보 조회
    const [recipientProfile, senderProfile] = await Promise.all([
        fetchUserProfile(adminSupabase, recipientUserId),
        fetchUserProfile(adminSupabase, senderUserId),
    ]);

    if (!recipientProfile) {
        console.error(`[Notification] Recipient profile not found: ${recipientUserId}`);
        return;
    }

    const senderName = senderProfile?.name ?? "상대방";

    // 3. 활성화된 채널에 대해 병렬 발송
    const sendTasks: Promise<void>[] = [];

    // 이메일 발송
    if (emailEnabled && recipientProfile.email) {
        sendTasks.push(
            sendMessageEmailNotification({
                recipientEmail: recipientProfile.email,
                recipientName: recipientProfile.name ?? "회원",
                senderName,
                messagePreview,
                recipientUserId,
            }),
        );
    }

    // 카카오 발송
    if (kakaoEnabled && recipientProfile.phone) {
        sendTasks.push(
            sendMessageKakaoNotification({
                recipientPhone: recipientProfile.phone,
                senderName,
                messagePreview,
                recipientUserId,
            }),
        );
    }

    await Promise.allSettled(sendTasks);
}

interface SendMessageEmailNotificationParams {
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    messagePreview: string;
    recipientUserId: string;
}

async function sendMessageEmailNotification(params: SendMessageEmailNotificationParams): Promise<void> {
    const { recipientEmail, recipientName, senderName, messagePreview, recipientUserId } = params;

    const adminSupabase = createSupabaseAdminClient();

    try {
        const subject = `[메디허브] ${senderName}님으로부터 새 메시지가 도착했습니다`;
        const body = `안녕하세요, ${recipientName}님.

${senderName}님이 리드 문의에 메시지를 보냈습니다.

메시지 미리보기:
"${messagePreview}${messagePreview.length >= 100 ? "..." : ""}"

전체 내용을 확인하려면 메디허브에 접속해주세요.

감사합니다.
메디허브 팀`;

        const result = await resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: recipientEmail,
            subject,
            text: body,
        });

        await insertNotificationDelivery(adminSupabase, {
            userId: recipientUserId,
            type: "lead_message_received",
            channel: "email",
            provider: "resend",
            recipient: recipientEmail,
            subject,
            bodyPreview: body.slice(0, 200),
            providerResponse: result as Json,
            sentAt: new Date().toISOString(),
            status: "sent",
        });

        console.log(`[Notification] Message email sent to user ${recipientUserId}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await insertNotificationDelivery(adminSupabase, {
            userId: recipientUserId,
            type: "lead_message_received",
            channel: "email",
            provider: "resend",
            recipient: recipientEmail,
            failedAt: new Date().toISOString(),
            errorMessage,
            status: "failed",
        });

        console.error(`[Notification] Message email failed for user ${recipientUserId}`, error);
    }
}

interface SendMessageKakaoNotificationParams {
    recipientPhone: string;
    senderName: string;
    messagePreview: string;
    recipientUserId: string;
}

async function sendMessageKakaoNotification(params: SendMessageKakaoNotificationParams): Promise<void> {
    const { recipientPhone, senderName, messagePreview, recipientUserId } = params;

    const adminSupabase = createSupabaseAdminClient();

    try {
        const template = getLeadMessageReceivedKakaoTemplate({
            senderName,
            messagePreview: messagePreview.slice(0, 50),
        });

        const result = await sendKakaoAlimtalk({
            phone: recipientPhone,
            template,
        });

        await insertNotificationDelivery(adminSupabase, {
            userId: recipientUserId,
            type: "lead_message_received",
            channel: "kakao",
            provider: "solapi",
            recipient: recipientPhone,
            bodyPreview: `알림톡: ${template.templateId}`,
            providerResponse: result.providerResponse,
            sentAt: result.success ? new Date().toISOString() : undefined,
            failedAt: !result.success ? new Date().toISOString() : undefined,
            errorMessage: result.error,
            status: result.success ? "sent" : "failed",
        });

        if (result.success) {
            console.log(`[Notification] Message kakao sent to user ${recipientUserId}`);
        } else {
            console.error(`[Notification] Message kakao failed for user ${recipientUserId}`, result.error);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await insertNotificationDelivery(adminSupabase, {
            userId: recipientUserId,
            type: "lead_message_received",
            channel: "kakao",
            provider: "solapi",
            recipient: recipientPhone,
            failedAt: new Date().toISOString(),
            errorMessage,
            status: "failed",
        });

        console.error(`[Notification] Message kakao failed for user ${recipientUserId}`, error);
    }
}
