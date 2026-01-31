/**
 * 1레벨 메뉴 컴포넌트 (그룹 헤더)
 *
 * 홈, 채팅, OKR, 관리자 등의 최상위 메뉴 그룹을 렌더링합니다.
 * TailwindCSS 기반 Design System을 사용하여 일관된 스타일을 적용합니다.
 */

import React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/utils/agent-ncos/utils";
import { SidebarMenuButton, SidebarMenuSub } from "ui/agent-ncos/sidebar";
import {
    getMenuItemClasses,
    getMenuIconClasses,
    getMenuBadgeClasses,
    getMenuChevronClasses,
    getMenuLabelClasses,
    getMenuA11yProps,
} from "@/styles/agent-ncos/menu-design-tokens";
import { useMenuExpanded, useMenuActive, useMenuToggle, useMenuStore } from "@/stores/agent-ncos/menuStore";
import { UNIFIED_MENU_CONFIG } from "@/components/layouts/menu-config/unified-menu";
import type { UnifiedMenuItem } from "@/components/layouts/menu-config/unified-menu";

// ============================================================================
// 타입 정의
// ============================================================================

interface SidebarMenuLevel1Props {
    menu: UnifiedMenuItem;
    children?: React.ReactNode;
}

// ============================================================================
// 컴포넌트 구현
// ============================================================================

/**
 * 1레벨 메뉴 컴포넌트
 *
 * 그룹 헤더 역할을 하며, 하위 메뉴를 확장/축소할 수 있습니다.
 * 경로가 있는 경우 클릭 시 해당 경로로 이동합니다.
 */
export const SidebarMenuLevel1 = React.memo<SidebarMenuLevel1Props>(({ menu, children }) => {
    const isExpanded = useMenuExpanded(menu.id);
    const isActive = useMenuActive(menu.id);
    const toggleMenu = useMenuToggle();
    const { setActiveMenuByPath } = useMenuStore();

    const hasChildren = children && React.Children.count(children) > 0;
    const Icon = menu.icon;

    // 이벤트 핸들러
    const handleClick = () => {
        if (hasChildren) {
            toggleMenu(menu.id);
        }
        // path가 있는 경우 네비게이션은 Link 컴포넌트가 처리
        if (menu.path) {
            setActiveMenuByPath(menu.path, UNIFIED_MENU_CONFIG);
        }
    };

    // 접근성 속성
    const a11yProps = getMenuA11yProps(1, hasChildren ? isExpanded : undefined);

    // 스타일 클래스 조합
    const buttonClasses = cn(
        getMenuItemClasses(1, isActive ? "active" : "default"),
        "rounded-lg border border-transparent", // 추가 스타일
        isActive && "shadow-sm", // 활성 상태일 때 그림자
    );

    const iconClasses = getMenuIconClasses(1);
    const labelClasses = getMenuLabelClasses(!!menu.badge);
    const badgeClasses = getMenuBadgeClasses(1);
    const chevronClasses = getMenuChevronClasses(1, isExpanded);

    // 렌더링할 콘텐츠
    const renderContent = () => (
        <>
            {/* 아이콘 */}
            {Icon && <Icon className={iconClasses} />}

            {/* 라벨 및 뱃지 */}
            <div className={labelClasses}>
                <span className="font-semibold">{menu.label}</span>
                {menu.badge && <span className={badgeClasses}>{menu.badge}</span>}
            </div>

            {/* 확장/축소 아이콘 */}
            {hasChildren && (
                <div className={chevronClasses}>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
            )}
        </>
    );

    return (
        <div className="relative">
            {/* path가 있는 경우 Link로 감싸기 */}
            {menu.path ? (
                <SidebarMenuButton
                    asChild
                    className={buttonClasses}
                    data-state={isActive ? "active" : "default"}
                    {...a11yProps}
                >
                    <Link href={menu.path} onClick={handleClick}>
                        {renderContent()}
                    </Link>
                </SidebarMenuButton>
            ) : (
                <SidebarMenuButton
                    className={buttonClasses}
                    onClick={handleClick}
                    data-state={isActive ? "active" : "default"}
                    {...a11yProps}
                >
                    {renderContent()}
                </SidebarMenuButton>
            )}

            {/* 하위 메뉴 */}
            {hasChildren && isExpanded && <SidebarMenuSub>{children}</SidebarMenuSub>}
        </div>
    );
});

SidebarMenuLevel1.displayName = "SidebarMenuLevel1";

// ============================================================================
// 개발용 유틸리티
// ============================================================================

/**
 * 개발 환경에서 1레벨 메뉴 props 디버깅
 */
export function debugSidebarMenuLevel1Props(props: SidebarMenuLevel1Props) {
    if (process.env.NODE_ENV === "development") {
        console.group(`🎯 SidebarMenuLevel1: ${props.menu.label}`);
        console.log("Menu ID:", props.menu.id);
        console.log("Menu Path:", props.menu.path);
        console.log("Menu Icon:", props.menu.icon?.name);
        console.log("Menu Badge:", props.menu.badge);
        console.log("Has Children:", !!props.children);
        console.log("Children Count:", React.Children.count(props.children));
        console.groupEnd();
    }
}

// ============================================================================
// 스토리북/테스트용 Export
// ============================================================================

export type { SidebarMenuLevel1Props };
export { debugSidebarMenuLevel1Props as __debugProps };
