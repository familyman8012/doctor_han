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
                    className="inline-flex items-center gap-1 border border-gray-300 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                    더보기 <ChevronRight className="w-3.5 h-3.5" />
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
