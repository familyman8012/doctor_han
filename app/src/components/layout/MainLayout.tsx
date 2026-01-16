"use client";

import { useState, type ReactNode } from "react";
import { Header } from "./Header";
import { CategoryNav } from "./CategoryNav";
import { MobileMenu } from "./MobileMenu";
import { Footer } from "./Footer";

interface MainLayoutProps {
    children: ReactNode;
    showCategoryNav?: boolean;
}

export function MainLayout({ children, showCategoryNav = true }: MainLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header
                onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMobileMenuOpen={isMobileMenuOpen}
            />
            {showCategoryNav && <CategoryNav />}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                {children}
            </main>
            <Footer />
        </div>
    );
}
