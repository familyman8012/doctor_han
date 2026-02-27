import "server-only";

import type { Database } from "@/lib/database.types";
import type { VendorServicePrice } from "@/lib/schema/vendor-pricing";
import { badRequest, conflict, forbidden, notFound } from "@/server/api/errors";
import { mapCategoryRow } from "@/server/category/mapper";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapVendorServicePriceRow } from "./pricing-mapper";
import {
    archiveVendorServicePrice,
    createVendorServicePrice,
    getVendorServicePriceById,
    listVendorServicePrices,
    updateVendorServicePrice,
} from "./pricing-repository";

async function validateCategoryBelongsToVendor(
    supabase: SupabaseClient<Database>,
    vendorId: string,
    categoryId: string,
): Promise<void> {
    const { data, error } = await supabase
        .from("vendor_categories")
        .select("vendor_id")
        .eq("vendor_id", vendorId)
        .eq("category_id", categoryId)
        .maybeSingle();

    if (error || !data) {
        throw badRequest("업체에 등록되지 않은 카테고리입니다.");
    }
}

export async function listPrices(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<{ items: VendorServicePrice[] }> {
    const admin = createSupabaseAdminClient();

    const rows = await listVendorServicePrices(admin, vendorId);

    if (rows.length === 0) {
        return { items: [] };
    }

    // batch fetch categories
    const categoryIds = [...new Set(rows.map((r) => r.category_id))];
    const { data: categoryRows } = await admin
        .from("categories")
        .select("*")
        .in("id", categoryIds);

    const categoryMap = new Map(
        (categoryRows ?? []).map((c) => [c.id, mapCategoryRow(c)]),
    );

    const items = rows.map((row) =>
        mapVendorServicePriceRow(row, categoryMap.get(row.category_id)),
    );

    return { items };
}

export async function createPrice(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
    body: { categoryId: string; price: number; dailyBudgetLimit?: number },
): Promise<VendorServicePrice> {
    const admin = createSupabaseAdminClient();

    // 카테고리가 업체에 등록되어 있는지 검증
    await validateCategoryBelongsToVendor(admin, vendorId, body.categoryId);

    // 이미 active 단가가 있는지 확인
    const { data: existing } = await admin
        .from("vendor_service_prices")
        .select("id")
        .eq("vendor_id", vendorId)
        .eq("category_id", body.categoryId)
        .eq("status", "active")
        .maybeSingle();

    if (existing) {
        throw conflict("해당 카테고리에 이미 단가가 설정되어 있습니다.");
    }

    const row = await createVendorServicePrice(admin, {
        vendorId,
        categoryId: body.categoryId,
        price: body.price,
        dailyBudgetLimit: body.dailyBudgetLimit,
    });

    // fetch category for response
    const { data: catRow } = await admin
        .from("categories")
        .select("*")
        .eq("id", row.category_id)
        .single();

    return mapVendorServicePriceRow(
        row,
        catRow ? mapCategoryRow(catRow) : undefined,
    );
}

export async function updatePrice(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
    priceId: string,
    body: { price?: number; dailyBudgetLimit?: number | null },
): Promise<VendorServicePrice> {
    const admin = createSupabaseAdminClient();

    const existing = await getVendorServicePriceById(admin, priceId);
    if (!existing) {
        throw notFound("서비스 단가를 찾을 수 없습니다.");
    }
    if (existing.vendor_id !== vendorId) {
        throw forbidden("해당 단가에 대한 권한이 없습니다.");
    }
    if (existing.status !== "active") {
        throw badRequest("삭제된 단가는 수정할 수 없습니다.");
    }

    const row = await updateVendorServicePrice(admin, priceId, body);

    const { data: catRow } = await admin
        .from("categories")
        .select("*")
        .eq("id", row.category_id)
        .single();

    return mapVendorServicePriceRow(
        row,
        catRow ? mapCategoryRow(catRow) : undefined,
    );
}

export async function deletePrice(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
    priceId: string,
): Promise<VendorServicePrice> {
    const admin = createSupabaseAdminClient();

    const existing = await getVendorServicePriceById(admin, priceId);
    if (!existing) {
        throw notFound("서비스 단가를 찾을 수 없습니다.");
    }
    if (existing.vendor_id !== vendorId) {
        throw forbidden("해당 단가에 대한 권한이 없습니다.");
    }
    if (existing.status !== "active") {
        throw badRequest("이미 삭제된 단가입니다.");
    }

    const row = await archiveVendorServicePrice(admin, priceId);

    return mapVendorServicePriceRow(row);
}
