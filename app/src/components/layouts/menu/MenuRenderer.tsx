/**
 * 메뉴 렌더링 팩토리 시스템
 *
 * 메뉴 깊이에 따라 적절한 레벨별 컴포넌트를 선택하여 렌더링합니다.
 * 타입 안전성을 보장하며, HTML 구조 유효성 문제를 해결합니다.
 */

import type React from "react";
import { SidebarMenuLevel1, SidebarMenuLevel2, SidebarMenuLevel3 } from "./index";
import { SidebarMenu, SidebarMenuItem, SidebarMenuSubItem } from "ui/agent-ncos/sidebar";
import { getMenuGroupHeaderClasses, getMenuGroupContentClasses } from "@/styles/agent-ncos/menu-design-tokens";
import type { UnifiedMenuItem } from "@/components/layouts/menu-config/unified-menu";
import type { MenuLevel } from "@/styles/agent-ncos/menu-design-tokens";

// ============================================================================
// 타입 정의
// ============================================================================

interface MenuRendererProps {
    menu: UnifiedMenuItem;
    depth: MenuLevel;
    isActive?: boolean;
    isExpanded?: boolean;
}

interface MenuGroupRendererProps {
    title: string;
    menus: UnifiedMenuItem[];
    className?: string;
}

// ============================================================================
// 메뉴 깊이 계산 유틸리티
// ============================================================================

/**
 * 메뉴 아이템의 깊이를 계산합니다.
 *
 * @param menu - 메뉴 아이템
 * @param parentDepth - 부모 메뉴의 깊이
 * @returns 계산된 깊이 (1~3)
 */
function calculateMenuDepth(menu: UnifiedMenuItem, parentDepth: number = 0): MenuLevel {
    const depth = parentDepth + 1;

    // 최대 깊이 제한 (3레벨)
    if (depth > 3) {
        console.warn(`Menu depth exceeded maximum (3): ${menu.id} at depth ${depth}`);
        return 3;
    }

    return depth as MenuLevel;
}

/**
 * 메뉴 아이템이 그룹 헤더인지 확인합니다.
 *
 * @param menu - 메뉴 아이템
 * @returns 그룹 헤더 여부
 */
function isMenuGroup(menu: UnifiedMenuItem): boolean {
    return !!menu.children && menu.children.length > 0;
}

/**
 * 메뉴 아이템이 링크인지 확인합니다.
 *
 * @param menu - 메뉴 아이템
 * @returns 링크 여부
 */
function isMenuLink(menu: UnifiedMenuItem): boolean {
    return !!menu.path;
}

// ============================================================================
// 메뉴 렌더링 컴포넌트
// ============================================================================

/**
 * 메뉴 렌더링 팩토리 컴포넌트
 *
 * 메뉴 깊이에 따라 적절한 레벨별 컴포넌트를 선택하여 렌더링합니다.
 */
export const MenuRenderer: React.FC<MenuRendererProps> = ({ menu, depth, isActive, isExpanded }) => {
    // 개발 환경에서 디버깅 정보 출력
    if (process.env.NODE_ENV === "development") {
        console.log(`🔄 MenuRenderer: ${menu.label} (depth: ${depth}, active: ${isActive}, expanded: ${isExpanded})`);
    }

    // 하위 메뉴 렌더링
    const renderChildren = () => {
        if (!menu.children || menu.children.length === 0) {
            return null;
        }

        return menu.children.map((child) => (
            <MenuRenderer key={child.id} menu={child} depth={calculateMenuDepth(child, depth)} />
        ));
    };

    // 깊이에 따른 컴포넌트 선택
    switch (depth) {
        case 1:
            return (
                <SidebarMenuItem>
                    <SidebarMenuLevel1 menu={menu}>{renderChildren()}</SidebarMenuLevel1>
                </SidebarMenuItem>
            );

        case 2:
            return (
                <SidebarMenuSubItem>
                    <SidebarMenuLevel2 menu={menu}>{renderChildren()}</SidebarMenuLevel2>
                </SidebarMenuSubItem>
            );

        case 3:
            return (
                <SidebarMenuSubItem>
                    <SidebarMenuLevel3 menu={menu} />
                </SidebarMenuSubItem>
            );

        default:
            // 예상치 못한 깊이의 경우 3레벨로 처리
            console.warn(`Unexpected menu depth: ${depth} for menu ${menu.id}`);
            return (
                <SidebarMenuSubItem>
                    <SidebarMenuLevel3 menu={menu} />
                </SidebarMenuSubItem>
            );
    }
};

/**
 * 메뉴 그룹 렌더링 컴포넌트
 *
 * 메뉴 그룹 헤더와 하위 메뉴들을 함께 렌더링합니다.
 */
export const MenuGroupRenderer: React.FC<MenuGroupRendererProps> = ({ title, menus, className }) => {
    // 빈 메뉴 그룹은 렌더링하지 않음
    if (menus.length === 0) {
        return null;
    }

    const headerClasses = getMenuGroupHeaderClasses();
    const contentClasses = getMenuGroupContentClasses();

    return (
        <div className={className}>
            {/* 그룹 헤더 */}
            <div className={headerClasses}>{title}</div>

            {/* 그룹 콘텐츠 */}
            <div className={contentClasses}>
                <SidebarMenu>
                    {menus.map((menu) => (
                        <MenuRenderer key={menu.id} menu={menu} depth={1} />
                    ))}
                </SidebarMenu>
            </div>
        </div>
    );
};

// ============================================================================
// 개발용 유틸리티
// ============================================================================

/**
 * 메뉴 구조 검증 유틸리티
 *
 * @param menus - 검증할 메뉴 배열
 * @returns 검증 결과
 */
export function validateMenuStructure(menus: UnifiedMenuItem[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];
    const seenIds = new Set<string>();

    function validateMenu(menu: UnifiedMenuItem, depth: number = 1) {
        // ID 중복 검사
        if (seenIds.has(menu.id)) {
            errors.push(`Duplicate menu ID: ${menu.id}`);
        } else {
            seenIds.add(menu.id);
        }

        // 깊이 제한 검사
        if (depth > 3) {
            errors.push(`Menu depth exceeded maximum (3): ${menu.id} at depth ${depth}`);
        }

        // 리소스 경로 검사
        if (!menu.resourcePath || !menu.resourcePath.startsWith("app")) {
            errors.push(`Invalid resource path: ${menu.resourcePath} for menu ${menu.id}`);
        }

        // 3레벨 메뉴에 children이 있는지 검사
        if (depth === 3 && menu.children && menu.children.length > 0) {
            warnings.push(`Level 3 menu ${menu.id} has children, which may cause HTML validation issues`);
        }

        // 하위 메뉴 재귀 검사
        if (menu.children) {
            menu.children.forEach((child) => validateMenu(child, depth + 1));
        }
    }

    menus.forEach((menu) => validateMenu(menu));

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * 메뉴 통계 정보 조회
 *
 * @param menus - 분석할 메뉴 배열
 * @returns 통계 정보
 */
export function getMenuStatistics(menus: UnifiedMenuItem[]): {
    totalMenus: number;
    menusByDepth: Record<MenuLevel, number>;
    groupMenus: number;
    linkMenus: number;
    maxDepth: number;
} {
    const stats = {
        totalMenus: 0,
        menusByDepth: { 1: 0, 2: 0, 3: 0 } as Record<MenuLevel, number>,
        groupMenus: 0,
        linkMenus: 0,
        maxDepth: 0,
    };

    function analyzeMenu(menu: UnifiedMenuItem, depth: MenuLevel = 1) {
        stats.totalMenus++;
        stats.menusByDepth[depth]++;
        stats.maxDepth = Math.max(stats.maxDepth, depth);

        if (isMenuGroup(menu)) {
            stats.groupMenus++;
        }

        if (isMenuLink(menu)) {
            stats.linkMenus++;
        }

        if (menu.children && depth < 3) {
            menu.children.forEach((child) => analyzeMenu(child, calculateMenuDepth(child, depth)));
        }
    }

    menus.forEach((menu) => analyzeMenu(menu));

    return stats;
}

// ============================================================================
// 개발용 Export
// ============================================================================

export { calculateMenuDepth, isMenuGroup, isMenuLink };

export type { MenuRendererProps, MenuGroupRendererProps };
