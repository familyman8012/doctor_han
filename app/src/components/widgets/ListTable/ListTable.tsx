"use client";

import type React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ListTableColumn<T> {
    key: string;
    header: string;
    width?: string;
    align?: "left" | "center" | "right";
    render?: (value: any, item: T, index: number) => React.ReactNode;
}

export interface ListTableProps<T = any> {
    columns: ListTableColumn<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    onRowClick?: (item: T, index: number) => void;
    rowClassName?: (item: T, index: number) => string;
    pagination?: {
        currentPage: number;
        totalPages: number;
        pageSize: number;
        totalItems: number;
        onPageChange: (page: number) => void;
    };
    showPaginationInfo?: boolean;
}

export function ListTable<T = any>({
    columns,
    data,
    loading = false,
    emptyMessage = "데이터가 없습니다",
    className = "",
    onRowClick,
    rowClassName,
    pagination,
    showPaginationInfo = true,
}: ListTableProps<T>) {
    const getAlignClass = (align?: string) => {
        switch (align) {
            case "center":
                return "text-center";
            case "right":
                return "text-right";
            default:
                return "text-left";
        }
    };

    const renderCellContent = (column: ListTableColumn<T>, item: T, index: number) => {
        const value = (item as any)[column.key];

        if (column.render) {
            return column.render(value, item, index);
        }

        return value;
    };

    const renderPaginationButtons = () => {
        if (!pagination) return null;

        const { currentPage, totalPages, onPageChange } = pagination;
        const maxVisible = 5;
        const halfVisible = Math.floor(maxVisible / 2);

        let startPage = Math.max(1, currentPage - halfVisible);
        const endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            page === currentPage
                                ? "text-white bg-[#0a3b41] border-2 border-[#0a3b41]"
                                : "text-[#0a3b41] bg-white border border-gray-200 hover:border-[#0a3b41]"
                        }`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm text-[#0a3b41] bg-white border border-gray-200 hover:border-[#0a3b41] rounded-lg transition-colors disabled:opacity-50"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    };

    return (
        <div className={className}>
            {showPaginationInfo && pagination && (
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-[#5f6b6d]">
                        총 {pagination.totalItems}건 중 {(pagination.currentPage - 1) * pagination.pageSize + 1}-
                        {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} 표시
                    </span>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={`px-4 py-3 ${getAlignClass(column.align)}`}
                                        style={{ width: column.width }}
                                    >
                                        <span className="text-xs font-medium text-[#5f6b6d] uppercase tracking-wider">
                                            {column.header}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-12 text-center">
                                        <div className="text-sm text-[#5f6b6d]">로딩 중...</div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-12 text-center">
                                        <div className="text-sm text-[#5f6b6d]">{emptyMessage}</div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => (
                                    <tr
                                        key={index}
                                        onClick={() => onRowClick?.(item, index)}
                                        className={`hover:bg-gray-50 transition-colors ${
                                            onRowClick ? "cursor-pointer" : ""
                                        } ${rowClassName ? rowClassName(item, index) : ""}`}
                                    >
                                        {columns.map((column) => (
                                            <td key={column.key} className={`px-4 py-3 ${getAlignClass(column.align)}`}>
                                                <span className="text-sm text-[#0a3b41]">
                                                    {renderCellContent(column, item, index)}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination && <div className="flex justify-center mt-6">{renderPaginationButtons()}</div>}
        </div>
    );
}
