import type { TablesUpdate } from "@/lib/database.types";
import { VendorPatchBodySchema, VendorUpsertBodySchema } from "@/lib/schema/vendor";
import { badRequest, conflict, internalServerError, notFound } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { safeInsertAuditLog } from "@/server/audit/utils";
import type { AuthedContext } from "@/server/auth/guards";
import { withRole } from "@/server/auth/guards";
import { mapVendorDetail } from "@/server/vendor/mapper";
import { fetchVendorCategories, fetchVendorPortfolios } from "@/server/vendor/repository";

async function fetchMyVendor(ctx: AuthedContext) {
    const { data, error } = await ctx.supabase.from("vendors").select("*").eq("owner_user_id", ctx.user.id).maybeSingle();

    if (error) {
        throw internalServerError("업체 프로필을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data;
}

async function syncVendorCategories(input: {
    supabase: Parameters<typeof fetchVendorCategories>[0];
    vendorId: string;
    categoryIds: string[];
}) {
    const unique = Array.from(new Set(input.categoryIds));

    const { data: existing, error } = await input.supabase
        .from("vendor_categories")
        .select("category_id")
        .eq("vendor_id", input.vendorId);

    if (error) {
        throw internalServerError("업체 카테고리를 확인할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const existingSet = new Set((existing ?? []).map((row) => row.category_id));
    const nextSet = new Set(unique);

    const toAdd = unique.filter((id) => !existingSet.has(id));
    const toRemove = Array.from(existingSet).filter((id) => !nextSet.has(id));

    if (toRemove.length > 0) {
        const { error: deleteError } = await input.supabase
            .from("vendor_categories")
            .delete()
            .eq("vendor_id", input.vendorId)
            .in("category_id", toRemove);

        if (deleteError) {
            throw internalServerError("업체 카테고리 업데이트에 실패했습니다.", {
                message: deleteError.message,
                code: deleteError.code,
            });
        }
    }

    if (toAdd.length > 0) {
        const { error: insertError } = await input.supabase.from("vendor_categories").insert(
            toAdd.map((categoryId) => ({
                vendor_id: input.vendorId,
                category_id: categoryId,
            })),
        );

        if (insertError) {
            if (insertError.code === "23503") {
                throw badRequest("존재하지 않는 카테고리가 포함되어 있습니다.", {
                    message: insertError.message,
                    code: insertError.code,
                });
            }

            throw internalServerError("업체 카테고리 업데이트에 실패했습니다.", {
                message: insertError.message,
                code: insertError.code,
            });
        }
    }
}

export const GET = withApi(
    withRole(["vendor"], async (ctx) => {
        const vendor = await fetchMyVendor(ctx);
        if (!vendor) return ok({ vendor: null });

        const [categories, portfolios] = await Promise.all([
            fetchVendorCategories(ctx.supabase, vendor.id),
            fetchVendorPortfolios(ctx.supabase, vendor.id),
        ]);

        return ok({
            vendor: mapVendorDetail({
                vendor,
                ownerUserId: vendor.owner_user_id,
                categories,
                portfolios,
            }),
        });
    }),
);

export const POST = withApi(
    withRole(["vendor"], async (ctx) => {
        const body = VendorUpsertBodySchema.parse(await ctx.req.json());

        const existing = await fetchMyVendor(ctx);
        if (existing) {
            throw conflict("이미 업체 프로필이 있습니다.");
        }

        const { data: vendor, error } = await ctx.supabase
            .from("vendors")
            .insert({
                owner_user_id: ctx.user.id,
                name: body.name,
                summary: body.summary ?? null,
                description: body.description ?? null,
                region_primary: body.regionPrimary ?? null,
                region_secondary: body.regionSecondary ?? null,
                price_min: body.priceMin ?? null,
                price_max: body.priceMax ?? null,
            })
            .select("*")
            .single();

        if (error) {
            if (error.code === "23505") {
                throw conflict("이미 업체 프로필이 있습니다.");
            }

            throw internalServerError("업체 프로필 생성에 실패했습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        if (body.categoryIds && body.categoryIds.length > 0) {
            await syncVendorCategories({ supabase: ctx.supabase, vendorId: vendor.id, categoryIds: body.categoryIds });
        }

        const [categories, portfolios] = await Promise.all([
            fetchVendorCategories(ctx.supabase, vendor.id),
            fetchVendorPortfolios(ctx.supabase, vendor.id),
        ]);

        // Audit log: vendor.create
        await safeInsertAuditLog(
            ctx.supabase,
            {
                actor_user_id: ctx.user.id,
                action: "vendor.create",
                target_type: "vendor",
                target_id: vendor.id,
                metadata: { name: vendor.name },
            },
            "vendors/me/POST",
        );

        return created({
            vendor: mapVendorDetail({
                vendor,
                ownerUserId: vendor.owner_user_id,
                categories,
                portfolios,
            }),
        });
    }),
);

export const PATCH = withApi(
    withRole(["vendor"], async (ctx) => {
        const body = VendorPatchBodySchema.parse(await ctx.req.json());

        const existing = await fetchMyVendor(ctx);
        if (!existing) {
            throw notFound("업체 프로필이 없습니다.");
        }

        const update: TablesUpdate<"vendors"> = {};
        if (typeof body.name !== "undefined") update.name = body.name;
        if (typeof body.summary !== "undefined") update.summary = body.summary;
        if (typeof body.description !== "undefined") update.description = body.description;
        if (typeof body.regionPrimary !== "undefined") update.region_primary = body.regionPrimary;
        if (typeof body.regionSecondary !== "undefined") update.region_secondary = body.regionSecondary;
        if (typeof body.priceMin !== "undefined") update.price_min = body.priceMin;
        if (typeof body.priceMax !== "undefined") update.price_max = body.priceMax;
        if (typeof body.status !== "undefined") update.status = body.status;

        const shouldUpdateVendor = Object.keys(update).length > 0;
        const vendor = shouldUpdateVendor
            ? await (async () => {
                  const { data, error } = await ctx.supabase
                      .from("vendors")
                      .update(update)
                      .eq("id", existing.id)
                      .select("*")
                      .single();

                  if (error) {
                      throw internalServerError("업체 프로필 수정에 실패했습니다.", {
                          message: error.message,
                          code: error.code,
                      });
                  }

                  return data;
              })()
            : existing;

        if (typeof body.categoryIds !== "undefined") {
            await syncVendorCategories({ supabase: ctx.supabase, vendorId: vendor.id, categoryIds: body.categoryIds });
        }

        const [categories, portfolios] = await Promise.all([
            fetchVendorCategories(ctx.supabase, vendor.id),
            fetchVendorPortfolios(ctx.supabase, vendor.id),
        ]);

        // Audit log: vendor.update
        const changedFields = Object.keys(update);
        if (typeof body.categoryIds !== "undefined") {
            changedFields.push("categoryIds");
        }
        if (changedFields.length > 0) {
            await safeInsertAuditLog(
                ctx.supabase,
                {
                    actor_user_id: ctx.user.id,
                    action: "vendor.update",
                    target_type: "vendor",
                    target_id: vendor.id,
                    metadata: { changedFields },
                },
                "vendors/me/PATCH",
            );
        }

        return ok({
            vendor: mapVendorDetail({
                vendor,
                ownerUserId: vendor.owner_user_id,
                categories,
                portfolios,
            }),
        });
    }),
);
