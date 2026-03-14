// ---------------------------------------------------------------------------
// Image asset path constants — keyed by category slug for easy lookup
// ---------------------------------------------------------------------------

/** Category icon images (56x56 render, 112x112 source) */
export const CATEGORY_ICON_PATHS: Record<string, string> = {
    "external-decoction": "/images/icons/categories/external-decoction.png",
    "medical-devices": "/images/icons/categories/medical-devices.png",
    interior: "/images/icons/categories/interior.png",
    signage: "/images/icons/categories/signage.png",
    emr: "/images/icons/categories/emr.png",
    marketing: "/images/icons/categories/marketing.png",
    "tax-labor": "/images/icons/categories/tax-labor.png",
    website: "/images/icons/categories/website.png",
    "herb-pharma": "/images/icons/categories/herb-pharma.png",
};

/** Category page header background images */
export const CATEGORY_BG_PATHS: Record<string, string> = {
    "external-decoction": "/images/categories/bg-external-decoction.webp",
    "medical-devices": "/images/categories/bg-medical-devices.webp",
    interior: "/images/categories/bg-interior.webp",
    signage: "/images/categories/bg-signage.webp",
    emr: "/images/categories/bg-emr.webp",
    marketing: "/images/categories/bg-marketing.webp",
    "tax-labor": "/images/categories/bg-tax-labor.webp",
    website: "/images/categories/bg-website.webp",
    "herb-pharma": "/images/categories/bg-herb-pharma.webp",
};

/** Vendor default thumbnail images (fallback when vendor has no upload) */
export const VENDOR_DEFAULT_THUMBNAILS: Record<string, string> = {
    "external-decoction": "/images/vendors/defaults/default-external-decoction.webp",
    "medical-devices": "/images/vendors/defaults/default-medical-devices.webp",
    interior: "/images/vendors/defaults/default-interior.webp",
    signage: "/images/vendors/defaults/default-signage.webp",
    emr: "/images/vendors/defaults/default-emr.webp",
    marketing: "/images/vendors/defaults/default-marketing.webp",
    "tax-labor": "/images/vendors/defaults/default-tax-labor.webp",
    website: "/images/vendors/defaults/default-website.webp",
    "herb-pharma": "/images/vendors/defaults/default-herb-pharma.webp",
};

/** Empty state illustration paths */
export const EMPTY_ILLUSTRATIONS = {
    search: "/images/empty/empty-search.svg",
    review: "/images/empty/empty-review.svg",
    portfolio: "/images/empty/empty-portfolio.svg",
    lead: "/images/empty/empty-lead.svg",
    data: "/images/empty/empty-data.svg",
    favorite: "/images/empty/empty-favorite.svg",
} as const;

/** Hero banner images (ordered by slide index) */
export const HERO_BANNER_IMAGES: string[] = [
    "/images/hero/hero-opening.webp",
    "/images/hero/hero-decoction.webp",
    "/images/hero/hero-devices.webp",
];
