"use client";

import { Bot, LayoutDashboard, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { useState } from "react";
import { Button } from "ui/agent-ncos/button";
import { type AppArea, getDefaultHomeRoute } from "@/lib/navigation/get-default-home-route";
import { signOut } from "@/server/auth/client";
import { useSidebarStore } from "@/stores/sidebarStore";
import { cn } from "@/utils";

type SystemDefinition = {
    area: AppArea;
    label: string;
    icon: ComponentType<{ className?: string }>;
};

export const SYSTEMS: SystemDefinition[] = [
    { area: "rms", label: "RMS", icon: LayoutDashboard },
    { area: "agent", label: "Agent", icon: Bot },
];

interface SystemSwitcherProps {
    currentArea: AppArea;
    variant?: "header" | "sidebar";
    isCollapsed?: boolean;
}

export function useSystemSwitch(currentArea: AppArea) {
    const router = useRouter();
    const lastPathByArea = useSidebarStore((state) => state.lastPathByArea);

    return (target: AppArea) => {
        if (target === currentArea) {
            return;
        }
        const targetPath =
            lastPathByArea[target] && lastPathByArea[target].length > 0
                ? lastPathByArea[target]
                : getDefaultHomeRoute(target);
        router.push(targetPath);
    };
}

export function SystemSwitcher({ currentArea, variant = "header", isCollapsed = false }: SystemSwitcherProps) {
    const handleSwitch = useSystemSwitch(currentArea);
    const isSidebarVariant = variant === "sidebar";

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1",
                isSidebarVariant ? "w-full" : "rounded-lg border border-border bg-card p-1",
            )}
        >
            {SYSTEMS.map(({ area, label, icon: Icon }) => {
                const isActive = area === currentArea;
                return (
                    <Button
                        key={area}
                        type="button"
                        variant={isActive ? "default" : "ghost"}
                        size={isSidebarVariant ? "sm" : "sm"}
                        className={cn(
                            "gap-2",
                            isSidebarVariant &&
                                cn(
                                    "flex-1 justify-center rounded-md border border-white/10 bg-transparent text-white/80 transition-colors",
                                    isActive
                                        ? "border-white/20 bg-white/10 text-white"
                                        : "hover:border-white/20 hover:bg-white/10 hover:text-white",
                                ),
                            isSidebarVariant && isCollapsed && "flex-none h-10 w-10 gap-0 border-none bg-transparent",
                        )}
                        aria-pressed={isActive}
                        aria-label={label}
                        onClick={() => handleSwitch(area)}
                    >
                        <Icon
                            className={cn("h-4 w-4", isSidebarVariant && isCollapsed ? "" : "flex-shrink-0")}
                            aria-hidden="true"
                        />
                        {(!isSidebarVariant || !isCollapsed) && (
                            <span className={cn("text-sm font-medium", isSidebarVariant ? "text-inherit" : undefined)}>
                                {label}
                            </span>
                        )}
                    </Button>
                );
            })}
        </div>
    );
}

interface SidebarSystemToggleProps {
    currentArea: AppArea;
    isCollapsed?: boolean;
    className?: string;
}

export function SidebarSystemToggle({ currentArea, isCollapsed = false, className }: SidebarSystemToggleProps) {
    const handleSwitch = useSystemSwitch(currentArea);
    const targetSystem = SYSTEMS.find((system) => system.area !== currentArea);

    if (!targetSystem) return null;

    const { area, label, icon: Icon } = targetSystem;

    return (
        <button
            type="button"
            onClick={() => handleSwitch(area)}
            className={cn(
                "flex items-center justify-center gap-2 rounded-lg border border-white/10 text-sm font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white",
                isCollapsed ? "h-10 w-10 px-0" : "px-3 py-2",
                className,
            )}
            aria-label={`${label}로 전환`}
        >
            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {!isCollapsed && <span>{label}</span>}
        </button>
    );
}

interface SidebarSystemActionsProps {
    currentArea: AppArea;
    isCollapsed?: boolean;
}

export function SidebarSystemActions({ currentArea, isCollapsed = false }: SidebarSystemActionsProps) {
    const [isSigningOut, setIsSigningOut] = useState(false);
    const resetSidebar = useSidebarStore((state) => state.resetAll);
    const router = useRouter();

    const handleSignOut = async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        try {
            resetSidebar();
            await signOut();
            router.push("/auth/signin");
        } catch (error) {
            console.error("Sidebar sign out failed:", error);
            router.push("/auth/signin");
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <div className={cn("flex items-center gap-2", isCollapsed ? "flex-col" : "flex-row")}>
            <SidebarSystemToggle
                currentArea={currentArea}
                isCollapsed={isCollapsed}
                className={cn(!isCollapsed && "flex-1")}
            />
            <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border border-white/10 text-sm font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60",
                    isCollapsed ? "h-10 w-10 px-0" : "px-3 py-2",
                )}
                aria-label="로그아웃"
            >
                <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {!isCollapsed && <span>로그아웃</span>}
            </button>
        </div>
    );
}
