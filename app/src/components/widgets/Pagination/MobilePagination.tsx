"use client";

import type { FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/components/utils";

export interface MobilePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (pageNumber: number) => void;
    className?: string;
}

const MobilePagination: FC<MobilePaginationProps> = ({ currentPage, totalPages, onPageChange, className }) => {
    const handlePrevClick = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNextClick = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const isPrevDisabled = currentPage === 1;
    const isNextDisabled = currentPage === totalPages;

    return (
        <div className={cn("flex items-center w-full", className)}>
            <button
                onClick={handlePrevClick}
                disabled={isPrevDisabled}
                className={cn(
                    "ml-8 text-gray-600 transition-opacity",
                    isPrevDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80",
                )}
                aria-label="Previous page"
            >
                <ChevronLeft size={24} />
            </button>

            <div className="flex justify-center flex-grow text-gray-600 select-none">
                <span className="font-medium">
                    {currentPage} / {totalPages}
                </span>
            </div>

            <button
                onClick={handleNextClick}
                disabled={isNextDisabled}
                className={cn(
                    "mr-8 text-gray-600 transition-opacity",
                    isNextDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80",
                )}
                aria-label="Next page"
            >
                <ChevronRight size={24} />
            </button>
        </div>
    );
};

export default MobilePagination;
