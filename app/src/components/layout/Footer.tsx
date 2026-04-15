"use client";

import Link from "next/link";

const footerLinks = {
    서비스: [
        { label: "업체 찾기", href: "/categories" },
        { label: "카테고리", href: "/categories" },
        { label: "리뷰", href: "/categories" },
    ],
    고객지원: [
        { label: "고객센터", href: "/help" },
        { label: "자주 묻는 질문", href: "/help" },
        { label: "공지사항", href: "/help?tab=notice" },
        { label: "문의하기", href: "/help" },
    ],
    법적고지: [
        { label: "이용약관", href: "/legal/terms" },
        { label: "개인정보처리방침", href: "/legal/privacy" },
    ],
};

export function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* 4-column grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* 메디허브 소개 */}
                    <div className="col-span-2 md:col-span-1">
                        <h3 className="text-base font-bold text-gray-900 mb-3">메디허브</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            의료인과 업체를 연결하는
                            <br />
                            신뢰 기반 B2B 마켓플레이스
                        </p>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">{title}</h4>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-gray-500 hover:text-content-primary transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* 회사 정보 */}
                <div className="mt-10 pt-6 border-t border-gray-100">
                    <div className="text-xs text-gray-400 leading-relaxed space-y-1">
                        <p>
                            상호: [상호명] | 대표: [대표자명] | 사업자등록번호: [000-00-00000]
                        </p>
                        <p>
                            통신판매업신고: [제0000-서울강남-0000호] | 이메일: contact@medihub.kr
                        </p>
                        <p>주소: [서울특별시 강남구 테헤란로 000, 0층]</p>
                        <p className="mt-3">
                            &copy; {new Date().getFullYear()} 메디허브. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
