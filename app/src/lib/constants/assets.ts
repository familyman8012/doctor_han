// ---------------------------------------------------------------------------
// Image asset path constants — keyed by category slug for easy lookup
// ---------------------------------------------------------------------------

/** Category icon images (56x56 render, 112x112 source) */
export const CATEGORY_ICON_PATHS: Record<string, string> = {
    "external-decoction-herbal": "/images/icons/categories/external-decoction.png",
    "external-decoction-pharma": "/images/icons/categories/external-decoction.png",
    "herbal-materials": "/images/icons/categories/herbal-materials.png",
    "medical-devices": "/images/icons/categories/medical-devices.png",
    "opening-consulting": "/images/icons/categories/opening-consulting.png",
    marketing: "/images/icons/categories/marketing.png",
    interior: "/images/icons/categories/interior.png",
    signage: "/images/icons/categories/signage.png",
    design: "/images/icons/categories/design.png",
    "tax-law-labor": "/images/icons/categories/tax-law-labor.png",
    "decoction-equipment": "/images/icons/categories/decoction-equipment.png",
    "clothing-bedding": "/images/icons/categories/clothing-bedding.png",
    "hospital-management": "/images/icons/categories/hospital-management.png",
    "business-support": "/images/icons/categories/business-support.png",
    "education-academic": "/images/icons/categories/education-academic.png",
    life: "/images/icons/categories/life.png",
};

/** Category page header background images */
export const CATEGORY_BG_PATHS: Record<string, string> = {
    "external-decoction-herbal": "/images/categories/bg-external-decoction.webp",
    "external-decoction-pharma": "/images/categories/bg-external-decoction.webp",
    "herbal-materials": "/images/categories/bg-herbal-materials.webp",
    "medical-devices": "/images/categories/bg-medical-devices.webp",
    "opening-consulting": "/images/categories/bg-opening-consulting.webp",
    marketing: "/images/categories/bg-marketing.webp",
    interior: "/images/categories/bg-interior.webp",
    signage: "/images/categories/bg-signage.webp",
    design: "/images/categories/bg-design.webp",
    "tax-law-labor": "/images/categories/bg-tax-law-labor.webp",
    "decoction-equipment": "/images/categories/bg-decoction-equipment.webp",
    "clothing-bedding": "/images/categories/bg-clothing-bedding.webp",
    "hospital-management": "/images/categories/bg-hospital-management.webp",
    "business-support": "/images/categories/bg-business-support.webp",
    "education-academic": "/images/categories/bg-education-academic.webp",
    life: "/images/categories/bg-life.webp",
};

/** Vendor default thumbnail images (fallback when vendor has no upload) */
export const VENDOR_DEFAULT_THUMBNAILS: Record<string, string> = {
    "external-decoction-herbal": "/images/vendors/defaults/default-external-decoction.webp",
    "external-decoction-pharma": "/images/vendors/defaults/default-external-decoction.webp",
    "herbal-materials": "/images/vendors/defaults/default-herbal-materials.webp",
    "medical-devices": "/images/vendors/defaults/default-medical-devices.webp",
    "opening-consulting": "/images/vendors/defaults/default-opening-consulting.webp",
    marketing: "/images/vendors/defaults/default-marketing.webp",
    interior: "/images/vendors/defaults/default-interior.webp",
    signage: "/images/vendors/defaults/default-signage.webp",
    design: "/images/vendors/defaults/default-design.webp",
    "tax-law-labor": "/images/vendors/defaults/default-tax-law-labor.webp",
    "decoction-equipment": "/images/vendors/defaults/default-decoction-equipment.webp",
    "clothing-bedding": "/images/vendors/defaults/default-clothing-bedding.webp",
    "hospital-management": "/images/vendors/defaults/default-hospital-management.webp",
    "business-support": "/images/vendors/defaults/default-business-support.webp",
    "education-academic": "/images/vendors/defaults/default-education-academic.webp",
    life: "/images/vendors/defaults/default-life.webp",
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
