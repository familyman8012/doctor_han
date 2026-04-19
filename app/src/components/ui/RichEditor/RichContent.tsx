"use client";

import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";

export interface RichContentProps {
    html: string;
    className?: string;
}

const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "strong",
        "em",
        "u",
        "s",
        "ul",
        "ol",
        "li",
        "blockquote",
        "a",
        "img",
        "br",
        "hr",
        "code",
        "pre",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class", "title"],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "form", "input", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick"],
};

export function RichContent({ html, className = "" }: RichContentProps) {
    const sanitized = useMemo(() => {
        if (!html) return "";
        // plain text가 들어오면 <p>로 감싸서 줄바꿈 보존
        const isHtml = /^\s*<[a-z]/i.test(html);
        const normalized = isHtml ? html : `<p>${html.replace(/\n/g, "<br>")}</p>`;
        return DOMPurify.sanitize(normalized, SANITIZE_CONFIG) as unknown as string;
    }, [html]);

    if (!sanitized) return null;

    return (
        <div
            className={`prose prose-sm sm:prose-base max-w-none prose-img:rounded-lg prose-a:text-primary [&_p:empty]:min-h-[1em] [&_p:empty]:before:content-['\\00a0'] ${className}`}
            // eslint-disable-next-line react/no-danger -- DOMPurify로 sanitize 완료
            dangerouslySetInnerHTML={{ __html: sanitized }}
        />
    );
}

/**
 * 서버에서도 안전하게 렌더링 가능한 정적 sanitize 함수.
 * 저장 시점에 한 번 더 sanitize하고 싶을 때 사용.
 */
export function sanitizeRichHtml(html: string): string {
    return DOMPurify.sanitize(html, SANITIZE_CONFIG) as unknown as string;
}
