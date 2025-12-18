/**
 * 메뉴 컴포넌트 인덱스
 *
 * 레벨별 메뉴 컴포넌트들과 통합 렌더링 시스템을 export 합니다.
 * 각 컴포넌트는 독립적으로 사용할 수 있으며, 통합 렌더링 시스템에서 활용됩니다.
 */

// 레벨별 메뉴 컴포넌트
export { SidebarMenuLevel1 } from "./SidebarMenuLevel1";
export { SidebarMenuLevel2 } from "./SidebarMenuLevel2";
export { SidebarMenuLevel3 } from "./SidebarMenuLevel3";

// 통합 렌더링 시스템
export { MenuRenderer, MenuGroupRenderer } from "./MenuRenderer";

// 타입 정의
export type { SidebarMenuLevel1Props } from "./SidebarMenuLevel1";
export type { SidebarMenuLevel2Props } from "./SidebarMenuLevel2";
export type { SidebarMenuLevel3Props } from "./SidebarMenuLevel3";
export type { MenuRendererProps, MenuGroupRendererProps } from "./MenuRenderer";

// 유틸리티 함수
export {
    calculateMenuDepth,
    isMenuGroup,
    isMenuLink,
    validateMenuStructure,
    getMenuStatistics,
} from "./MenuRenderer";

// 개발용 유틸리티 (개발 환경에서만 사용)
export { debugSidebarMenuLevel1Props as __debugLevel1Props } from "./SidebarMenuLevel1";
export { debugSidebarMenuLevel2Props as __debugLevel2Props } from "./SidebarMenuLevel2";
export { debugSidebarMenuLevel3Props as __debugLevel3Props } from "./SidebarMenuLevel3";
