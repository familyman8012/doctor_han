import "server-only";

import type { Database } from "@/lib/database.types";
import type { LeadMessage, LeadMessageAttachment } from "@/lib/schema/lead";

export type LeadMessageRow = Database["public"]["Tables"]["lead_messages"]["Row"];
export type LeadMessageAttachmentRow = Database["public"]["Tables"]["lead_message_attachments"]["Row"];

export function mapMessageAttachmentRow(row: LeadMessageAttachmentRow): LeadMessageAttachment {
    return {
        id: row.id,
        messageId: row.message_id,
        fileId: row.file_id,
        createdAt: row.created_at,
    };
}

export function mapMessageRow(
    row: LeadMessageRow,
    attachments: LeadMessageAttachmentRow[] = [],
): LeadMessage {
    return {
        id: row.id,
        leadId: row.lead_id,
        senderId: row.sender_id,
        content: row.content,
        readAt: row.read_at,
        createdAt: row.created_at,
        attachments: attachments.map(mapMessageAttachmentRow),
    };
}
