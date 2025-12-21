import "server-only";

import type { Database, Tables } from "@/lib/database.types";
import { internalServerError, notFound } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export const DEFAULT_SIGNED_DOWNLOAD_EXPIRES_IN = 60 * 10;

function pickSupabaseErrorMeta(error: unknown): { status?: number; statusCode?: string } {
    if (!error || typeof error !== "object") return {};

    const record = error as Record<string, unknown>;
    const status = typeof record.status === "number" ? record.status : undefined;
    const statusCode = typeof record.statusCode === "string" ? record.statusCode : undefined;

    return {
        ...(typeof status === "undefined" ? {} : { status }),
        ...(typeof statusCode === "undefined" ? {} : { statusCode }),
    };
}

function sanitizeDownloadName(input: string): string {
    const base = input.trim().split(/[\\/]/).pop() ?? "file";
    const sanitized = base
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^\.+/, "")
        .slice(0, 120);

    return sanitized.length > 0 ? sanitized : "file";
}

export function parseDownloadOption(value: string | undefined): boolean | string | undefined {
    if (!value) return undefined;

    const lowered = value.toLowerCase();
    if (lowered === "1" || lowered === "true") return true;
    if (lowered === "0" || lowered === "false") return undefined;

    return sanitizeDownloadName(value);
}

type FileRow = Tables<"files">;
type PortfolioAssetOwnershipLookup = {
    portfolio?: {
        vendor?: {
            owner_user_id?: string | null;
        } | null;
    } | null;
};

export async function createAuthorizedSignedDownloadUrl(input: {
    supabase: SupabaseClient<Database>;
    user: User | null;
    fileId: string;
    download?: boolean | string;
    expiresIn?: number;
}): Promise<{ signedUrl: string; expiresIn: number; file: FileRow }> {
    const expiresIn = input.expiresIn ?? DEFAULT_SIGNED_DOWNLOAD_EXPIRES_IN;

    const admin = createSupabaseAdminClient();
    const { data: fileRow, error: fileError } = await admin.from("files").select("*").eq("id", input.fileId).maybeSingle();

    if (fileError) {
        throw internalServerError("파일을 조회할 수 없습니다.", {
            message: fileError.message,
            code: fileError.code,
        });
    }

    if (!fileRow) {
        throw notFound("파일을 찾을 수 없습니다.");
    }

    const purpose = (fileRow as unknown as { purpose: string }).purpose;
    const isOwner = Boolean(input.user?.id && input.user.id === fileRow.owner_user_id);
    let isAdmin = false;

    if (input.user && !isOwner) {
        const { data: profile, error: profileError } = await input.supabase
            .from("profiles")
            .select("role")
            .eq("id", input.user.id)
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
        if (purpose === "portfolio") {
            const { data: asset, error: assetError } = await input.supabase
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

            const portfolioOwnerUserId =
                (asset as unknown as PortfolioAssetOwnershipLookup | null)?.portfolio?.vendor?.owner_user_id ?? undefined;
            if (!asset || !portfolioOwnerUserId || portfolioOwnerUserId !== fileRow.owner_user_id) {
                throw notFound("파일을 찾을 수 없습니다.");
            }
        } else if (purpose === "lead_attachment") {
            if (!input.user) {
                throw notFound("파일을 찾을 수 없습니다.");
            }

            const { data: attachment, error: attachmentError } = await input.supabase
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
        } else if (purpose === "review_photo") {
            const { data: review, error: reviewError } = await input.supabase
                .from("reviews")
                .select("id")
                .contains("photo_file_ids", [fileRow.id])
                .limit(1)
                .maybeSingle();

            if (reviewError) {
                throw internalServerError("파일 권한을 확인할 수 없습니다.", {
                    message: reviewError.message,
                    code: reviewError.code,
                });
            }

            if (!review) {
                throw notFound("파일을 찾을 수 없습니다.");
            }
        } else {
            throw notFound("파일을 찾을 수 없습니다.");
        }
    }

    const { data: signed, error: signedError } = await admin.storage
        .from(fileRow.bucket)
        .createSignedUrl(fileRow.path, expiresIn, input.download ? { download: input.download } : undefined);

    if (signedError || !signed) {
        const meta = pickSupabaseErrorMeta(signedError);
        throw internalServerError("다운로드 URL을 발급할 수 없습니다.", {
            message: signedError?.message,
            ...meta,
        });
    }

    return { signedUrl: signed.signedUrl, expiresIn, file: fileRow };
}
