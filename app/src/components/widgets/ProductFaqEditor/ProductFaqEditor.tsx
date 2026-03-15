"use client";

import { useCallback } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, HelpCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────

export interface ProductFaqItem {
    localId: string;
    question: string;
    answer: string;
}

export interface ProductFaqEditorProps {
    value: ProductFaqItem[];
    onChange: (items: ProductFaqItem[]) => void;
    maxFaqs?: number;
    disabled?: boolean;
}

// ─── Component ───────────────────────────────────────────

export function ProductFaqEditor({
    value,
    onChange,
    maxFaqs = 30,
    disabled = false,
}: ProductFaqEditorProps) {
    const handleAdd = useCallback(() => {
        if (value.length >= maxFaqs) return;
        onChange([
            ...value,
            { localId: crypto.randomUUID(), question: "", answer: "" },
        ]);
    }, [value, onChange, maxFaqs]);

    const handleRemove = useCallback(
        (localId: string) => {
            onChange(value.filter((v) => v.localId !== localId));
        },
        [value, onChange],
    );

    const handleUpdate = useCallback(
        (localId: string, field: "question" | "answer", val: string) => {
            onChange(value.map((v) => (v.localId === localId ? { ...v, [field]: val } : v)));
        },
        [value, onChange],
    );

    const handleMove = useCallback(
        (localId: string, direction: "up" | "down") => {
            const idx = value.findIndex((v) => v.localId === localId);
            if (idx < 0) return;
            const newIdx = direction === "up" ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= value.length) return;

            const newItems = [...value];
            [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
            onChange(newItems);
        },
        [value, onChange],
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-content-primary">
                    자주 묻는 질문 (FAQ){" "}
                    <span className="text-gray-400 font-normal">({value.length}/{maxFaqs})</span>
                </label>
            </div>

            {value.length === 0 && !disabled && (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                    <HelpCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 mb-3">FAQ를 추가하면 고객의 문의를 줄일 수 있습니다.</p>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary-25 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        첫 FAQ 추가
                    </button>
                </div>
            )}

            {value.map((item, idx) => (
                <div
                    key={item.localId}
                    className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
                >
                    <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-gray-400 mt-2">Q{idx + 1}</span>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={item.question}
                                onChange={(e) => handleUpdate(item.localId, "question", e.target.value)}
                                placeholder="질문을 입력하세요"
                                maxLength={500}
                                disabled={disabled}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50 disabled:text-gray-400"
                            />
                        </div>
                        {!disabled && (
                            <div className="flex items-center gap-0.5">
                                {idx > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleMove(item.localId, "up")}
                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="위로"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                )}
                                {idx < value.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleMove(item.localId, "down")}
                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="아래로"
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemove(item.localId)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    title="삭제"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-primary mt-2">A</span>
                        <textarea
                            value={item.answer}
                            onChange={(e) => handleUpdate(item.localId, "answer", e.target.value)}
                            placeholder="답변을 입력하세요"
                            maxLength={5000}
                            rows={3}
                            disabled={disabled}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y min-h-[60px] disabled:bg-gray-50 disabled:text-gray-400"
                        />
                    </div>
                </div>
            ))}

            {!disabled && value.length > 0 && value.length < maxFaqs && (
                <button
                    type="button"
                    onClick={handleAdd}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-primary hover:text-primary hover:bg-primary-25 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    FAQ 추가
                </button>
            )}
        </div>
    );
}
