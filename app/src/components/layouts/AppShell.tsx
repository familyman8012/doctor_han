"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { SidebarProvider } from "ui/agent-ncos/sidebar";
import type { AppArea } from "@/lib/navigation/get-default-home-route";
import { useSidebarStore } from "@/stores/sidebarStore";
import ConfirmModal from "@/components/Modal/ConfirmModal";

interface AppShellProps {
    area: AppArea;
    sidebar?: ReactNode;
    headerLeft?: ReactNode;
    headerRight?: ReactNode;
    children: ReactNode;
    className?: string;
    sessionUserId?: string | null;
}

export function AppShell({
    area,
    sidebar,
    headerLeft: _,
    headerRight: __,
    children,
    className,
    sessionUserId,
}: AppShellProps) {
    void _;
    void __;
    const pathname = usePathname() ?? "/";
    const setLastPath = useSidebarStore((state) => state.setLastPath);
    const setCurrentUser = useSidebarStore((state) => state.setCurrentUser);

    useEffect(() => {
        if (!pathname) return;
        setLastPath(area, pathname);
    }, [area, pathname, setLastPath]);

    useEffect(() => {
        if (!sessionUserId) return;
        setCurrentUser(sessionUserId);
    }, [sessionUserId, setCurrentUser]);

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full overflow-hidden">
                {sidebar}
                <div className="flex h-screen min-h-0 flex-1 flex-col overflow-hidden bg-background">
                    <main className={className ?? "flex-1 min-h-0 overflow-auto p-6"}>{children}</main>
                    <ConfirmModal />
                </div>
            </div>
        </SidebarProvider>
    );
}
