import { FileSignedDownloadQuerySchema } from "@/lib/schema/file";
import { withApi } from "@/server/api/with-api";
import {
    createAuthorizedSignedDownloadUrl,
    DEFAULT_SIGNED_DOWNLOAD_EXPIRES_IN,
    parseDownloadOption,
} from "@/server/file/signed-download";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
    const { signedUrl } = await createAuthorizedSignedDownloadUrl({
        supabase,
        user,
        fileId: query.fileId,
        download,
        expiresIn: DEFAULT_SIGNED_DOWNLOAD_EXPIRES_IN,
    });

    return NextResponse.redirect(signedUrl, 302);
});

