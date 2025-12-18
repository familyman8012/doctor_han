"use client";

import { ChevronDown, ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AuthGuardSession } from "@/components/auth/auth-guard";
import type { AppArea } from "@/lib/navigation/get-default-home-route";
import { getUserDisplayName, getUserInitials } from "@/lib/users/get-user-display-name";
import { useSession } from "@/server/auth/client";
import { useSidebarStore } from "@/stores/sidebarStore";
import { SidebarSystemActions } from "../system-switcher";
import { MENU_ITEMS, type SubMenuItem } from "./constants";
import { usePermissions } from "@/components/features/agents-ncos/providers/permission-provider";

const AREA: AppArea = "rms";

const SidebarLogo = ({ onToggle }: { onToggle: () => void }) => (
    <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <div className="flex gap-2 items-center overflow-hidden text-sm font-semibold text-white transition-opacity duration-200 group-[.collapsed]:w-0 group-[.collapsed]:opacity-0">
            <span>NextChapter</span> <span className="text-[10px] text-white/60">RMS</span>
        </div>

        <button onClick={onToggle} className="rounded p-1 transition-colors hover:bg-white/10" aria-label="사이드바 토글">
            <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-[.collapsed]:rotate-180" />
        </button>
    </div>
);

function SidebarUserInfo({ session }: { session?: AuthGuardSession | null }) {
    const { data: clientSession } = useSession();
    const effectiveSession = session ?? clientSession ?? null;
    const displayName = getUserDisplayName(effectiveSession?.user);
    const email = effectiveSession?.user?.email ?? "세션을 확인해주세요";
    const initials = getUserInitials(effectiveSession?.user);

    return (
        <div className="border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#62e3d5] text-xs font-semibold text-[#0a3b41]">
                    {initials}
                </div>
                <div className="opacity-100 transition-opacity duration-200 group-[.collapsed]:w-0 group-[.collapsed]:opacity-0">
                    <div className="text-sm font-medium text-white">{displayName}</div>
                    <div className="text-xs text-white/60" title={email}>
                        <span className="inline-block max-w-[140px] truncate align-top">{email}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function collectParentIds(pathname: string): string[] {
    const parents: string[] = [];

    for (const item of MENU_ITEMS) {
        if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
            parents.push(item.id);
        } else if (item.subItems?.some((sub) => pathname === sub.path || pathname.startsWith(`${sub.path}/`))) {
            parents.push(item.id);
        }
    }

    return parents;
}

interface SidebarNavProps {
    pathname: string;
    isCollapsed: boolean;
    expandedItems: string[];
    onToggle: (menuId: string) => void;
}

const SidebarNav = ({ pathname, isCollapsed, expandedItems, onToggle }: SidebarNavProps) => {
    const router = useRouter();
    const permissions = usePermissions();
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 메뉴 경로(path) -> PBAC 리소스 경로 매핑
    const PATH_TO_RESOURCE: Record<string, string> = {
        "/order-products": "app.menu.rms.order_products",
        "/supply-contracts": "app.menu.rms.supply_contracts",
        "/sales-order": "app.menu.rms.sales_orders",
        "/sales-order-templates": "app.menu.rms.sales_orders.templates",
        "/sales-order-upload": "app.menu.rms.sales_orders.uploads",
        "/fulfillment-order": "app.menu.rms.fulfillment_orders",
        "/fulfillment-order-exports": "app.menu.rms.fulfillment_orders.releases",
        "/fulfillment-order-ledger": "app.menu.rms.fulfillment_orders.ledger",
        "/approval": "app.menu.rms.approval",
        "/approval-delegations": "app.menu.rms.approval",
        // 결산은 seed에 없을 수 있으므로 매핑 생략(기본 허용)
    } as const;

    // 클릭 허용 여부: 동일 resourcePath에 대한 ALLOW 권한이 있고 displayName이 비어있지 않은 경우만 허용
    const canClickPath = (path?: string): boolean => {
        if (!path) return false;
        const resourcePath = PATH_TO_RESOURCE[path];
        if (!resourcePath) return true; // 매핑이 없으면 기존 동작 유지
        const perm = permissions.find(
            (p) =>
                p.effect === "ALLOW" &&
                p.resourcePath === resourcePath &&
                typeof p.displayName === "string" &&
                p.displayName.trim().length > 0,
        );
        return Boolean(perm);
    };

    const isActive = (path: string, subItems?: SubMenuItem[]) => {
        if (pathname === path || pathname.startsWith(`${path}/`)) return true;
        if (subItems) {
            return subItems.some((sub) => pathname === sub.path || pathname.startsWith(`${sub.path}/`));
        }
        return false;
    };

    const handleMouseEnter = (itemId: string, event: React.MouseEvent<HTMLDivElement>) => {
        if (!isCollapsed) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredItem(itemId);
            setHoveredRect(rect);
        }, 120);
    };

    const handleMouseLeave = () => {
        if (!isCollapsed) return;
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredItem(null);
            setHoveredRect(null);
        }, 180);
    };

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };
    }, []);

    return (
        <nav className="flex-1 min-h-0 overflow-y-auto py-4">
            <div className="relative space-y-1 px-2">
                {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path, item.subItems);
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const expanded = expandedItems.includes(item.id);

                    const canNavigateSelf = canClickPath(item.path);

                    const handlePrimaryClick = () => {
                        if (isCollapsed && hasSubItems && item.subItems) {
                            const first = item.subItems[0];
                            if (canClickPath(first.path)) router.push(first.path);
                            return;
                        }
                        if (canClickPath(item.path)) router.push(item.path);
                    };

                    return (
                        <div
                            key={item.id}
                            className="relative"
                            onMouseEnter={(e) => handleMouseEnter(item.id, e)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div
                                className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                    active
                                        ? "bg-[#0d4f56] text-[#62e3d5]"
                                        : `${canNavigateSelf ? "text-white/80 hover:bg-white/10 hover:text-white cursor-pointer" : "text-white/50 cursor-not-allowed"}`
                                }`}
                                role="button"
                                tabIndex={0}
                                aria-disabled={!canNavigateSelf}
                                onClick={handlePrimaryClick}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        handlePrimaryClick();
                                    }
                                }}
                            >
                                <div className="flex flex-1 items-center gap-3">
                                    <Icon className="h-4 w-4" />
                                    <span className="overflow-hidden whitespace-nowrap transition-all duration-200 group-[.collapsed]:w-0 group-[.collapsed]:opacity-0">
                                        {item.label}
                                    </span>
                                </div>
                                {hasSubItems && !isCollapsed && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            onToggle(item.id);
                                        }}
                                        className="ml-1 rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                        aria-label="하위 메뉴 펼치기"
                                        aria-expanded={expanded}
                                    >
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                )}
                            </div>

                            {isCollapsed && hasSubItems && hoveredItem === item.id && hoveredRect && (
                                <div
                                    className="fixed z-[60] rounded-lg border border-white/10 bg-[#0a3b41] shadow-xl"
                                    style={{ left: hoveredRect.right + 8, top: hoveredRect.top, minWidth: 200 }}
                                >
                                    <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold text-white/70">
                                        {item.label}
                                    </div>
                                    <div className="py-2">
                                        {item.subItems!.map((subItem) => {
                                            const subClickable = canClickPath(subItem.path);
                                            const subActive =
                                                pathname === subItem.path || pathname.startsWith(`${subItem.path}/`);
                                            return (
                                                <button
                                                    key={subItem.id}
                                                    type="button"
                                                    onClick={() => subClickable && router.push(subItem.path)}
                                                    className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
                                                        subActive
                                                            ? "bg-[#0d4f56] text-[#62e3d5]"
                                                            : `${subClickable ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-white/50 cursor-not-allowed"}`
                                                    }`}
                                                    aria-disabled={!subClickable}
                                                    disabled={!subClickable}
                                                >
                                                    {subItem.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {!isCollapsed && hasSubItems && expanded && (
                                <div className="overflow-hidden ml-6 mt-1 space-y-0.5">
                                    {item.subItems!.map((subItem) => {
                                        const subClickable = canClickPath(subItem.path);
                                        const subActive =
                                            pathname === subItem.path || pathname.startsWith(`${subItem.path}/`);
                                        return (
                                            <button
                                                key={subItem.id}
                                                type="button"
                                                onClick={() => subClickable && router.push(subItem.path)}
                                                className={`block w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                                    subActive
                                                        ? "bg-[#0d4f56]/70 text-[#62e3d5]"
                                                        : `${subClickable ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-white/50 cursor-not-allowed"}`
                                                }`}
                                                aria-disabled={!subClickable}
                                                disabled={!subClickable}
                                            >
                                                {subItem.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </nav>
    );
};

const SidebarBottom = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div className="border-t border-white/10 p-3 shrink-0">
        <SidebarSystemActions currentArea={AREA} isCollapsed={isCollapsed} />
    </div>
);

type EnvironmentIndicator = {
    label: string;
    host: string;
};

function useEnvironmentIndicator(): EnvironmentIndicator | null {
    const [indicator, setIndicator] = useState<EnvironmentIndicator | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const host = window.location.hostname?.toLowerCase() ?? "";

        if (host.endsWith("dev.ncos.app")||host.endsWith("localhost")) {
            setIndicator({
                label: "개발환경",
                host,
            });
        }
    }, []);

    return indicator;
}

const EnvironmentBadge = ({ indicator }: { indicator: EnvironmentIndicator }) => (
    <div className="px-4 py-2 text-white">
        <div className="flex items-center justify-between group-[.collapsed]:hidden">
            <div className="flex items-center gap-2 rounded border border-amber-200/40 bg-amber-50/10 px-2 py-1 text-[11px] font-semibold text-amber-100">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                <span>{indicator.label}</span>
            </div>
            <span className="text-[10px] text-amber-100/70">{indicator.host}</span>
        </div>

        <div className="mt-1 hidden items-center justify-center group-[.collapsed]:flex">
            <span
                className="h-2 w-2 rounded-full bg-amber-200"
                title={`${indicator.label} · ${indicator.host}`}
            />
        </div>
    </div>
);

export default function Sidebar({ session }: { session?: AuthGuardSession | null }) {
    const pathname = usePathname() ?? "/";
    const isSidebarCollapsed = useSidebarStore((state) => state.collapsedByArea[AREA] ?? false);
    const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
    const expandedItems = useSidebarStore((state) => state.expandedByArea[AREA] ?? []);
    const toggleExpanded = useSidebarStore((state) => state.toggleExpanded);
    const ensureExpanded = useSidebarStore((state) => state.ensureExpanded);
    const environmentIndicator = useEnvironmentIndicator();

    useEffect(() => {
        const parents = collectParentIds(pathname);
        if (parents.length > 0) {
            ensureExpanded(AREA, parents);
        }
    }, [pathname, ensureExpanded]);

    return (
        <div
            className={`group sticky top-0 z-40 flex h-screen flex-col bg-[#0a3b41] text-white transition-all duration-300 ${
                isSidebarCollapsed ? "w-16 collapsed" : "w-60"
            }`}
        >
            <SidebarLogo onToggle={() => toggleCollapsed(AREA)} />
            {environmentIndicator ? <EnvironmentBadge indicator={environmentIndicator} /> : null}
            <SidebarUserInfo session={session} />
            <SidebarNav
                pathname={pathname}
                isCollapsed={isSidebarCollapsed}
                expandedItems={expandedItems}
                onToggle={(menuId) => toggleExpanded(AREA, menuId)}
            />
            <SidebarBottom isCollapsed={isSidebarCollapsed} />
        </div>
    );
}
