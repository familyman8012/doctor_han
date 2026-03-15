"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ProductFaq } from "@/lib/schema/product";
import { cn } from "@/components/utils";

interface ProductFaqSectionProps {
    faqs: ProductFaq[];
}

export function ProductFaqSection({ faqs }: ProductFaqSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const sortedFaqs = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <section>
            <h2 className="text-lg font-bold text-content-primary mb-4">자주 묻는 질문</h2>
            <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
                {sortedFaqs.map((faq, idx) => (
                    <div key={faq.id}>
                        <button
                            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                        >
                            <span className="font-medium text-content-primary pr-4">
                                Q. {faq.question}
                            </span>
                            <ChevronDown
                                className={cn(
                                    "w-5 h-5 text-gray-400 shrink-0 transition-transform",
                                    openIndex === idx && "rotate-180"
                                )}
                            />
                        </button>
                        {openIndex === idx && (
                            <div className="px-5 pb-4 text-sm text-gray-600 whitespace-pre-wrap">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
