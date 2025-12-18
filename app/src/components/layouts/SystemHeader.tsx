"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils";
import { SystemSwitcher } from "./system-switcher";
import type { AppArea } from "@/lib/navigation/get-default-home-route";

interface SystemHeaderProps {
    area: AppArea;
    leftSlot?: ReactNode;
    rightSlot?: ReactNode;
}

export function SystemHeader({ area, leftSlot, rightSlot }: SystemHeaderProps) {
    const currentArea = area;

    return (
        <header
            className={cn(
                "sticky top-0 z-20 flex h-14 items-center border-b px-6",
                area === "rms" ? "bg-[#f4f7fa] text-slate-700" : "bg-background"
            )}
        >
            <div className="flex flex-1 items-center gap-4">
                {leftSlot ? <div className="flex items-center gap-3">{leftSlot}</div> : null}
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                    {rightSlot}
                    <SystemSwitcher currentArea={currentArea} />
                </div>
            </div>
        </header>
    );
}
