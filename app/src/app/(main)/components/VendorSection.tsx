"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HomeVendorCarouselSection } from "@/lib/schema/home";
import { VendorCard } from "@/components/widgets/VendorCard";

interface VendorSectionProps {
    section: HomeVendorCarouselSection;
    variant?: "carousel" | "grid";
}

export function VendorSection({ section, variant = "carousel" }: VendorSectionProps) {
    const viewAllHref = section.category ? `/categories/${section.category.slug}` : "/categories";
    const categorySlug = section.category?.slug;

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                <Link
                    href={viewAllHref}
                    className="text-sm text-gray-500 hover:text-content-primary flex items-center gap-1"
                >
                    더보기 <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {variant === "carousel" ? (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {section.items.map((vendor) => (
                        <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            variant="carousel"
                            categorySlug={categorySlug}
                            showFavoriteButton={false}
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {section.items.slice(0, 8).map((vendor) => (
                        <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            variant="grid"
                            categorySlug={categorySlug}
                            showFavoriteButton={false}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
