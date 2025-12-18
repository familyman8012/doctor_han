/**
 * 통합 메뉴 시스템 설정
 *
 * PBAC 권한 시스템과 완전 통합된 전체 애플리케이션 메뉴 구성을 정의합니다.
 * 기존 PBAC seed data의 리소스 경로와 완전 일치하며, "dashboard" 접두사를 제거한
 * 단순화된 라우팅 구조를 사용합니다.
 *
 * Custom Hook + Component Separation 패턴을 지원하여,
 * 비즈니스 로직은 useUnifiedMenu 훅에서 처리하고
 * UI 렌더링은 UnifiedSidebar 컴포넌트에서 담당합니다.
 */

import {
    Activity,
    Archive,
    BarChart3,
    Bot,
    Building2,
    Cog,
    Database,
    FileText,
    GitBranch,
    History,
    Home,
    Layers,
    LayoutDashboard,
    Link2,
    MessageCircle,
    MessageSquare,
    Settings,
    Shield,
    Target,
    Users,
    Filter,
} from "lucide-react";

import type { MenuItem } from "@/types/agent-ncos/menu";

/**
 * 통합 메뉴 아이템 인터페이스
 * 기존 MenuItem 확장하여 그룹별 분류 지원
 */
export interface UnifiedMenuItem extends MenuItem {
    /** 메뉴 그룹 타입 */
    group?: "home" | "chat" | "okr" | "admin";
    /** 메뉴 접근 레벨 */
    level?: "public" | "user" | "admin";
    /** 정확한 경로 매칭 여부 (기본값: false) */
    exactMatch?: boolean;
    children?: UnifiedMenuItem[];
}

/**
 * 통합 메뉴 설정
 *
 * 전체 애플리케이션의 메뉴 구조를 정의합니다.
 * PBAC 권한 시스템과 완전히 통합되어, 사용자가 접근 권한이 있는 메뉴만 동적으로 표시됩니다.
 *
 * 각 메뉴의 resourcePath는 scripts/seed/seed_pbac.sql 의 시스템 리소스 정의와 일치해야 합니다.
 */
export const UNIFIED_MENU_CONFIG: UnifiedMenuItem[] = [
    // === 홈 그룹 ===
    {
        id: "home",
        label: "홈",
        resourcePath: "app",
        path: "/chats",
        icon: Home,
        group: "home",
        level: "public",
        order: 0,
        description: "NCOS 메인",
    },

    // === 채팅 그룹 ===
    {
        id: "chat",
        label: "채팅",
        resourcePath: "app.menu.chat",
        icon: MessageCircle,
        group: "chat",
        level: "user",
        order: 10,
        description: "AI 에이전트와의 채팅 관리",
        children: [
            {
                id: "chat-agents",
                label: "새 채팅",
                resourcePath: "app.menu.chat.agents",
                path: "/agents",
                icon: Bot,
                order: 1,
                description: "에이전트와 새로운 채팅 시작",
            },
            {
                id: "chat-history",
                label: "채팅 목록",
                resourcePath: "app.menu.chat.history",
                path: "/chats",
                icon: MessageSquare,
                order: 2,
                description: "기존 채팅 히스토리 관리",
            },
        ],
    },

    // === OKR 관리 그룹 ===
    {
        id: "okr",
        label: "OKR 관리",
        resourcePath: "app.menu.okr",
        icon: Target,
        group: "okr",
        level: "user",
        order: 30,
        description: "Objectives and Key Results 시스템",
        children: [
            {
                id: "okr-overview",
                label: "OKR 대시보드",
                resourcePath: "app.menu.okr.overview",
                path: "/okr",
                icon: BarChart3,
                order: 1,
                description: " OKR 현황 및 진행 상태",
                exactMatch: true,
            },
        ],
    },

    // === 관리자 그룹 ===
    {
        id: "admin",
        label: "관리자",
        resourcePath: "app.menu.admin",
        icon: Settings,
        group: "admin",
        level: "admin",
        order: 100,
        description: "시스템 관리 및 설정",
        children: [
            {
                id: "admin-partners",
                label: "거래처 관리",
                resourcePath: "app.menu.admin.partners",
                path: "/admin/partners",
                icon: Shield,
                order: 10,
                description: "거래처 관리",
            },
            {
                id: "admin-permissions",
                label: "권한 관리",
                resourcePath: "app.menu.admin.permissions",
                path: "/admin/permissions",
                icon: Shield,
                order: 10,
                description: "사용자 권한 및 정책 통합 관리",
            },
            {
                id: "admin-policies",
                label: "정책 관리",
                resourcePath: "app.menu.admin.policies",
                path: "/admin/policies",
                icon: FileText,
                order: 20,
                description: "권한 정책 생성 및 규칙 관리",
            },
            {
                id: "admin-groups",
                label: "그룹 관리",
                resourcePath: "app.menu.admin.groups",
                path: "/admin/groups",
                icon: Users,
                order: 30,
                description: "사용자 그룹 생성 및 멤버 관리",
            },
            {
                id: "admin-resources",
                label: "리소스 관리",
                resourcePath: "app.menu.admin.resources",
                path: "/admin/resources",
                icon: Database,
                order: 40,
                description: "시스템 리소스 카탈로그 관리",
            },
            {
                id: "admin-agents",
                label: "AI 에이전트",
                resourcePath: "app.menu.admin.agents",
                path: "/admin/agents",
                icon: Bot,
                order: 50,
                description: "A2A 기반 AI 에이전트 관리 및 모니터링",
            },
            {
                id: "admin-directory",
                label: "Directory",
                resourcePath: "app.menu.admin.directory",
                path: "/admin/directory",
                icon: LayoutDashboard,
                order: 60,
                description: "사용자 · 조직 · 프로필(Legacy) 통합 관리",
                children: [
                    {
                        id: "admin-directory-users",
                        label: "사용자",
                        resourcePath: "app.menu.admin.directory.users",
                        path: "/admin/directory?tab=users",
                        icon: Users,
                        order: 61,
                        description: "Directory 사용자 탭",
                    },
                    {
                        id: "admin-directory-org-units",
                        label: "조직",
                        resourcePath: "app.menu.admin.directory.org_units",
                        path: "/admin/directory?tab=org-units",
                        icon: Building2,
                        order: 62,
                        description: "Directory 조직 탭",
                    },
                    {
                        id: "admin-directory-profiles-legacy",
                        label: "프로필(Legacy)",
                        resourcePath: "app.menu.admin.directory.profiles_legacy",
                        path: "/admin/directory?tab=profiles-legacy",
                        icon: Link2,
                        order: 63,
                        description: "Directory 프로필(Legacy) 탭",
                    },
                ],
            },
            {
                id: "admin-revenue-filters",
                label: "매출 리포트 필터",
                resourcePath: "app.menu.admin.revenue_filters",
                path: "/admin/revenue-filter",
                icon: Filter,
                order: 70,
                description: "매출 리포트 제외 필터 관리",
            },
        ],
    },
];

/**
 * 메뉴 아이콘 매핑
 *
 * 동적 메뉴 시스템에서 문자열 아이콘 이름을 실제 컴포넌트로 변환
 */
export const UNIFIED_MENU_ICON_MAP = {
    // 기본 아이콘
    Home,
    MessageCircle,
    MessageSquare,
    Bot,
    Target,
    BarChart3,
    Archive,
    Settings,
    Shield,
    FileText,
    Users,
    Database,
    Layers,
    GitBranch,
    Activity,
    Cog,
    History,
    LayoutDashboard,
    Building2,
    Link2,
    Filter,

    // 기본 아이콘
    default: Settings,
} as const;

/**
 * 아이콘 이름 타입
 */
export type UnifiedMenuIconName = keyof typeof UNIFIED_MENU_ICON_MAP;

/**
 * 메뉴 아이콘 조회 유틸리티
 *
 * @param iconName 아이콘 이름
 * @returns 아이콘 컴포넌트
 */
export function getUnifiedMenuIcon(iconName: string): typeof Settings {
    return UNIFIED_MENU_ICON_MAP[iconName as UnifiedMenuIconName] ?? UNIFIED_MENU_ICON_MAP.default;
}

/**
 * 메뉴 그룹별 조회 유틸리티
 *
 * @param group 메뉴 그룹
 * @returns 해당 그룹의 메뉴 아이템들
 */
export function getMenusByGroup(group: UnifiedMenuItem["group"]): UnifiedMenuItem[] {
    return UNIFIED_MENU_CONFIG.filter((menu) => menu.group === group);
}

/**
 * 메뉴 레벨별 조회 유틸리티
 *
 * @param level 접근 레벨
 * @returns 해당 레벨의 메뉴 아이템들
 */
export function getMenusByLevel(level: UnifiedMenuItem["level"]): UnifiedMenuItem[] {
    function collectMenusByLevel(items: UnifiedMenuItem[]): UnifiedMenuItem[] {
        const result: UnifiedMenuItem[] = [];

        for (const item of items) {
            if (item.level === level) {
                result.push(item);
            }

            if (item.children) {
                result.push(...collectMenusByLevel(item.children));
            }
        }

        return result;
    }

    return collectMenusByLevel(UNIFIED_MENU_CONFIG);
}

/**
 * 메뉴 ID로 조회 유틸리티
 *
 * @param menuId 메뉴 ID
 * @returns 메뉴 아이템 (없으면 undefined)
 */
export function findUnifiedMenuById(menuId: string): UnifiedMenuItem | undefined {
    function search(items: UnifiedMenuItem[]): UnifiedMenuItem | undefined {
        for (const item of items) {
            if (item.id === menuId) {
                return item;
            }
            if (item.children) {
                const found = search(item.children);
                if (found) return found;
            }
        }
        return undefined;
    }

    return search(UNIFIED_MENU_CONFIG);
}

/**
 * 경로로 메뉴 아이템 조회 유틸리티
 *
 * @param path 라우터 경로
 * @returns 메뉴 아이템 (없으면 undefined)
 */
export function findUnifiedMenuByPath(path: string): UnifiedMenuItem | undefined {
    function search(items: UnifiedMenuItem[]): UnifiedMenuItem | undefined {
        for (const item of items) {
            if (item.path === path) {
                return item;
            }
            if (item.children) {
                const found = search(item.children);
                if (found) return found;
            }
        }
        return undefined;
    }

    return search(UNIFIED_MENU_CONFIG);
}

/**
 * 리소스 경로로 메뉴 아이템 조회 유틸리티
 *
 * @param resourcePath PBAC 리소스 경로
 * @returns 메뉴 아이템 (없으면 undefined)
 */
export function findUnifiedMenuByResourcePath(resourcePath: string): UnifiedMenuItem | undefined {
    function search(items: UnifiedMenuItem[]): UnifiedMenuItem | undefined {
        for (const item of items) {
            if (item.resourcePath === resourcePath) {
                return item;
            }
            if (item.children) {
                const found = search(item.children);
                if (found) return found;
            }
        }
        return undefined;
    }

    return search(UNIFIED_MENU_CONFIG);
}

/**
 * 모든 메뉴 아이템을 플랫 배열로 변환
 *
 * @param includeGroups 그룹 헤더 포함 여부
 * @returns 플랫 메뉴 배열
 */
export function flattenUnifiedMenuItems(includeGroups: boolean = false): UnifiedMenuItem[] {
    const flattened: UnifiedMenuItem[] = [];

    function flatten(items: UnifiedMenuItem[]) {
        for (const item of items) {
            if (includeGroups || item.path) {
                flattened.push(item);
            }
            if (item.children) {
                flatten(item.children);
            }
        }
    }

    flatten(UNIFIED_MENU_CONFIG);
    return flattened;
}

/**
 * 메뉴 경로의 breadcrumb 생성
 *
 * @param targetPath 대상 경로
 * @returns breadcrumb 메뉴 배열
 */
export function getUnifiedMenuBreadcrumb(targetPath: string): UnifiedMenuItem[] {
    const breadcrumb: UnifiedMenuItem[] = [];

    function search(items: UnifiedMenuItem[], parents: UnifiedMenuItem[] = []): boolean {
        for (const item of items) {
            const currentPath = [...parents, item];

            if (item.path === targetPath) {
                breadcrumb.push(...currentPath);
                return true;
            }

            if (item.children && search(item.children, currentPath)) {
                return true;
            }
        }
        return false;
    }

    search(UNIFIED_MENU_CONFIG);
    return breadcrumb;
}

/**
 * 개발용: 통합 메뉴 구조 검증
 *
 * @returns 검증 결과
 */
export function validateUnifiedMenuStructure(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];
    const seenIds = new Set<string>();
    const seenPaths = new Set<string>();
    const seenResourcePaths = new Set<string>();

    function validate(items: UnifiedMenuItem[], depth = 0) {
        for (const item of items) {
            // ID 중복 검사
            if (seenIds.has(item.id)) {
                errors.push(`Duplicate menu ID: ${item.id}`);
            } else {
                seenIds.add(item.id);
            }

            // 경로 중복 검사
            if (item.path) {
                if (seenPaths.has(item.path)) {
                    errors.push(`Duplicate menu path: ${item.path}`);
                } else {
                    seenPaths.add(item.path);
                }
            }

            // 리소스 경로 중복 검사
            if (seenResourcePaths.has(item.resourcePath)) {
                warnings.push(`Duplicate resource path: ${item.resourcePath}`);
            } else {
                seenResourcePaths.add(item.resourcePath);
            }

            // 깊이 제한 검사
            if (depth > 3) {
                warnings.push(`Menu too deep (${depth}): ${item.id}`);
            }

            // PBAC 리소스 경로 형식 검사
            if (!item.resourcePath.startsWith("app")) {
                errors.push(
                    `Invalid resource path format: ${item.resourcePath} (should start with 'app')`,
                );
            }

            // 재귀 검사
            if (item.children) {
                validate(item.children, depth + 1);
            }
        }
    }

    validate(UNIFIED_MENU_CONFIG);

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * 통계 정보 조회
 */
export function getUnifiedMenuStats() {
    const flatMenus = flattenUnifiedMenuItems(true);
    const menusByGroup = {
        home: getMenusByGroup("home").length,
        chat: getMenusByGroup("chat").length,
        okr: getMenusByGroup("okr").length,
        admin: getMenusByGroup("admin").length,
    };
    const menusByLevel = {
        public: getMenusByLevel("public").length,
        user: getMenusByLevel("user").length,
        admin: getMenusByLevel("admin").length,
    };

    return {
        totalMenus: flatMenus.length,
        menuWithPaths: flatMenus.filter((m) => m.path).length,
        menusByGroup,
        menusByLevel,
        validation: validateUnifiedMenuStructure(),
    };
}
