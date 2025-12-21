"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import type { VendorPortfolio } from "@/lib/schema/vendor";

interface PortfolioSectionProps {
    portfolios: VendorPortfolio[];
}

export function PortfolioSection({ portfolios }: PortfolioSectionProps) {
    const [selectedPortfolio, setSelectedPortfolio] = useState<VendorPortfolio | null>(null);
    const [currentAssetIndex, setCurrentAssetIndex] = useState(0);

    if (portfolios.length === 0) {
        return null;
    }

    const handleNext = () => {
        if (!selectedPortfolio) return;
        setCurrentAssetIndex((prev) =>
            prev < selectedPortfolio.assets.length - 1 ? prev + 1 : 0
        );
    };

    const handlePrev = () => {
        if (!selectedPortfolio) return;
        setCurrentAssetIndex((prev) =>
            prev > 0 ? prev - 1 : selectedPortfolio.assets.length - 1
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#0a3b41] mb-4">포트폴리오</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {portfolios.map((portfolio) => (
                    <button
                        key={portfolio.id}
                        type="button"
                        onClick={() => {
                            setSelectedPortfolio(portfolio);
                            setCurrentAssetIndex(0);
                        }}
                        className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-[#62e3d5] transition-all"
                    >
                        {portfolio.assets[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={portfolio.assets[0].url}
                                alt={portfolio.title || "포트폴리오"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <ImageIcon className="w-8 h-8 text-gray-300" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <div className="w-full p-3">
                                <p className="text-sm font-medium text-white truncate">
                                    {portfolio.title || "포트폴리오"}
                                </p>
                                {portfolio.assets.length > 1 && (
                                    <p className="text-xs text-white/80">
                                        {portfolio.assets.length}장
                                    </p>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* 라이트박스 */}
            {selectedPortfolio && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
                    <button
                        type="button"
                        onClick={() => setSelectedPortfolio(null)}
                        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="relative max-w-4xl w-full mx-4">
                        {/* 이미지 */}
                        <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                            {selectedPortfolio.assets[currentAssetIndex]?.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={selectedPortfolio.assets[currentAssetIndex].url}
                                    alt={`${selectedPortfolio.title} - ${currentAssetIndex + 1}`}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <ImageIcon className="w-16 h-16 text-gray-600" />
                                </div>
                            )}
                        </div>

                        {/* 네비게이션 */}
                        {selectedPortfolio.assets.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        {/* 정보 */}
                        <div className="mt-4 text-center">
                            <h3 className="text-lg font-medium text-white">
                                {selectedPortfolio.title}
                            </h3>
                            {selectedPortfolio.description && (
                                <p className="text-sm text-gray-400 mt-1">
                                    {selectedPortfolio.description}
                                </p>
                            )}
                            {selectedPortfolio.assets.length > 1 && (
                                <p className="text-sm text-gray-500 mt-2">
                                    {currentAssetIndex + 1} / {selectedPortfolio.assets.length}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
