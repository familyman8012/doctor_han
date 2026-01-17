import { FileSignedUploadBodySchema } from "@/lib/schema/file";
import { forbidden, internalServerError, tooManyRequests } from "@/server/api/errors";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { mapFileRow } from "@/server/file/mapper";
import { checkRateLimit, incrementRateLimit, logRateLimitExceeded } from "@/server/rate-limit";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

const DEFAULT_BUCKET = "uploads";

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

function sanitizeFileName(input: string): string {
    const base = input.trim().split(/[\\/]/).pop() ?? "file";
    const sanitized = base
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^\.+/, "")
        .slice(0, 120);

    return sanitized.length > 0 ? sanitized : "file";
}

async function ensurePrivateBucketExists(bucket: string): Promise<void> {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.storage.createBucket(bucket, { public: false });
    const meta = pickSupabaseErrorMeta(error);

    if (error && meta.status !== 409) {
        throw internalServerError("스토리지 버킷을 준비할 수 없습니다.", {
            message: error.message,
            ...meta,
        });
    }
}

export const POST = withApi(
    withAuth(async (ctx) => {
        const body = FileSignedUploadBodySchema.parse(await ctx.req.json());

        // Rate limit 체크
        const rateCheck = await checkRateLimit(ctx.user.id, "file_upload");
        if (!rateCheck.allowed) {
            await logRateLimitExceeded(ctx.user.id, "file_upload", { purpose: body.purpose });
            throw tooManyRequests("파일 업로드 횟수를 초과했습니다.", {
                resetAt: rateCheck.resetAt?.toISOString(),
                retryAfter: rateCheck.retryAfterSeconds,
            });
        }

        const allowedPurposesByRole: Record<string, readonly string[]> = {
            doctor: ["doctor_license", "lead_attachment", "avatar", "review_photo"],
            vendor: ["vendor_business_license", "portfolio", "lead_attachment", "avatar"],
            admin: ["doctor_license", "vendor_business_license", "portfolio", "lead_attachment", "avatar", "review_photo"],
        };

        const allowed = allowedPurposesByRole[ctx.profile.role] ?? [];
        if (!allowed.includes(body.purpose)) {
            throw forbidden();
        }

        await ensurePrivateBucketExists(DEFAULT_BUCKET);

        const fileId = crypto.randomUUID();
        const safeName = sanitizeFileName(body.fileName);
        const path = `${ctx.user.id}/${body.purpose}/${fileId}-${safeName}`;

        const { data: fileRow, error: fileError } = await ctx.supabase
            .from("files")
            .insert({
                id: fileId,
                owner_user_id: ctx.user.id,
                bucket: DEFAULT_BUCKET,
                path,
                purpose: body.purpose,
                mime_type: body.mimeType ?? null,
                size_bytes: body.sizeBytes ?? null,
            })
            .select("*")
            .single();

        if (fileError) {
            throw internalServerError("파일 메타데이터를 저장할 수 없습니다.", {
                message: fileError.message,
                code: fileError.code,
            });
        }

        const admin = createSupabaseAdminClient();
        const { data: upload, error: uploadError } = await admin.storage
            .from(fileRow.bucket)
            .createSignedUploadUrl(fileRow.path);

        if (uploadError || !upload) {
            const meta = pickSupabaseErrorMeta(uploadError);
            const cleanup = await ctx.supabase.from("files").delete().eq("id", fileRow.id);
            if (cleanup.error) {
                console.error("[POST /api/files/signed-upload] cleanup failed", cleanup.error);
            }

            throw internalServerError("업로드 URL을 발급할 수 없습니다.", {
                message: uploadError?.message,
                ...meta,
            });
        }

        // 성공 시 rate limit 카운트 증가
        await incrementRateLimit(ctx.user.id, "file_upload");

        return created({
            file: mapFileRow(fileRow),
            upload: {
                signedUrl: upload.signedUrl,
                token: upload.token,
                bucket: fileRow.bucket,
                path: fileRow.path,
            },
        });
    }),
);
