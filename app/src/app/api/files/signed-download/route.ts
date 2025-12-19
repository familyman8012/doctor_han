import { FileSignedDownloadQuerySchema } from "@/lib/schema/file";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

const DEFAULT_EXPIRES_IN = 60 * 10;

function sanitizeDownloadName(input: string): string {
    const base = input.trim().split(/[\\/]/).pop() ?? "file";
    const sanitized = base
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^\.+/, "")
        .slice(0, 120);

    return sanitized.length > 0 ? sanitized : "file";
}

function parseDownloadOption(value: string | undefined): boolean | string | undefined {
    if (!value) return undefined;

    const lowered = value.toLowerCase();
    if (lowered === "1" || lowered === "true") return true;
    if (lowered === "0" || lowered === "false") return undefined;

    return sanitizeDownloadName(value);
}

export const GET = withApi(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = FileSignedDownloadQuerySchema.parse({
        fileId: searchParams.get("fileId") ?? undefined,
        download: searchParams.get("download") ?? undefined,
    });

    const supabase = await createSupabaseServerClient();
    const { data: userResult } = await supabase.auth.getUser();
    const user = userResult.user;

    const admin = createSupabaseAdminClient();
    const { data: fileRow, error: fileError } = await admin.from("files").select("*").eq("id", query.fileId).maybeSingle();

    if (fileError) {
        throw internalServerError("파일을 조회할 수 없습니다.", {
            message: fileError.message,
            code: fileError.code,
        });
    }

    if (!fileRow) {
        throw notFound("파일을 찾을 수 없습니다.");
    }

    const isOwner = Boolean(user?.id && user.id === fileRow.owner_user_id);
    let isAdmin = false;

    if (user && !isOwner) {
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
            throw internalServerError("권한을 확인할 수 없습니다.", {
                message: profileError.message,
                code: profileError.code,
            });
        }

        isAdmin = profile?.role === "admin";
    }

    if (!isOwner && !isAdmin) {
        if (fileRow.purpose === "portfolio") {
            const { data: asset, error: assetError } = await supabase
                .from("vendor_portfolio_assets")
                .select(
                    `
                        id,
                        portfolio:vendor_portfolios!vendor_portfolio_assets_portfolio_id_fkey(
                            vendor:vendors!vendor_portfolios_vendor_id_fkey(owner_user_id)
                        )
                    `,
                )
                .eq("file_id", fileRow.id)
                .limit(1)
                .maybeSingle();

            if (assetError) {
                throw internalServerError("파일 권한을 확인할 수 없습니다.", {
                    message: assetError.message,
                    code: assetError.code,
                });
            }

            const portfolioOwnerUserId = (asset as any)?.portfolio?.vendor?.owner_user_id as string | undefined;
            if (!asset || !portfolioOwnerUserId || portfolioOwnerUserId !== fileRow.owner_user_id) {
                throw notFound("파일을 찾을 수 없습니다.");
            }
        } else if (fileRow.purpose === "lead_attachment") {
            if (!user) {
                throw notFound("파일을 찾을 수 없습니다.");
            }

            const { data: attachment, error: attachmentError } = await supabase
                .from("lead_attachments")
                .select("id")
                .eq("file_id", fileRow.id)
                .limit(1)
                .maybeSingle();

            if (attachmentError) {
                throw internalServerError("파일 권한을 확인할 수 없습니다.", {
                    message: attachmentError.message,
                    code: attachmentError.code,
                });
            }

            if (!attachment) {
                throw notFound("파일을 찾을 수 없습니다.");
            }
        } else {
            throw notFound("파일을 찾을 수 없습니다.");
        }
    }

    const download = parseDownloadOption(query.download);

    const { data: signed, error: signedError } = await admin.storage
        .from(fileRow.bucket)
        .createSignedUrl(fileRow.path, DEFAULT_EXPIRES_IN, download ? { download } : undefined);

    if (signedError || !signed) {
        throw internalServerError("다운로드 URL을 발급할 수 없습니다.", {
            message: signedError?.message,
            ...(typeof (signedError as any)?.status === "number" ? { status: (signedError as any).status } : {}),
            ...(typeof (signedError as any)?.statusCode === "string"
                ? { statusCode: (signedError as any).statusCode }
                : {}),
        });
    }

    return ok({
        signedUrl: signed.signedUrl,
        expiresIn: DEFAULT_EXPIRES_IN,
    });
});
