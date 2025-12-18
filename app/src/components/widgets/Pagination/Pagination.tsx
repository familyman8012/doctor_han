"use client";

import { type FC, type KeyboardEvent, useState } from "react";
import PaginationLibrary from "react-js-pagination";

export interface PaginationProps {
    pageInfo: number[];
    totalCount: number;
    handlePageChange: (pageNumber: number) => void;
    showJumpTo?: boolean;
}

const caretLeft = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M15.1602 7.41L10.5802 12L15.1602 16.59L13.7502 18L7.75016 12L13.7502 6L15.1602 7.41Z" />
    </svg>
);

const caretRight = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" transform="rotate(180)">
        <path d="M15.1602 7.41L10.5802 12L15.1602 16.59L13.7502 18L7.75016 12L13.7502 6L15.1602 7.41Z" />
    </svg>
);

const Pagination: FC<PaginationProps> = ({ pageInfo, totalCount, handlePageChange, showJumpTo = false }) => {
    const [jumpToPage, setJumpToPage] = useState("");
    const totalPages = Math.ceil(totalCount / pageInfo[1]);

    const handleJumpToPage = () => {
        const pageNumber = parseInt(jumpToPage, 10);
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            handlePageChange(pageNumber);
            setJumpToPage("");
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleJumpToPage();
        }
    };

    const isOnlyOnePage = totalPages <= 1;

    return (
        <>
            <style jsx global>{`
        .pagination-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
        }

        .pagination-wrap.single-page {
          opacity: 0.3;
          pointer-events: none;
        }

        .pagination-wrap .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .pagination-wrap .page-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: 1px solid #e5e7eb;
          font-weight: 500;
          font-size: 12px;
          line-height: 1;
          border-radius: 6px;
          color: #0a3b41;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pagination-wrap .page-item:hover:not(.disabled):not(.active) {
          background-color: #f3f3f3;
          border-color: #0a3b41;
        }

        .pagination-wrap .page-item svg {
          width: 16px;
          height: 16px;
          color: currentColor;
        }

        .pagination-wrap .page-item.disabled {
          opacity: 0.5;
          background-color: #f3f4f6;
          border-color: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .pagination-wrap .page-item.disabled svg {
          fill: #9ca3af;
        }

        .pagination-wrap .page-item.active {
          background-color: #0a3b41;
          color: white;
          border: 2px solid #0a3b41;
          font-weight: 500;
        }

        .pagination-wrap .page-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: inherit;
          cursor: inherit;
        }

        .jump-to-page {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .jump-to-page label {
          font-size: 12px;
          color: #0a3b41;
        }

        .jump-to-page input {
          width: 3rem;
          height: 28px;
          padding: 0 0.5rem;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          text-align: center;
        }

        .jump-to-page input:focus {
          outline: none;
          border-color: transparent;
          box-shadow: 0 0 0 2px #62e3d5;
        }

        .jump-to-page button {
          padding: 0 0.75rem;
          height: 28px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          background-color: #62e3d5;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .jump-to-page button:hover {
          background-color: #4dd4c5;
        }

        .jump-to-page button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 12px;
          color: #5a6376;
        }
      `}</style>
            <div className={`pagination-wrap ${isOnlyOnePage ? "single-page" : ""}`}>
                <PaginationLibrary
                    activePage={pageInfo[0]}
                    itemsCountPerPage={pageInfo[1]}
                    totalItemsCount={totalCount}
                    prevPageText={caretLeft}
                    nextPageText={caretRight}
                    pageRangeDisplayed={5}
                    onChange={handlePageChange}
                    hideFirstLastPages
                    itemClass="page-item"
                    linkClass="page-link"
                    activeClass="active"
                />

                {showJumpTo && (
                    <div className="jump-to-page">
                        <label htmlFor="jump-page">Jump to:</label>
                        <input
                            id="jump-page"
                            type="text"
                            value={jumpToPage}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                    setJumpToPage(value);
                                } else if (/^\d+$/.test(value)) {
                                    const num = parseInt(value, 10);
                                    if (num <= totalPages) {
                                        setJumpToPage(value);
                                    }
                                }
                            }}
                            onKeyDown={handleKeyPress}
                            maxLength={3}
                        />
                        <span className="page-info">/ {totalPages}</span>
                        <button
                            onClick={handleJumpToPage}
                            disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
                        >
                            Go
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default Pagination;
