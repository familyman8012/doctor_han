declare module "react-js-pagination" {
    import type React from "react";

    export interface PaginationProps {
        activePage: number;
        itemsCountPerPage: number;
        totalItemsCount: number;
        pageRangeDisplayed?: number;
        onChange: (pageNumber: number) => void;
        prevPageText?: React.ReactNode;
        nextPageText?: React.ReactNode;
        firstPageText?: React.ReactNode;
        lastPageText?: React.ReactNode;
        hideFirstLastPages?: boolean;
        itemClass?: string;
        linkClass?: string;
        activeClass?: string;
        disabledClass?: string;
        innerClass?: string;
        [key: string]: unknown;
    }

    const Pagination: React.ComponentType<PaginationProps>;
    export default Pagination;
}

