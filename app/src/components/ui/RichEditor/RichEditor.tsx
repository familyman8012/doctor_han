"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Link as LinkIcon,
    Undo,
    Redo,
    Loader2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface RichEditorProps {
    value: string;
    onChange: (html: string) => void;
    onImageUpload: (file: File) => Promise<string>;
    placeholder?: string;
    className?: string;
    minHeight?: number;
    disabled?: boolean;
}

function ToolbarButton({
    onClick,
    isActive,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive ? "bg-primary-50 text-primary" : "text-gray-600"
            }`}
        >
            {children}
        </button>
    );
}

function Toolbar({
    editor,
    onImageClick,
    isUploadingImage,
}: {
    editor: Editor;
    onImageClick: () => void;
    isUploadingImage: boolean;
}) {
    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt("링크 URL을 입력하세요", previousUrl ?? "https://");
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    return (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-gray-200 bg-gray-50">
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive("heading", { level: 2 })}
                title="제목 (대)"
            >
                <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive("heading", { level: 3 })}
                title="제목 (소)"
            >
                <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                title="굵게"
            >
                <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                title="기울임"
            >
                <Italic className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
                title="글머리 기호"
            >
                <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
                title="번호 목록"
            >
                <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            <ToolbarButton
                onClick={onImageClick}
                disabled={isUploadingImage}
                title="이미지 삽입"
            >
                {isUploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <ImageIcon className="w-4 h-4" />
                )}
            </ToolbarButton>
            <ToolbarButton onClick={setLink} isActive={editor.isActive("link")} title="링크">
                <LinkIcon className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="실행 취소"
            >
                <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="다시 실행"
            >
                <Redo className="w-4 h-4" />
            </ToolbarButton>
        </div>
    );
}

export function RichEditor({
    value,
    onChange,
    onImageUpload,
    placeholder = "내용을 입력하세요",
    className = "",
    minHeight = 240,
    disabled = false,
}: RichEditorProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                HTMLAttributes: {
                    class: "rounded-lg max-w-full h-auto",
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-primary underline",
                    target: "_blank",
                    rel: "noopener noreferrer",
                },
            }),
            Placeholder.configure({ placeholder }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html === "<p></p>" ? "" : html);
        },
        editorProps: {
            attributes: {
                class: "tiptap-editor prose prose-sm max-w-none focus:outline-none px-4 py-3",
            },
        },
        immediatelyRender: false,
    });

    // 외부 value(폼 초기값 로드 등)와 에디터 content 동기화
    useEffect(() => {
        if (!editor) return;
        const current = editor.getHTML();
        const normalizedCurrent = current === "<p></p>" ? "" : current;
        if (value !== normalizedCurrent) {
            // plain text(줄바꿈 포함)는 <p>로 감싸서 로드
            const isHtml = /^\s*<[a-z]/i.test(value);
            const content = isHtml ? value : value ? `<p>${value.replace(/\n/g, "<br>")}</p>` : "";
            editor.commands.setContent(content, { emitUpdate: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- editor 이벤트 루프 피하기 위해 value만 감시
    }, [value, editor]);

    const handleImageFile = useCallback(
        async (file: File) => {
            if (!editor) return;
            if (!file.type.startsWith("image/")) {
                toast.error("이미지 파일만 업로드할 수 있습니다");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("5MB 이하의 이미지만 업로드할 수 있습니다");
                return;
            }
            setIsUploadingImage(true);
            try {
                const url = await onImageUpload(file);
                editor.chain().focus().setImage({ src: url }).run();
            } catch {
                toast.error("이미지 업로드에 실패했습니다");
            } finally {
                setIsUploadingImage(false);
            }
        },
        [editor, onImageUpload],
    );

    const handleImageClick = () => imageInputRef.current?.click();

    if (!editor) {
        return (
            <div
                className={`border border-gray-200 rounded-lg bg-white ${className}`}
                style={{ minHeight }}
            />
        );
    }

    return (
        <div
            className={`border border-gray-200 rounded-lg bg-white overflow-hidden ${className}`}
        >
            <Toolbar
                editor={editor}
                onImageClick={handleImageClick}
                isUploadingImage={isUploadingImage}
            />
            <div style={{ minHeight }}>
                <EditorContent editor={editor} />
            </div>
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                    if (imageInputRef.current) imageInputRef.current.value = "";
                }}
            />
        </div>
    );
}
