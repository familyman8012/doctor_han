import type { Tables } from "@/lib/database.types";
import type { FileView } from "@/lib/schema/file";

type FileRow = Tables<"files">;

export function mapFileRow(row: FileRow): FileView {
    return {
        id: row.id,
        ownerUserId: row.owner_user_id,
        bucket: row.bucket,
        path: row.path,
        purpose: row.purpose,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
    };
}

