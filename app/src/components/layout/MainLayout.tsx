"use client";

import { useState, type ReactNode } from "react";
import { Header } from "./Header";
import { CategoryNav } from "./CategoryNav";
import { MobileMenu } from "./MobileMenu";

interface MainLayoutProps {
    children: ReactNode;
    showCategoryNav?: boolean;
}

export function MainLayout({ children, showCategoryNav = true }: MainLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMobileMenuOpen={isMobileMenuOpen}
            />
            {showCategoryNav && <CategoryNav />}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>
        </div>
    );
}
