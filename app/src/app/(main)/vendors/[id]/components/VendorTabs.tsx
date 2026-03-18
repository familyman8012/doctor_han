"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { Tabs } from "@/components/ui/Tab/Tab";

interface TabSection {
    id: string;
    title: string;
    label?: string;
    content: ReactNode;
}

interface VendorTabsProps {
    sections: TabSection[];
}

export function VendorTabs({ sections }: VendorTabsProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isScrollingRef = useRef(false);

    // IntersectionObserver scroll spy
    useEffect(() => {
        const observers: IntersectionObserver[] = [];

        sectionRefs.current.forEach((el, index) => {
            if (!el) return;
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && !isScrollingRef.current) {
                        setActiveIndex(index);
                    }
                },
                { rootMargin: "-20% 0px -70% 0px" },
            );
            observer.observe(el);
            observers.push(observer);
        });

        return () => observers.forEach((o) => o.disconnect());
    }, [sections.length]);

    // Tab click -> scroll to section
    const handleTabChange = useCallback((index: number) => {
        isScrollingRef.current = true;
        setActiveIndex(index);

        const el = sectionRefs.current[index];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        // Reset scroll flag after animation
        setTimeout(() => {
            isScrollingRef.current = false;
        }, 1000);
    }, []);

    return (
        <div>
            {/* Sticky tab bar */}
            <div className="sticky top-[64px] z-30 bg-white border-b border-gray-200 -mx-4 px-4 lg:-mx-0 lg:px-0">
                <Tabs
                    id="vendor-detail-tabs"
                    tabs={sections.map((s) => ({ title: s.title, label: s.label }))}
                    activeTabIndex={activeIndex}
                    onTabChange={handleTabChange}
                />
            </div>

            {/* Section content */}
            <div className="space-y-8 pt-6">
                {sections.map((section, i) => (
                    <div
                        key={section.id}
                        id={section.id}
                        ref={(el) => {
                            sectionRefs.current[i] = el;
                        }}
                        className="scroll-mt-[120px]"
                    >
                        {section.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
