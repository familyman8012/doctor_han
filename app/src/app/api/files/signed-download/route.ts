import { FileSignedDownloadQuerySchema } from "@/lib/schema/file";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { safeInsertAuditLog } from "@/server/audit/utils";
import {
    createAuthorizedSignedDownloadUrl,
    DEFAULT_SIGNED_DOWNLOAD_EXPIRES_IN,
    parseDownloadOption,
} from "@/server/file/signed-download";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

const VERIFICATION_FILE_PURPOSES = ["doctor_license", "vendor_business_license"];

export const GET = withApi(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = FileSignedDownloadQuerySchema.parse({
        fileId: searchParams.get("fileId") ?? undefined,
        download: searchParams.get("download") ?? undefined,
    });

    const supabase = await createSupabaseServerClient();
    const { data: userResult } = await supabase.auth.getUser();
    const user = userResult.user;

    const download = parseDownloadOption(query.download);

    const { signedUrl, expiresIn, file } = await createAuthorizedSignedDownloadUrl({
        supabase,
        user,
        fileId: query.fileId,
        download,
        expiresIn: DEFAULT_SIGNED_DOWNLOAD_EXPIRES_IN,
    });

    // Audit log: file.download (verification files only)
    const purpose = (file as unknown as { purpose: string }).purpose;
    if (user && VERIFICATION_FILE_PURPOSES.includes(purpose)) {
        const fileName = file.path.split("/").pop() ?? file.id;
        await safeInsertAuditLog(
            supabase,
            {
                actor_user_id: user.id,
                action: "file.download",
                target_type: "verification_file",
                target_id: file.id,
                metadata: {
                    fileType: purpose,
                    fileName,
                    targetUserId: file.owner_user_id,
                },
            },
            "files/signed-download/GET",
        );
    }

    return ok({
        signedUrl,
        expiresIn,
    });
});
