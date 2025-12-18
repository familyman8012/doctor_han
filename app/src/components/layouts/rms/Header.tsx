import type React from "react";

interface HeaderProps {
    title: string | React.ReactNode;
    subtitle?: string | React.ReactNode;
    actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
    return (
        <header className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-white">
            <div className="flex-1 min-w-0 mr-4">
                <h1 className="font-bold text-xl text-[#0a3b41] overflow-hidden text-ellipsis whitespace-nowrap">
                    {title}
                </h1>
                {subtitle && <p className="mt-0.5 text-xs">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
        </header>
    );
}
