"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/components/utils";

interface SimplePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function SimplePagination({ currentPage, totalPages, onPageChange }: SimplePaginationProps) {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages: (number | "...")[] = [];
        const delta = 2;
        const left = Math.max(2, currentPage - delta);
        const right = Math.min(totalPages - 1, currentPage + delta);

        pages.push(1);

        if (left > 2) {
            pages.push("...");
        }

        for (let i = left; i <= right; i++) {
            pages.push(i);
        }

        if (right < totalPages - 1) {
            pages.push("...");
        }

        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg border transition-colors",
                    currentPage === 1
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {getVisiblePages().map((page, index) =>
                page === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className={cn(
                            "flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg border text-sm font-medium transition-colors",
                            page === currentPage
                                ? "border-[#0a3b41] bg-[#0a3b41] text-white"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg border transition-colors",
                    currentPage === totalPages
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
