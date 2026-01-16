import { badRequest } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { requireUser } from "@/server/auth/guards";
import { upsertOnboardingStep } from "@/server/onboarding/completion";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

const PatchBodySchema = z.object({
    action: z.enum(["skip", "complete"]),
}).strict();

export const PATCH = withApi(async (req: NextRequest) => {
    const supabase = await createSupabaseServerClient();
    const user = await requireUser(supabase);

    const body = await req.json();
    const parsed = PatchBodySchema.safeParse(body);
    if (!parsed.success) {
        throw badRequest("잘못된 요청입니다.", parsed.error.flatten());
    }

    const { action } = parsed.data;
    const now = new Date().toISOString();

    if (action === "skip") {
        await upsertOnboardingStep(supabase, user.id, { skipped_at: now });
    } else if (action === "complete") {
        await upsertOnboardingStep(supabase, user.id, { completed_at: now, skipped_at: null });
    }

    return ok({ success: true });
});
