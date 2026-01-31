"use client";

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button/button";

interface MessageInputProps {
    onSend: (content: string) => void;
    isSending: boolean;
    disabled?: boolean;
    placeholder?: string;
}

export function MessageInput({ onSend, isSending, disabled, placeholder }: MessageInputProps) {
    const [content, setContent] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter로 전송, Shift+Enter로 줄바꿈
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        const trimmedContent = content.trim();
        if (!trimmedContent || isSending || disabled) return;

        onSend(trimmedContent);
        setContent("");

        // textarea 높이 리셋
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        // 자동 높이 조절
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    const canSend = !!content.trim() && !isSending && !disabled;

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            {/* 입력 영역 */}
            <div className="flex items-end gap-2">
                {/* 텍스트 입력 */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder ?? (disabled ? "종료된 문의입니다" : "메시지를 입력하세요...")}
                        disabled={disabled}
                        rows={1}
                        className="w-full px-4 py-2.5 bg-gray-100 border-0 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#62e3d5] text-sm placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ minHeight: "42px", maxHeight: "120px" }}
                    />
                </div>

                {/* 전송 버튼 */}
                <Button
                    onClick={handleSend}
                    disabled={!canSend}
                    isLoading={isSending}
                    size="sm"
                    className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                >
                    {!isSending && <Send className="w-4 h-4" />}
                </Button>
            </div>

            {!disabled && (
                <p className="text-xs text-gray-400 mt-2 text-center">Enter로 전송, Shift+Enter로 줄바꿈</p>
            )}
        </div>
    );
}
