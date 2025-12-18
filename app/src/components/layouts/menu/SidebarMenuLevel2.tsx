/**
 * 2레벨 메뉴 컴포넌트 (서브 그룹)
 *
 * 시스템 관리, AI 에이전트 등의 중간 단계 메뉴 그룹을 렌더링합니다.
 * TailwindCSS 기반 Design System을 사용하여 일관된 스타일을 적용합니다.
 */

import React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/utils/agent-ncos/utils";
import { SidebarMenuSubButton, SidebarMenuSub } from "ui/agent-ncos/sidebar";
import {
    getMenuItemClasses,
    getMenuIconClasses,
    getMenuBadgeClasses,
    getMenuChevronClasses,
    getMenuLabelClasses,
    getSubmenuContainerClasses,
    getMenuA11yProps,
} from "@/styles/agent-ncos/menu-design-tokens";
import { useMenuExpanded, useMenuActive, useMenuToggle, useMenuStore } from "@/stores/agent-ncos/menuStore";
import { UNIFIED_MENU_CONFIG } from "@/components/layouts/menu-config/unified-menu";
import type { UnifiedMenuItem } from "@/components/layouts/menu-config/unified-menu";

// ============================================================================
// 타입 정의
// ============================================================================

interface SidebarMenuLevel2Props {
    menu: UnifiedMenuItem;
    children?: React.ReactNode;
}

// ============================================================================
// 컴포넌트 구현
// ============================================================================

/**
 * 2레벨 메뉴 컴포넌트
 *
 * 서브 그룹 역할을 하며, 1레벨 메뉴 하위에 위치합니다.
 * 추가 하위 메뉴를 확장/축소할 수 있습니다.
 */
export const SidebarMenuLevel2 = React.memo<SidebarMenuLevel2Props>(({ menu, children }) => {
    const isExpanded = useMenuExpanded(menu.id);
    const isActive = useMenuActive(menu.id);
    const toggleMenu = useMenuToggle();
    const { setActiveMenuByPath } = useMenuStore();

    const hasChildren = children && React.Children.count(children) > 0;
    const Icon = menu.icon;

    // 이벤트 핸들러
    const handleClick = (_e: React.MouseEvent) => {
        if (hasChildren) {
            toggleMenu(menu.id);
        }
        // path가 있는 경우 네비게이션은 Link 컴포넌트가 처리
        if (menu.path) {
            setActiveMenuByPath(menu.path, UNIFIED_MENU_CONFIG);
        }
    };

    // 접근성 속성
    const a11yProps = getMenuA11yProps(2, hasChildren ? isExpanded : undefined);

    // 스타일 클래스 조합
    const buttonClasses = cn(
        getMenuItemClasses(2, isActive ? "active" : "default"),
        "rounded-md border border-transparent", // 추가 스타일
        "relative before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-sidebar-border before:opacity-30", // 왼쪽 구분선
        isActive && "before:bg-sidebar-primary before:opacity-100", // 활성 상태일 때 구분선 강조
    );

    const iconClasses = getMenuIconClasses(2);
    const labelClasses = getMenuLabelClasses(!!menu.badge);
    const badgeClasses = getMenuBadgeClasses(2);
    const chevronClasses = getMenuChevronClasses(2, isExpanded);
    const submenuClasses = getSubmenuContainerClasses(isExpanded);

    // 렌더링할 콘텐츠
    const renderContent = () => (
        <>
            {/* 아이콘 */}
            {Icon && <Icon className={iconClasses} />}

            {/* 라벨 및 뱃지 */}
            <div className={labelClasses}>
                <span className="font-medium">{menu.label}</span>
                {menu.badge && <span className={badgeClasses}>{menu.badge}</span>}
            </div>

            {/* 확장/축소 아이콘 */}
            {hasChildren && (
                <div className={chevronClasses}>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </div>
            )}
        </>
    );

    return (
        <div className="relative">
            {/* path가 있는 경우 Link로 감싸기 */}
            {menu.path ? (
                <SidebarMenuSubButton
                    asChild
                    className={buttonClasses}
                    data-state={isActive ? "active" : "default"}
                    {...a11yProps}
                >
                    <Link href={menu.path} onClick={handleClick}>
                        {renderContent()}
                    </Link>
                </SidebarMenuSubButton>
            ) : (
                <SidebarMenuSubButton
                    className={buttonClasses}
                    onClick={handleClick}
                    data-state={isActive ? "active" : "default"}
                    {...a11yProps}
                >
                    {renderContent()}
                </SidebarMenuSubButton>
            )}

            {/* 하위 메뉴 */}
            {hasChildren && <SidebarMenuSub className={submenuClasses}>{children}</SidebarMenuSub>}
        </div>
    );
});

SidebarMenuLevel2.displayName = "SidebarMenuLevel2";

// ============================================================================
// 개발용 유틸리티
// ============================================================================

/**
 * 개발 환경에서 2레벨 메뉴 props 디버깅
 */
export function debugSidebarMenuLevel2Props(props: SidebarMenuLevel2Props) {
    if (process.env.NODE_ENV === "development") {
        console.group(`🎯 SidebarMenuLevel2: ${props.menu.label}`);
        console.log("Menu ID:", props.menu.id);
        console.log("Menu Path:", props.menu.path);
        console.log("Menu Icon:", props.menu.icon?.name);
        console.log("Menu Badge:", props.menu.badge);
        console.log("Has Children:", !!props.children);
        console.log("Children Count:", React.Children.count(props.children));
        console.log("Resource Path:", props.menu.resourcePath);
        console.groupEnd();
    }
}

// ============================================================================
// 스토리북/테스트용 Export
// ============================================================================

export type { SidebarMenuLevel2Props };
export { debugSidebarMenuLevel2Props as __debugProps };
