import { zUuid } from "@/lib/schema/common";
import { ProductPatchBodySchema } from "@/lib/schema/product";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapProductDetail, mapProductFaq, mapProductImage } from "@/server/product/mapper";

export const GET = withApi(
    withRole<{ id: string }>(["vendor"], async (ctx) => {
        const productId = zUuid.parse(ctx.params.id);

        // Find vendor by current user
        const { data: vendor, error: vendorError } = await ctx.supabase
            .from("vendors")
            .select("id, name")
            .eq("owner_user_id", ctx.user.id)
            .maybeSingle();

        if (vendorError) {
            throw internalServerError("업체 프로필을 확인할 수 없습니다.", {
                message: vendorError.message,
                code: vendorError.code,
            });
        }

        if (!vendor) {
            throw notFound("업체 프로필이 없습니다.");
        }

        // Fetch own product (RLS: products_select_owner allows all statuses)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: productRow, error: productError } = await (ctx.supabase as any)
            .from("products")
            .select("*, categories!inner(slug)")
            .eq("id", productId)
            .eq("vendor_id", vendor.id)
            .maybeSingle();

        if (productError) {
            throw internalServerError("상품을 조회할 수 없습니다.", {
                message: productError.message,
                code: productError.code,
            });
        }

        if (!productRow) {
            throw notFound("상품을 찾을 수 없습니다.");
        }

        const category = (productRow as Record<string, unknown>).categories as { slug: string } | null;

        // Fetch images and FAQs
        const [imagesResult, faqsResult] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ctx.supabase as any)
                .from("product_images")
                .select("*")
                .eq("product_id", productId)
                .order("sort_order", { ascending: true })
                .order("created_at", { ascending: true }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ctx.supabase as any)
                .from("product_faqs")
                .select("*")
                .eq("product_id", productId)
                .order("sort_order", { ascending: true })
                .order("created_at", { ascending: true }),
        ]);

        if (imagesResult.error) {
            throw internalServerError("상품 이미지를 조회할 수 없습니다.", {
                message: imagesResult.error.message,
                code: imagesResult.error.code,
            });
        }

        if (faqsResult.error) {
            throw internalServerError("상품 FAQ를 조회할 수 없습니다.", {
                message: faqsResult.error.message,
                code: faqsResult.error.code,
            });
        }

        const images = ((imagesResult.data as Record<string, unknown>[]) ?? []).map(mapProductImage);
        const faqs = ((faqsResult.data as Record<string, unknown>[]) ?? []).map(mapProductFaq);

        const product = mapProductDetail({
            product: productRow as Record<string, unknown>,
            vendor: { id: vendor.id, name: vendor.name },
            categorySlug: category?.slug ?? null,
            images,
            faqs,
        });

        return ok({ product });
    }),
);

export const PATCH = withApi(
    withRole<{ id: string }>(["vendor"], async (ctx) => {
        const productId = zUuid.parse(ctx.params.id);
        const body = ProductPatchBodySchema.parse(await ctx.req.json());

        // Find vendor by current user
        const { data: vendor, error: vendorError } = await ctx.supabase
            .from("vendors")
            .select("id, name")
            .eq("owner_user_id", ctx.user.id)
            .maybeSingle();

        if (vendorError) {
            throw internalServerError("업체 프로필을 확인할 수 없습니다.", {
                message: vendorError.message,
                code: vendorError.code,
            });
        }

        if (!vendor) {
            throw notFound("업체 프로필이 없습니다.");
        }

        // 현재 상태를 먼저 확인해 unchanged active 저장은 허용하고,
        // 실제 상태 변경으로 active를 요청하는 경우만 차단한다.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: currentProductRow, error: currentProductError } = await (ctx.supabase as any)
            .from("products")
            .select("id, status")
            .eq("id", productId)
            .eq("vendor_id", vendor.id)
            .maybeSingle();

        if (currentProductError) {
            throw internalServerError("상품을 조회할 수 없습니다.", {
                message: currentProductError.message,
                code: currentProductError.code,
            });
        }

        if (!currentProductRow) {
            throw notFound("상품을 찾을 수 없습니다.");
        }

        // Build update object
        const updateData: Record<string, unknown> = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.summary !== undefined) updateData.summary = body.summary;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.priceType !== undefined) updateData.price_type = body.priceType;
        if (body.priceMin !== undefined) updateData.price_min = body.priceMin;
        if (body.priceMax !== undefined) updateData.price_max = body.priceMax;
        if (body.priceUnit !== undefined) updateData.price_unit = body.priceUnit;
        if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder;
        if (body.status !== undefined) {
            const currentStatus = (currentProductRow as Record<string, unknown>).status as string;
            // Vendor는 active로 "변경"할 수 없고, 이미 active인 값을 그대로 보내는 경우만 허용한다.
            if (body.status === "active" && currentStatus !== "active") {
                throw badRequest("상품 상태를 직접 변경할 수 없습니다. 관리자 승인을 요청하세요.");
            }
            if (body.status !== currentStatus) {
                updateData.status = body.status;
            }
        }

        let updated: Record<string, unknown>;

        if (Object.keys(updateData).length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: updatedRow, error: updateError } = await (ctx.supabase as any)
                .from("products")
                .update(updateData)
                .eq("id", productId)
                .eq("vendor_id", vendor.id)
                .select("*, categories!inner(slug)")
                .maybeSingle();

            if (updateError) {
                throw internalServerError("상품 수정에 실패했습니다.", {
                    message: updateError.message,
                    code: updateError.code,
                });
            }

            if (!updatedRow) {
                throw notFound("상품을 찾을 수 없습니다.");
            }
            updated = updatedRow as Record<string, unknown>;
        } else {
            // Only images/faqs changed — fetch current product
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingRow, error: fetchError } = await (ctx.supabase as any)
                .from("products")
                .select("*, categories!inner(slug)")
                .eq("id", productId)
                .eq("vendor_id", vendor.id)
                .maybeSingle();

            if (fetchError) {
                throw internalServerError("상품을 조회할 수 없습니다.", {
                    message: fetchError.message,
                    code: fetchError.code,
                });
            }

            if (!existingRow) {
                throw notFound("상품을 찾을 수 없습니다.");
            }
            updated = existingRow as Record<string, unknown>;
        }

        const category = (updated as Record<string, unknown>).categories as { slug: string } | null;

        // Handle images: delete-all-reinsert if provided, otherwise fetch existing
        let images: ReturnType<typeof mapProductImage>[] = [];
        if (body.images !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: deleteImgErr } = await (ctx.supabase as any)
                .from("product_images")
                .delete()
                .eq("product_id", productId);

            if (deleteImgErr) {
                throw internalServerError("기존 이미지를 삭제할 수 없습니다.", {
                    message: deleteImgErr.message,
                    code: deleteImgErr.code,
                });
            }

            if (body.images.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: imageRows, error: imageError } = await (ctx.supabase as any)
                    .from("product_images")
                    .insert(
                        body.images.map((img, index) => ({
                            product_id: productId,
                            file_id: img.fileId ?? null,
                            url: img.url ?? null,
                            alt_text: img.altText ?? null,
                            is_primary: img.isPrimary ?? index === 0,
                            sort_order: img.sortOrder ?? index,
                        })),
                    )
                    .select("*");

                if (imageError) {
                    if (imageError.code === "23503") {
                        throw badRequest("파일 정보가 올바르지 않습니다.", {
                            message: imageError.message,
                            code: imageError.code,
                        });
                    }
                    throw internalServerError("상품 이미지 생성에 실패했습니다.", {
                        message: imageError.message,
                        code: imageError.code,
                    });
                }

                images = ((imageRows as Record<string, unknown>[]) ?? []).map(mapProductImage);
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingImages, error: imgErr } = await (ctx.supabase as any)
                .from("product_images")
                .select("*")
                .eq("product_id", productId)
                .order("sort_order", { ascending: true })
                .order("created_at", { ascending: true });

            if (imgErr) {
                throw internalServerError("상품 이미지를 조회할 수 없습니다.", {
                    message: imgErr.message,
                    code: imgErr.code,
                });
            }
            images = ((existingImages as Record<string, unknown>[]) ?? []).map(mapProductImage);
        }

        // Handle FAQs: delete-all-reinsert if provided, otherwise fetch existing
        let faqs: ReturnType<typeof mapProductFaq>[] = [];
        if (body.faqs !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: deleteFaqErr } = await (ctx.supabase as any)
                .from("product_faqs")
                .delete()
                .eq("product_id", productId);

            if (deleteFaqErr) {
                throw internalServerError("기존 FAQ를 삭제할 수 없습니다.", {
                    message: deleteFaqErr.message,
                    code: deleteFaqErr.code,
                });
            }

            if (body.faqs.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: faqRows, error: faqError } = await (ctx.supabase as any)
                    .from("product_faqs")
                    .insert(
                        body.faqs.map((faq, index) => ({
                            product_id: productId,
                            question: faq.question,
                            answer: faq.answer,
                            sort_order: faq.sortOrder ?? index,
                        })),
                    )
                    .select("*");

                if (faqError) {
                    throw internalServerError("상품 FAQ 생성에 실패했습니다.", {
                        message: faqError.message,
                        code: faqError.code,
                    });
                }

                faqs = ((faqRows as Record<string, unknown>[]) ?? []).map(mapProductFaq);
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingFaqs, error: faqErr } = await (ctx.supabase as any)
                .from("product_faqs")
                .select("*")
                .eq("product_id", productId)
                .order("sort_order", { ascending: true })
                .order("created_at", { ascending: true });

            if (faqErr) {
                throw internalServerError("상품 FAQ를 조회할 수 없습니다.", {
                    message: faqErr.message,
                    code: faqErr.code,
                });
            }
            faqs = ((existingFaqs as Record<string, unknown>[]) ?? []).map(mapProductFaq);
        }

        const product = mapProductDetail({
            product: updated as Record<string, unknown>,
            vendor: { id: vendor.id, name: vendor.name },
            categorySlug: category?.slug ?? null,
            images,
            faqs,
        });

        return ok({ product });
    }),
);

export const DELETE = withApi(
    withRole<{ id: string }>(["vendor"], async (ctx) => {
        const productId = zUuid.parse(ctx.params.id);

        // Find vendor by current user
        const { data: vendor, error: vendorError } = await ctx.supabase
            .from("vendors")
            .select("id")
            .eq("owner_user_id", ctx.user.id)
            .maybeSingle();

        if (vendorError) {
            throw internalServerError("업체 프로필을 확인할 수 없습니다.", {
                message: vendorError.message,
                code: vendorError.code,
            });
        }

        if (!vendor) {
            throw notFound("업체 프로필이 없습니다.");
        }

        // RLS: products_delete_owner ensures only owner can delete
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: deleted, error: deleteError } = await (ctx.supabase as any)
            .from("products")
            .delete()
            .eq("id", productId)
            .eq("vendor_id", vendor.id)
            .select("id")
            .maybeSingle();

        if (deleteError) {
            throw internalServerError("상품 삭제에 실패했습니다.", {
                message: deleteError.message,
                code: deleteError.code,
            });
        }

        if (!deleted) {
            throw notFound("상품을 찾을 수 없습니다.");
        }

        return ok({ id: (deleted as Record<string, unknown>).id as string });
    }),
);
