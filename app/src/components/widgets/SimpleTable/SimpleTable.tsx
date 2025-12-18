"use client";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { cn } from "@/components/utils";

export interface SimpleTableProps {
    columns: string[];
    data: Array<Array<React.ReactNode>>;
    caption?: string;
    /**
     * Max height for the scrollable tbody area. Accepts px number or any CSS length value.
     */
    maxBodyHeight?: number | string;
    /**
     * Enable column resizing
     */
    resizable?: boolean;
    /**
     * Minimum width for columns when resizing (in pixels)
     */
    minColumnWidth?: number;
    /**
     * Initial column widths (in pixels). If not provided, columns will be equally sized.
     */
    initialColumnWidths?: number[];
    /**
     * Enable cell editing (first column is always read-only)
     */
    editable?: boolean;
    /**
     * Callback when cell value changes
     */
    onCellChange?: (rowIndex: number, cellIndex: number, newValue: string) => void;
    /**
     * Enable row selection with checkboxes in first column
     */
    selectable?: boolean;
    /**
     * Callback when row selection changes
     */
    onSelectionChange?: (selectedRows: number[]) => void;
}

const SimpleTable: React.FC<SimpleTableProps> = ({
    columns,
    data,
    caption,
    maxBodyHeight = "24rem",
    resizable = false,
    minColumnWidth = 50,
    initialColumnWidths,
    editable = false,
    onCellChange,
    selectable = false,
    onSelectionChange,
}) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const [columnWidths, setColumnWidths] = useState<number[]>([]);
    const [isResizing, setIsResizing] = useState(false);
    const [resizingIndex, setResizingIndex] = useState<number | null>(null);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [tableData, setTableData] = useState(data);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [isIndeterminate, setIsIndeterminate] = useState(false);

    // Update tableData when data prop changes
    useEffect(() => {
        setTableData(data);
    }, [data]);

    // Initialize column widths
    useEffect(() => {
        if (columns.length === 0) return;

        const totalColumns = selectable ? columns.length + 1 : columns.length;

        if (initialColumnWidths && initialColumnWidths.length === totalColumns) {
            setColumnWidths(initialColumnWidths);
        } else if (tableRef.current) {
            const tableWidth = tableRef.current.offsetWidth;
            if (selectable) {
                // Fixed width for checkbox column
                const checkboxWidth = 50;
                const remainingWidth = tableWidth - checkboxWidth;
                const defaultWidth = remainingWidth / columns.length;
                setColumnWidths([checkboxWidth, ...new Array(columns.length).fill(defaultWidth)]);
            } else {
                const defaultWidth = tableWidth / columns.length;
                setColumnWidths(new Array(columns.length).fill(defaultWidth));
            }
        }
    }, [columns, initialColumnWidths, selectable]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent, index: number) => {
            e.preventDefault();
            setIsResizing(true);
            setResizingIndex(index);
            setStartX(e.clientX);
            setStartWidth(columnWidths[index]);
        },
        [columnWidths],
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isResizing || resizingIndex === null) return;

            const diff = e.clientX - startX;
            const newWidth = Math.max(minColumnWidth, startWidth + diff);

            setColumnWidths((prev) => {
                const newWidths = [...prev];
                newWidths[resizingIndex] = newWidth;
                return newWidths;
            });
        },
        [isResizing, resizingIndex, startX, startWidth, minColumnWidth],
    );

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        setResizingIndex(null);
    }, []);

    // Cell editing handlers
    const handleCellClick = useCallback(
        (rowIndex: number, cellIndex: number) => {
            // Skip if not editable
            if (!editable) return;

            // Skip checkbox column and ID column
            const skipColumns = selectable ? 2 : 1;
            if (cellIndex < skipColumns) return;

            // Adjust index for actual data column
            const dataIndex = selectable ? cellIndex - 1 : cellIndex;
            const currentValue = String(tableData[rowIndex][dataIndex] ?? "");
            setEditingCell({ row: rowIndex, col: cellIndex });
            setEditValue(currentValue);
        },
        [editable, tableData, selectable],
    );

    const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
    }, []);

    const handleEditComplete = useCallback(() => {
        if (!editingCell) return;

        const dataIndex = selectable ? editingCell.col - 1 : editingCell.col;
        const newData = [...tableData];
        newData[editingCell.row] = [...newData[editingCell.row]];
        newData[editingCell.row][dataIndex] = editValue;

        setTableData(newData);
        onCellChange?.(editingCell.row, dataIndex, editValue);
        setEditingCell(null);
        setEditValue("");
    }, [editingCell, editValue, tableData, onCellChange, selectable]);

    const handleEditKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleEditComplete();
            } else if (e.key === "Escape") {
                e.preventDefault();
                setEditingCell(null);
                setEditValue("");
            }
        },
        [handleEditComplete],
    );

    const handleEditBlur = useCallback(() => {
        handleEditComplete();
    }, [handleEditComplete]);

    // Selection handlers
    const handleSelectAll = useCallback(() => {
        if (isAllSelected || isIndeterminate) {
            setSelectedRows(new Set());
            setIsAllSelected(false);
            setIsIndeterminate(false);
        } else {
            const allIndices = tableData.map((_, index) => index);
            setSelectedRows(new Set(allIndices));
            setIsAllSelected(true);
            setIsIndeterminate(false);
        }
    }, [isAllSelected, isIndeterminate, tableData]);

    const handleSelectRow = useCallback(
        (rowIndex: number) => {
            const newSelected = new Set(selectedRows);
            if (newSelected.has(rowIndex)) {
                newSelected.delete(rowIndex);
            } else {
                newSelected.add(rowIndex);
            }
            setSelectedRows(newSelected);

            // Update all/indeterminate state
            if (newSelected.size === 0) {
                setIsAllSelected(false);
                setIsIndeterminate(false);
            } else if (newSelected.size === tableData.length) {
                setIsAllSelected(true);
                setIsIndeterminate(false);
            } else {
                setIsAllSelected(false);
                setIsIndeterminate(true);
            }
        },
        [selectedRows, tableData.length],
    );

    // Notify parent of selection changes
    useEffect(() => {
        if (selectable && onSelectionChange) {
            onSelectionChange(Array.from(selectedRows).sort());
        }
    }, [selectedRows, selectable, onSelectionChange]);

    // Add global mouse event listeners when resizing
    useEffect(() => {
        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            // Prevent text selection while resizing
            document.body.style.userSelect = "none";
            document.body.style.cursor = "col-resize";
        } else {
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    if (columns.length === 0) {
        return null;
    }

    const resolvedMaxHeight = typeof maxBodyHeight === "number" ? `${maxBodyHeight}px` : maxBodyHeight;

    return (
        <div className="overflow-y-auto" style={{ maxHeight: resolvedMaxHeight }}>
            <table ref={tableRef} className="w-full table-fixed border-collapse text-xs">
                {caption ? (
                    <caption className="text-left text-sm font-medium text-gray-700 px-3 py-2">{caption}</caption>
                ) : null}
                <thead>
                    <tr>
                        {selectable && (
                            <th
                                className="sticky top-0 z-20 border border-gray-200 bg-gray-50 px-3 py-2 text-center text-xs font-semibold text-gray-700"
                                style={columnWidths.length > 0 ? { width: `${columnWidths[0]}px` } : { width: "50px" }}
                            >
                                <AllCheckboxHeader
                                    checked={isAllSelected}
                                    indeterminate={isIndeterminate}
                                    onChange={handleSelectAll}
                                    size="sm"
                                />
                            </th>
                        )}
                        {columns.map((column, index) => {
                            const colIndex = selectable ? index + 1 : index;
                            return (
                                <th
                                    key={column}
                                    className="sticky top-0 z-20 border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-700"
                                    style={
                                        columnWidths.length > 0 ? { width: `${columnWidths[colIndex]}px` } : undefined
                                    }
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="truncate">{column}</span>
                                        {resizable && index < columns.length - 1 && (
                                            <div
                                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 group"
                                                onMouseDown={(e) => handleMouseDown(e, colIndex)}
                                            >
                                                <div className="absolute right-0 top-0 h-full w-3 -translate-x-1/2" />
                                            </div>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            {selectable && (
                                <td
                                    className={`border-l border-r border-b border-gray-200 px-3 py-2 text-center align-middle ${
                                        rowIndex === 0 ? "" : "border-t"
                                    }`}
                                    style={
                                        columnWidths.length > 0 ? { width: `${columnWidths[0]}px` } : { width: "50px" }
                                    }
                                >
                                    <Checkbox
                                        checked={selectedRows.has(rowIndex)}
                                        onChange={() => handleSelectRow(rowIndex)}
                                        size="sm"
                                    />
                                </td>
                            )}
                            {row.map((cellContent, cellIndex) => {
                                const colIndex = selectable ? cellIndex + 1 : cellIndex;
                                const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                                const skipColumns = selectable ? 2 : 1;
                                const isEditable = editable && colIndex >= skipColumns;

                                return (
                                    <td
                                        key={`${rowIndex}-${cellIndex}`}
                                        className={`border-l border-r border-b border-gray-200 px-3 py-2 text-xs text-gray-600 align-top ${
                                            rowIndex === 0 ? "" : "border-t"
                                        } ${isEditable ? "cursor-pointer hover:bg-gray-100" : ""}`}
                                        style={
                                            columnWidths.length > 0
                                                ? { width: `${columnWidths[colIndex]}px` }
                                                : undefined
                                        }
                                        onClick={() => handleCellClick(rowIndex, colIndex)}
                                    >
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={handleEditChange}
                                                onKeyDown={handleEditKeyDown}
                                                onBlur={handleEditBlur}
                                                className="w-full px-1 py-0 text-xs border-0 outline-none bg-white focus:ring-1 focus:ring-blue-500 rounded"
                                            />
                                        ) : (
                                            <div className="truncate" title={String(cellContent ?? "")}>
                                                {cellContent ?? ""}
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Indeterminate 상태를 지원하는 전체 선택 체크박스
interface AllCheckboxHeaderProps {
    checked: boolean;
    indeterminate: boolean;
    onChange: () => void;
    size?: "sm" | "md";
}

const AllCheckboxHeader: React.FC<AllCheckboxHeaderProps> = ({ checked, indeterminate, onChange, size = "sm" }) => {
    const checkboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    return (
        <label className="flex items-center justify-center cursor-pointer">
            <input
                ref={checkboxRef}
                type="checkbox"
                checked={checked || indeterminate}
                onChange={onChange}
                className={cn(
                    "appearance-none bg-white bg-no-repeat bg-center bg-contain border rounded cursor-pointer transition-colors",
                    size === "sm" ? "w-4 h-4" : "w-6 h-6",
                    "border-input-checkbox-border",
                    "checked:border-input-checkbox-checked-border checked:bg-bg-input-checkbox",
                    !indeterminate &&
                        "checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMiAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgMS41TDQuNSA3LjY2NjY3TDEuNDE2NjcgNC41ODMzMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                )}
                style={{
                    ...(indeterminate && {
                        backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMiIgdmlld0JveD0iMCAwIDEyIDIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMiIgaGVpZ2h0PSIyIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=")`,
                        backgroundColor: "var(--color-bg-input-checkbox)",
                        borderColor: "var(--color-input-checkbox-checked-border)",
                    }),
                }}
            />
        </label>
    );
};

export default SimpleTable;
