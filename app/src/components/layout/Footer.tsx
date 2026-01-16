"use client";

import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} 메디허브
                    </span>
                    <div className="flex gap-6 text-sm">
                        <Link
                            href="/legal/terms"
                            className="text-gray-500 hover:text-[#0a3b41] transition-colors"
                        >
                            이용약관
                        </Link>
                        <Link
                            href="/legal/privacy"
                            className="text-gray-500 hover:text-[#0a3b41] transition-colors"
                        >
                            개인정보처리방침
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
