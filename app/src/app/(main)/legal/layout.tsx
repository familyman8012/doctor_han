import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
                {children}
            </div>
        </div>
    );
}
