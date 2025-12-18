import {
    Calculator,
    CheckCircle,
    Download,
    FileText,
    Handshake,
    Layers,
    // Megaphone,
    type LucideIcon,
    Plus,
    Send,
    ShoppingBag,
    TruckIcon,
    Users,
} from "lucide-react";

export interface SubMenuItem {
    id: string;
    label: string;
    path: string;
}

export interface MenuItem {
    id: string;
    icon: LucideIcon;
    label: string;
    path: string;
    subItems?: SubMenuItem[];
}

export interface HeaderInfo {
    title: string;
    subtitle: string;
    actionButton?: {
        label: string;
        icon: LucideIcon;
    } | null;
}

export const MENU_ITEMS: MenuItem[] = [
    // {
    //     id: "partners",
    //     icon: Handshake,
    //     label: "거래처",
    //     path: "/partners",
    // },
    {
        id: "order-products",
        icon: Layers,
        label: "주문상품",
        path: "/order-products",
    },
    {
        id: "supply-contracts",
        icon: FileText,
        label: "공급계약",
        path: "/supply-contracts",
    },
    {
        id: "order",
        icon: ShoppingBag,
        label: "판매 주문",
        path: "/sales-order",
        subItems: [
            { id: "order-list", label: "판매주문 관리", path: "/sales-order" },
            { id: "order-templates", label: "주문서 템플릿 관리", path: "/sales-order-templates" },
            { id: "order-templates-upload-session", label: "주문서 업로드", path: "/sales-order-upload" },
        ],
    },
    {
        id: "shipment",
        icon: TruckIcon,
        label: "출고",
        path: "/fulfillment-order",
        subItems: [
            { id: "shipment", label: "출고관리", path: "/fulfillment-order" },
            { id: "shipment-exports", label: "출고지시 목록", path: "/fulfillment-order-exports" },
            { id: "shipment-ledger", label: "수불부", path: "/fulfillment-order-ledger" },
        ],
    },
    {
        id: "approval",
        icon: CheckCircle,
        label: "승인",
        path: "/approval",
        subItems: [
            { id: "approval-list", label: "승인 요청", path: "/approval" },
            { id: "approval-delegations", label: "위임 관리", path: "/approval-delegations" },
        ],
    },
    {
        id: "settlement",
        icon: Calculator,
        label: "결산",
        path: "/settlement",
        subItems: [
            { id: "settlement-list", label: "결산 관리", path: "/settlement" },
            { id: "settlement-periods", label: "회기 관리", path: "/settlement-periods" },
        ],
    },
];
