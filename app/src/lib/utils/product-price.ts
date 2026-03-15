/**
 * 상품 가격 포맷 유틸리티.
 * priceType(fixed/range/negotiable/contact)에 따라 표시 문자열을 반환한다.
 */

interface PriceInfo {
    priceType: "fixed" | "range" | "negotiable" | "contact";
    priceMin?: number | null;
    priceMax?: number | null;
    priceUnit?: string | null;
}

export function formatProductPrice(info: PriceInfo): string {
    switch (info.priceType) {
        case "fixed":
            if (info.priceMin == null) return "-";
            return `${info.priceMin.toLocaleString()}원${info.priceUnit ? `/${info.priceUnit}` : ""}`;
        case "range":
            if (info.priceMin == null && info.priceMax == null) return "-";
            return `${info.priceMin?.toLocaleString() ?? "0"}~${info.priceMax?.toLocaleString() ?? "0"}원${info.priceUnit ? `/${info.priceUnit}` : ""}`;
        case "negotiable":
            return "가격 협의";
        case "contact":
            return "문의";
    }
}
