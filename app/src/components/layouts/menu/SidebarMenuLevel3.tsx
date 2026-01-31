/**
 * 3레벨 메뉴 컴포넌트 (리프 아이템)
 *
 * 권한 관리, 정책 관리 등의 최종 메뉴 아이템을 렌더링합니다.
 * TailwindCSS 기반 Design System을 사용하여 일관된 스타일을 적용합니다.
 * 실제 페이지로 이동하는 링크 기능을 제공합니다.
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/agent-ncos/utils";
import { SidebarMenuSubButton } from "ui/agent-ncos/sidebar";
import {
    getMenuItemClasses,
    getMenuIconClasses,
    getMenuBadgeClasses,
    getMenuLabelClasses,
    getMenuA11yProps,
} from "@/styles/agent-ncos/menu-design-tokens";
import { useMenuActive, useSetActiveMenuByPath } from "@/stores/agent-ncos/menuStore";
import { UNIFIED_MENU_CONFIG } from "@/components/layouts/menu-config/unified-menu";
import type { UnifiedMenuItem } from "@/components/layouts/menu-config/unified-menu";

// ============================================================================
// 타입 정의
// ============================================================================

interface SidebarMenuLevel3Props {
    menu: UnifiedMenuItem;
    /** 링크 기능을 비활성화할지 여부 */
    disabled?: boolean;
}

// ============================================================================
// 컴포넌트 구현
// ============================================================================

/**
 * 3레벨 메뉴 컴포넌트
 *
 * 최종 메뉴 아이템으로, 실제 페이지로 이동하는 링크를 제공합니다.
 * 하위 메뉴는 가질 수 없으며, 항상 리프 노드입니다.
 */
export const SidebarMenuLevel3 = React.memo<SidebarMenuLevel3Props>(({ menu, disabled = false }) => {
    const pathname = usePathname();
    const isActive = useMenuActive(menu.id);
    const setActiveMenuByPath = useSetActiveMenuByPath();

    const Icon = menu.icon;
    const hasPath = !!menu.path;

    // 활성 상태 확인 (경로 기반) - exactMatch 플래그 고려
    const isPathActive =
        hasPath && (pathname === menu.path || (!menu.exactMatch && menu.path && pathname.startsWith(`${menu.path}/`)));

    // 최종 활성 상태 (Store 상태 + 경로 상태)
    const isFinalActive = isActive || isPathActive;

    // 링크 클릭 핸들러
    const handleClick = () => {
        if (hasPath && !disabled && menu.path) {
            setActiveMenuByPath(menu.path, UNIFIED_MENU_CONFIG);
        }
        // Next.js Link의 기본 동작을 막지 않음 (네비게이션 허용)
    };

    // 접근성 속성
    const a11yProps = getMenuA11yProps(3);

    // 스타일 클래스 조합
    const buttonClasses = cn(
        getMenuItemClasses(3, isFinalActive ? "active" : "default"),
        "rounded-sm border border-transparent", // 추가 스타일
        "relative before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-sidebar-border before:opacity-20", // 왼쪽 구분선
        isFinalActive && "before:bg-sidebar-primary before:opacity-100", // 활성 상태일 때 구분선 강조
        disabled && "opacity-50 cursor-not-allowed pointer-events-none", // 비활성 상태
    );

    const iconClasses = getMenuIconClasses(3);
    const labelClasses = getMenuLabelClasses(!!menu.badge);
    const badgeClasses = getMenuBadgeClasses(3);

    // 컨텐츠 렌더링
    const renderContent = () => (
        <>
            {/* 아이콘 */}
            {Icon && <Icon className={iconClasses} />}

            {/* 라벨 및 뱃지 */}
            <div className={labelClasses}>
                <span className="font-normal">{menu.label}</span>
                {menu.badge && <span className={badgeClasses}>{menu.badge}</span>}
            </div>

            {/* 활성 상태 표시 */}
            {isFinalActive && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-sidebar-primary rounded-full" />
            )}
        </>
    );

    // 링크가 있는 경우 Link 컴포넌트로 감싸기
    if (hasPath && !disabled) {
        return (
            <SidebarMenuSubButton
                asChild
                className={buttonClasses}
                data-state={isFinalActive ? "active" : "default"}
                {...a11yProps}
            >
                <Link href={menu.path!} onClick={handleClick}>
                    {renderContent()}
                </Link>
            </SidebarMenuSubButton>
        );
    }

    // 링크가 없거나 비활성 상태인 경우 버튼으로 렌더링
    return (
        <SidebarMenuSubButton
            className={buttonClasses}
            onClick={disabled ? undefined : handleClick}
            data-state={isFinalActive ? "active" : "default"}
            {...a11yProps}
        >
            {renderContent()}
        </SidebarMenuSubButton>
    );
});

SidebarMenuLevel3.displayName = "SidebarMenuLevel3";

// ============================================================================
// 개발용 유틸리티
// ============================================================================

/**
 * 개발 환경에서 3레벨 메뉴 props 디버깅
 */
export function debugSidebarMenuLevel3Props(props: SidebarMenuLevel3Props) {
    if (process.env.NODE_ENV === "development") {
        const pathname = typeof window !== "undefined" ? window.location.pathname : "";
        const isPathActive =
            props.menu.path &&
            (pathname === props.menu.path || (!props.menu.exactMatch && pathname.startsWith(`${props.menu.path}/`)));

        console.group(`🎯 SidebarMenuLevel3: ${props.menu.label}`);
        console.log("Menu ID:", props.menu.id);
        console.log("Menu Path:", props.menu.path);
        console.log("Menu Icon:", props.menu.icon?.name);
        console.log("Menu Badge:", props.menu.badge);
        console.log("Current Pathname:", pathname);
        console.log("Is Path Active:", isPathActive);
        console.log("Is Disabled:", props.disabled);
        console.log("Resource Path:", props.menu.resourcePath);
        console.log("Description:", props.menu.description);
        console.groupEnd();
    }
}

// ============================================================================
// 스토리북/테스트용 Export
// ============================================================================

export type { SidebarMenuLevel3Props };
export { debugSidebarMenuLevel3Props as __debugProps };
