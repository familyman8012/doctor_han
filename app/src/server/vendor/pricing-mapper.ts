import type { Tables } from "@/lib/database.types";
import type { CategoryView } from "@/lib/schema/category";
import type { VendorServicePrice } from "@/lib/schema/vendor-pricing";

export type VendorServicePriceRow = Tables<"vendor_service_prices">;

export function mapVendorServicePriceRow(
    row: VendorServicePriceRow,
    category?: CategoryView,
): VendorServicePrice {
    return {
        id: row.id,
        vendorId: row.vendor_id,
        categoryId: row.category_id,
        price: row.price,
        dailyBudgetLimit: row.daily_budget_limit,
        status: row.status,
        ...(category ? { category } : {}),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
