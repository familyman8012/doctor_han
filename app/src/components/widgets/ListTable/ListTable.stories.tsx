import type { Meta, StoryObj } from "@storybook/react";
import { ListTable } from "./ListTable";
import { Badge, type BadgeColor } from "@/components/ui/Badge/Badge";
import { CheckCircle2, Clock3, Users } from "lucide-react";
import { useState } from "react";

interface ShippingData {
    id: string;
    campaign: string;
    status: string;
    type: string;
    tax: string;
    applicant: string;
    approver: string;
    requestDate: string;
    shipDate: string;
    skuCount: number;
    recipients: number;
}

const meta: Meta<typeof ListTable> = {
    title: "Widgets/ListTable",
    component: ListTable,
    tags: ["autodocs"],
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
};

export default meta;
type Story = StoryObj<typeof ListTable>;

// 샘플 데이터
const shippingData: ShippingData[] = [
    {
        id: "20250829R000004",
        campaign: "신제품 QC용",
        status: "출고완료",
        type: "본사샘플",
        tax: "비대상",
        applicant: "Riley",
        approver: "Jay",
        requestDate: "2025-09-01",
        shipDate: "2025-09-01",
        skuCount: 2,
        recipients: 1,
    },
    {
        id: "20250901R000001",
        campaign: "일본 트래킹 인플루언서 사유",
        status: "출고완료",
        type: "인플루언서샘플",
        tax: "비대상",
        applicant: "Haley",
        approver: "Joshua",
        requestDate: "2025-09-01",
        shipDate: "2025-09-02",
        skuCount: 4,
        recipients: 2,
    },
    {
        id: "20250901R000003",
        campaign: "네이버스윈리아트 포스트 샘플 제공",
        status: "출고완료",
        type: "영업샘플",
        tax: "비대상",
        applicant: "Haon",
        approver: "Jay",
        requestDate: "2025-09-01",
        shipDate: "2025-09-01",
        skuCount: 20,
        recipients: 2,
    },
    {
        id: "20250901R000011",
        campaign: "test",
        status: "작성중",
        type: "영업샘플",
        tax: "비대상",
        applicant: "Haon",
        approver: "Jay",
        requestDate: "2025-09-02",
        shipDate: "",
        skuCount: 0,
        recipients: 0,
    },
    {
        id: "20250901R000012",
        campaign: "유제이남 구매몰 이벤트 제품",
        status: "출고완료",
        type: "본사샘플",
        tax: "비대상",
        applicant: "Lia",
        approver: "Jay",
        requestDate: "2025-09-02",
        shipDate: "2025-09-02",
        skuCount: 4,
        recipients: 1,
    },
];

const getStatusBadge = (status: string) => {
    switch (status) {
        case "출고완료":
            return (
                <Badge color="success" size="sm">
                    <CheckCircle2 className="w-3 h-3" />
                    출고완료
                </Badge>
            );
        case "작성중":
            return (
                <Badge color="warning" size="sm">
                    <Clock3 className="w-3 h-3" />
                    작성중
                </Badge>
            );
        default:
            return (
                <Badge color="neutral" size="sm">
                    {status}
                </Badge>
            );
    }
};

const getTypeBadge = (type: string) => {
    const colorMap: Record<string, BadgeColor> = {
        본사샘플: "primary",
        인플루언서샘플: "purple",
        영업샘플: "teal",
    };
    return (
        <Badge color={colorMap[type] || "neutral"} size="sm">
            {type}
        </Badge>
    );
};

export const Default: Story = {
    args: {
        columns: [
            {
                key: "id",
                header: "출고요청번호",
                render: (value) => <span className="font-mono">{value}</span>,
            },
            {
                key: "campaign",
                header: "캠페인명",
                render: (value) => <span className="font-medium">{value}</span>,
            },
            {
                key: "status",
                header: "상태",
                render: (value) => getStatusBadge(value),
            },
            {
                key: "type",
                header: "유형",
                render: (value) => getTypeBadge(value),
            },
            {
                key: "applicant",
                header: "신청인",
                render: (value) => <span className="font-medium">{value}</span>,
            },
            {
                key: "requestDate",
                header: "출고희망일",
            },
            {
                key: "shipDate",
                header: "출고일",
                render: (value) => value || "-",
            },
            {
                key: "skuCount",
                header: "SKU",
                align: "center",
                render: (value) => <span className="font-medium">{value}</span>,
            },
            {
                key: "recipients",
                header: "수령인",
                align: "center",
                render: (value) => <span className="font-medium">{value}</span>,
            },
        ],
        data: shippingData,
    },
};

export const WithPagination: Story = {
    render: () => {
        const [currentPage, setCurrentPage] = useState(1);
        const pageSize = 3;
        const totalItems = shippingData.length;
        const totalPages = Math.ceil(totalItems / pageSize);

        const paginatedData = shippingData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        return (
            <ListTable
                columns={[
                    {
                        key: "id",
                        header: "출고요청번호",
                        render: (value) => <span className="font-mono">{value}</span>,
                    },
                    {
                        key: "campaign",
                        header: "캠페인명",
                        render: (value) => <span className="font-medium">{value}</span>,
                    },
                    {
                        key: "status",
                        header: "상태",
                        render: (value) => getStatusBadge(value),
                    },
                    {
                        key: "type",
                        header: "유형",
                        render: (value) => getTypeBadge(value),
                    },
                    {
                        key: "applicant",
                        header: "신청인",
                    },
                    {
                        key: "skuCount",
                        header: "SKU",
                        align: "center",
                    },
                ]}
                data={paginatedData}
                pagination={{
                    currentPage,
                    totalPages,
                    pageSize,
                    totalItems,
                    onPageChange: setCurrentPage,
                }}
            />
        );
    },
};

export const Loading: Story = {
    args: {
        columns: [
            { key: "id", header: "출고요청번호" },
            { key: "campaign", header: "캠페인명" },
            { key: "status", header: "상태" },
            { key: "type", header: "유형" },
        ],
        data: [],
        loading: true,
    },
};

export const Empty: Story = {
    args: {
        columns: [
            { key: "id", header: "출고요청번호" },
            { key: "campaign", header: "캠페인명" },
            { key: "status", header: "상태" },
            { key: "type", header: "유형" },
        ],
        data: [],
        emptyMessage: "출고 요청이 없습니다",
    },
};

export const WithRowClick: Story = {
    args: {
        columns: [
            {
                key: "id",
                header: "출고요청번호",
                render: (value) => <span className="font-mono">{value}</span>,
            },
            {
                key: "campaign",
                header: "캠페인명",
            },
            {
                key: "status",
                header: "상태",
                render: (value) => getStatusBadge(value),
            },
        ],
        data: shippingData.slice(0, 3),
        onRowClick: (item, index) => {
            alert(`클릭한 행: ${(item as ShippingData).id} (인덱스: ${index})`);
        },
    },
};

export const CustomAlignment: Story = {
    args: {
        columns: [
            {
                key: "id",
                header: "번호",
                align: "left",
            },
            {
                key: "campaign",
                header: "캠페인명",
                align: "left",
            },
            {
                key: "skuCount",
                header: "SKU 수량",
                align: "center",
                render: (value) => <span className="font-bold text-lg">{value}</span>,
            },
            {
                key: "recipients",
                header: "수령인 수",
                align: "right",
                render: (value) => (
                    <div className="flex items-center justify-end gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{value}명</span>
                    </div>
                ),
            },
        ],
        data: shippingData.slice(0, 3),
    },
};
