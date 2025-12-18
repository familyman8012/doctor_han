"use client";

import {
    type Column,
    type ColumnDef,
    type ColumnResizeMode,
    type ColumnSizingState,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    type OnChangeFn,
    type Row,
    type RowSelectionState,
    type SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import SkeletonTd from "@/components/Skeleton/SkeletonTd";
import { cn } from "@/components/utils";
import styles from "./TanstackTable.module.css";

export interface TanstackTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    /** 로딩 상태일 때 스켈레톤을 보여줍니다. */
    isLoading?: boolean;
    /** 원격 정렬 여부. true면 테이블은 정렬 상태만 넘겨줍니다. */
    manualSorting?: boolean;
    sorting?: SortingState;
    onSortingChange?: OnChangeFn<SortingState>;
    /** 행 선택을 사용할지 여부. */
    enableRowSelection?: boolean;
    rowSelection?: RowSelectionState;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;
    getRowId?: (originalRow: TData, index: number) => string;
    /** 데이터가 없을 때 보여줄 노드. */
    emptyState?: ReactNode;
    /** 테이블 높이 제한. */
    maxHeight?: number | string;
    /** 헤더를 sticky로 유지할지 여부. */
    stickyHeader?: boolean;
    /** 컬럼 리사이즈 모드 */
    columnResizeMode?: ColumnResizeMode;
    /** 테이블 리사이즈 모드: fixed(고정 너비) 또는 scrollable(가로 스크롤) */
    resizeMode?: "fixed" | "scrollable";
    className?: string;
    /** 행 클릭 시 호출되는 콜백 */
    onRowClick?: (row: Row<TData>, event: React.MouseEvent<HTMLTableRowElement>) => void;
}

type ColumnMetaConfig = {
    align?: "left" | "center" | "right";
    headerClassName?: string;
    cellClassName?: string;
    fixedWidth?: boolean | number;
    disableTruncate?: boolean;
};

export function TanstackTable<TData>({
    data,
    columns,
    isLoading,
    manualSorting = false,
    sorting,
    onSortingChange,
    enableRowSelection,
    rowSelection,
    onRowSelectionChange,
    getRowId,
    emptyState,
    maxHeight,
    stickyHeader = true,
    columnResizeMode = "onChange",
    resizeMode = "fixed",
    className,
    onRowClick,
}: TanstackTableProps<TData>) {
    const [internalSorting, setInternalSorting] = useState<SortingState>(sorting ?? []);
    const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>(rowSelection ?? {});
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

    useEffect(() => {
        if (sorting) {
            setInternalSorting(sorting);
        }
    }, [sorting]);

    useEffect(() => {
        if (rowSelection) {
            setInternalRowSelection(rowSelection);
        }
    }, [rowSelection]);

    const resolvedSorting = sorting ?? internalSorting;
    const resolvedRowSelection = rowSelection ?? internalRowSelection;

    const handleSortingChange = useCallback<OnChangeFn<SortingState>>(
        (updater) => {
            const next = typeof updater === "function" ? updater(resolvedSorting) : updater;
            if (onSortingChange) {
                onSortingChange(next);
            } else {
                setInternalSorting(next);
            }
        },
        [onSortingChange, resolvedSorting],
    );

    const handleRowSelectionChange = useCallback<OnChangeFn<RowSelectionState>>(
        (updater) => {
            const next = typeof updater === "function" ? updater(resolvedRowSelection) : updater;
            if (onRowSelectionChange) {
                onRowSelectionChange(next);
            } else {
                setInternalRowSelection(next);
            }
        },
        [onRowSelectionChange, resolvedRowSelection],
    );

    const table = useReactTable({
        data,
        columns,
        enableSorting: true,
        manualSorting,
        state: {
            sorting: resolvedSorting,
            rowSelection: resolvedRowSelection,
            columnSizing,
        },
        columnResizeMode,
        onSortingChange: handleSortingChange,
        enableRowSelection,
        onRowSelectionChange: handleRowSelectionChange,
        getRowId,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
        onColumnSizingChange: setColumnSizing,
        // 데이터 변경 시 자동 페이지 리셋 방지 (무한 루프 방지)
        autoResetPageIndex: false,
    });

    const headerGroups = table.getHeaderGroups();
    const rowModel = table.getRowModel();
    const visibleColumns = table.getVisibleLeafColumns();
    const totalColumnSize = table.getTotalSize();

    const resolveColumnWidth = useCallback(
        (column: Column<TData, unknown>) => {
            const meta = column.columnDef.meta as ColumnMetaConfig | undefined;
            if (meta?.fixedWidth) {
                const pixelWidth = typeof meta.fixedWidth === "number" ? meta.fixedWidth : column.getSize();
                return `${pixelWidth}px`;
            }

            if (resizeMode === "scrollable") {
                return `${column.getSize()}px`;
            }

            const size = column.getSize();
            if (!totalColumnSize) {
                return undefined;
            }

            const percent = (size / totalColumnSize) * 100;
            return `${percent}%`;
        },
        [totalColumnSize, resizeMode],
    );

    const resolveColumnBounds = useCallback((column: Column<TData, unknown>) => {
        const { minSize, maxSize } = column.columnDef;
        return {
            minWidth: typeof minSize === "number" ? minSize : undefined,
            maxWidth: typeof maxSize === "number" && Number.isFinite(maxSize) ? maxSize : undefined,
        };
    }, []);

    const renderSortIcon = (columnId: string) => {
        const column = table.getColumn(columnId);
        if (!column || !column.getCanSort()) return null;
        const sorted = column.getIsSorted();
        if (!sorted) {
            return <ChevronsUpDown className="h-3.5 w-3.5 text-[#9aa6a8]" />;
        }
        if (sorted === "asc") {
            return <ChevronUp className="h-3.5 w-3.5 text-[#0a3b41]" />;
        }
        return <ChevronDown className="h-3.5 w-3.5 text-[#0a3b41]" />;
    };

    if (isLoading) {
        const tableContent = (
            <table
                className={cn(resizeMode === "fixed" ? "w-full table-fixed" : "w-auto")}
                style={{
                    width:
                        resizeMode === "fixed"
                            ? "100%"
                            : resizeMode === "scrollable" && totalColumnSize > 0
                                ? `${totalColumnSize}px`
                                : undefined,
                    minWidth: resizeMode === "scrollable" ? "100%" : undefined,
                }}
            >
                <thead className={cn(stickyHeader && "sticky top-0 z-10 bg-gray-50")}>
                    {headerGroups.map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const meta = header.column.columnDef.meta as ColumnMetaConfig | undefined;
                                const align = meta?.align ?? "left";
                                const headerClasses = cn(
                                    "group relative px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5f6b6d] align-middle bg-gray-50",
                                    align === "center" && "text-center",
                                    align === "right" && "text-right",
                                    meta?.headerClassName,
                                );

                                return (
                                    <th
                                        key={header.id}
                                        className={headerClasses}
                                        style={{
                                            width: resolveColumnWidth(header.column),
                                            ...resolveColumnBounds(header.column),
                                        }}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    <SkeletonTd rowLengtd={10} colLengtd={visibleColumns.length} />
                </tbody>
            </table>
        );

        const scrollableContent =
            resizeMode === "scrollable" ? (
                <SimpleBar
                    className={styles.simpleBar}
                    style={maxHeight ? { maxHeight } : undefined}
                    autoHide={false}
                >
                    {tableContent}
                </SimpleBar>
            ) : (
                <div
                    className={cn("relative", maxHeight ? "overflow-auto" : undefined)}
                    style={maxHeight ? { maxHeight } : undefined}
                >
                    {tableContent}
                </div>
            );

        return (
            <div className={cn("rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden", className)}>
                {scrollableContent}
            </div>
        );
    }

    const tableContent = (
        <table
            className={cn(resizeMode === "fixed" ? "w-full table-fixed" : "w-auto")}
            style={{
                width:
                    resizeMode === "fixed"
                        ? "100%"
                        : resizeMode === "scrollable" && totalColumnSize > 0
                            ? `${totalColumnSize}px`
                            : undefined,
                minWidth: resizeMode === "scrollable" ? "100%" : undefined,
            }}
        >
            <thead className={cn(stickyHeader && "sticky top-0 z-10 bg-gray-50")}>
                {headerGroups.map((headerGroup) => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                            const canSort = header.column.getCanSort();
                            const canResize = header.column.getCanResize();
                            const meta = header.column.columnDef.meta as ColumnMetaConfig | undefined;
                            const align = meta?.align ?? "left";
                            const sortIcon = renderSortIcon(header.column.id);
                            const isSorted = header.column.getIsSorted();
                            const isResizing = header.column.getIsResizing();
                            const headerClasses = cn(
                                "group relative px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5f6b6d] align-middle bg-gray-50",
                                align === "center" && "text-center",
                                align === "right" && "text-right",
                                canSort && "cursor-pointer select-none",
                                meta?.headerClassName,
                            );

                            return (
                                <th
                                    key={header.id}
                                    className={headerClasses}
                                    style={{
                                        width: resolveColumnWidth(header.column),
                                        ...resolveColumnBounds(header.column),
                                    }}
                                >
                                    {header.isPlaceholder ? null : (
                                        <div
                                            className={cn(
                                                "flex min-w-0 items-center gap-2",
                                                align === "center"
                                                    ? "justify-center text-center"
                                                    : align === "right"
                                                        ? "justify-end text-right"
                                                        : "justify-start text-left",
                                                canSort && "hover:text-[#0a3b41]",
                                            )}
                                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                        >
                                            <span
                                                className={cn(
                                                    "min-w-0 truncate",
                                                    align === "center" ? "text-center" : "flex-1",
                                                    align === "right" && "text-right",
                                                )}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </span>
                                            {sortIcon ? (
                                                <span
                                                    className={cn(
                                                        "shrink-0 transition-opacity",
                                                        isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                                    )}
                                                >
                                                    {sortIcon}
                                                </span>
                                            ) : null}
                                        </div>
                                    )}
                                    {canResize && (
                                        <div
                                            onMouseDown={header.getResizeHandler()}
                                            onTouchStart={header.getResizeHandler()}
                                            className={cn(
                                                "absolute inset-y-1 right-0 flex w-3 select-none items-center justify-center",
                                                styles.resizeHandle,
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "pointer-events-none block w-[2px] rounded-full bg-[#dbe5e7] transition-all duration-150",
                                                    isResizing ? "bg-[#0a3b41] opacity-100" : "opacity-0",
                                                    styles.resizeHandleBar,
                                                )}
                                                style={{ height: "60%" }}
                                                aria-hidden="true"
                                            />
                                        </div>
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                ))}
            </thead>
            <tbody>
                {rowModel.rows.length === 0 ? (
                    <tr>
                        <td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-sm text-[#5f6b6d]">
                            {emptyState ?? "표시할 데이터가 없습니다."}
                        </td>
                    </tr>
                ) : (
                    rowModel.rows.map((row) => (
                        <tr
                            key={row.id}
                            className={cn("border-b border-gray-100 hover:bg-gray-50/70", onRowClick && "cursor-pointer")}
                            onClick={onRowClick ? (event) => onRowClick(row, event) : undefined}
                        >
                            {row.getVisibleCells().map((cell) => {
                                const cellMeta = cell.column.columnDef.meta as ColumnMetaConfig | undefined;

                                return (
                                    <td
                                        key={cell.id}
                                        className={cn(
                                            "px-4 py-3 align-middle text-left",
                                            cellMeta?.align === "center" && "text-center",
                                            cellMeta?.align === "right" && "text-right",
                                            cellMeta?.cellClassName,
                                        )}
                                        style={{
                                            width: resolveColumnWidth(cell.column),
                                            ...resolveColumnBounds(cell.column),
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                cellMeta?.disableTruncate !== true && styles.cellContent,
                                            )}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );

    const scrollableContent =
        resizeMode === "scrollable" ? (
            <SimpleBar
                className={styles.simpleBar}
                style={maxHeight ? { maxHeight } : undefined}
                autoHide={false}
            >
                {tableContent}
            </SimpleBar>
        ) : (
            <div
                className={cn("relative", maxHeight ? "overflow-auto" : undefined)}
                style={maxHeight ? { maxHeight } : undefined}
            >
                {tableContent}
            </div>
        );

    return (
        <div className={cn("rounded-xl border border-gray-100 bg-white shadow-sm", className)}>
            {scrollableContent}
        </div>
    );
}

export default TanstackTable;
