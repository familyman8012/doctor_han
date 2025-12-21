import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* 심플 헤더 */}
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link href="/" className="text-xl font-bold text-[#0a3b41]">
                            메디허브
                        </Link>
                    </div>
                </div>
            </header>

            {/* 컨텐츠 */}
            <main className="flex-1 flex items-center justify-center py-12 px-4">
                {children}
            </main>

            {/* 심플 푸터 */}
            <footer className="bg-white border-t border-gray-100 py-6">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                    © 2024 메디허브. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
