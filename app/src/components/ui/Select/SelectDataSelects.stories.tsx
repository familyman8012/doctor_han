import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { PartnerSelect } from "./PartnerSelect/PartnerSelect";
import { SkuSelect } from "./SkuSelect/SkuSelect";
import { UserSelect } from "./UserSelect";
import type { PartnerListResponse } from "@/lib/schema/partner/partner.schema";
import type { SkuListResponse } from "@/lib/schema/sku";
import type { EmployeeListResponse } from "@/lib/schema/employee";

const meta: Meta<typeof PartnerSelect> = {
    title: "Ui/Select/DataDriven",
};

export default meta;

type PartnerStory = StoryObj<typeof PartnerSelect>;
type SkuStory = StoryObj<typeof PartnerSelect>;
type UserStory = StoryObj<typeof PartnerSelect>;

const partnerListMock: PartnerListResponse = {
    items: [
        {
            id: "f4a2c500-1c1b-4b0c-b435-673d7c6e1111",
            partnerCode: "PT-0001",
            legacyPartnerCode: "LG-001",
            categoryCode: "DISTRIBUTOR",
            categoryName: "총판",
            brandLabel: "네오브랜드",
            legalName: "네오 주식회사",
            partnerType: "CORP",
            status: "ACTIVE",
            countryCode: "KR",
            primaryEmail: "contact@neo.example.com",
            primaryPhone: "02-1234-5678",
            updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
            id: "6a8207a1-2a6f-4df1-9ae0-6a44f2592222",
            partnerCode: "PT-0002",
            legacyPartnerCode: "LG-002",
            categoryCode: "RESELLER",
            categoryName: "리셀러",
            brandLabel: "에버브랜드",
            legalName: "에버 상사",
            partnerType: "CORP",
            status: "ACTIVE",
            countryCode: "KR",
            primaryEmail: "sales@ever.example.com",
            primaryPhone: "031-111-2222",
            updatedAt: "2024-01-02T00:00:00.000Z",
        },
    ],
    total: 2,
    page: 1,
    pageSize: 20,
};

const skuListMock: SkuListResponse = {
    items: [
        {
            itemCode: "SKU-001",
            itemName: "네오 키트",
            itemNameAlias: "Neo Kit",
            brandName: "네오",
            status: "ACTIVE",
            releaseDate: "2024-01-10",
            image: null,
            stockQuantity: 0,
            stockUpdatedAt: null,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-05T00:00:00.000Z",
            salesGroup: {
                id: 1001,
                reprItemCode: "SKU-001",
                status: "ACTIVE",
                salesStatus: "ON_SALE",
                hidden: false,
                memo: null,
                members: [],
            },
        },
        {
            itemCode: "SKU-002",
            itemName: "에버 패키지",
            itemNameAlias: "Ever Package",
            brandName: "에버",
            status: "ACTIVE",
            releaseDate: "2024-02-01",
            image: null,
            stockQuantity: 0,
            stockUpdatedAt: null,
            createdAt: "2024-01-15T00:00:00.000Z",
            updatedAt: "2024-02-01T00:00:00.000Z",
            salesGroup: null,
        },
    ],
    total: 2,
    page: 1,
    pageSize: 20,
};

const employeeListMock: EmployeeListResponse = {
    items: [
        {
            legacy: {
                legacyUserId: 1,
                email: "minseo.lee@example.com",
                name: "Minseo Lee",
                nameKr: "이민서",
                title: "Sales Manager",
                tel: "010-1234-5678",
                slackId: "U123456",
                slackTeamId: "T123456",
                flexId: "F123456",
                deleted: false,
                image: null,
                notionId: null,
                createdAt: "2023-12-01T00:00:00.000Z",
                updatedAt: "2024-01-10T00:00:00.000Z",
            },
            identity: {
                identityId: "8b4ebd9c-5a0d-4bfa-8302-6fd063555555",
                legacyUserId: 1,
                userId: "ab3df0be-92ad-4d34-9467-7dc0be333333",
                personOrgId: "7c8d4c61-4f5c-4c83-b9c3-8f4e77bbbbbb",
                linkedBy: null,
                linkedAt: "2023-12-05T00:00:00.000Z",
                note: null,
            },
            user: {
                id: "ab3df0be-92ad-4d34-9467-7dc0be333333",
                email: "minseo.lee@example.com",
                name: "Minseo Lee",
                role: "manager",
                isActive: true,
                image: null,
                lastLoginAt: "2024-01-15T00:00:00.000Z",
                createdAt: "2023-12-01T00:00:00.000Z",
                updatedAt: "2024-01-10T00:00:00.000Z",
            },
            personOrg: {
                orgId: "7c8d4c61-4f5c-4c83-b9c3-8f4e77bbbbbb",
                name: "Sales Team",
                unitType: "TEAM",
                path: "HQ / Sales",
                deletedAt: null,
            },
        },
        {
            legacy: {
                legacyUserId: 2,
                email: "hyunwoo.kim@example.com",
                name: "Hyunwoo Kim",
                nameKr: "김현우",
                title: "Account Executive",
                tel: "010-9876-5432",
                slackId: "U654321",
                slackTeamId: "T123456",
                flexId: "F654321",
                deleted: false,
                image: null,
                notionId: null,
                createdAt: "2023-11-20T00:00:00.000Z",
                updatedAt: "2024-01-08T00:00:00.000Z",
            },
            identity: null,
            user: null,
            personOrg: null,
        },
    ],
    total: 2,
    page: 1,
    pageSize: 20,
};

function createQueryClient(setter: (client: QueryClient) => void) {
    const client = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: Infinity,
                gcTime: Infinity,
            },
        },
    });

    setter(client);
    return client;
}

export const PartnerSelectScenario: PartnerStory = {
    render: () => {
        const [queryClient] = useState(() =>
            createQueryClient((client) => {
                client.setQueryData(["partners"], partnerListMock);
            }),
        );

        const [value, setValue] = useState<string | null>(partnerListMock.items[0]?.id ?? null);

        return (
            <QueryClientProvider client={queryClient}>
                <div className="w-[360px] space-y-3">
                    <PartnerSelect
                        label="거래처 선택"
                        value={value}
                        onChange={setValue}
                        required
                    />
                </div>
            </QueryClientProvider>
        );
    },
};

export const SkuSelectScenario: SkuStory = {
    render: () => {
        const [queryClient] = useState(() =>
            createQueryClient((client) => {
                client.setQueryData(["skus", { brand: undefined, status: undefined, salesGroupId: undefined }], skuListMock);
            }),
        );

        const [value, setValue] = useState<string | null>(null);

        return (
            <QueryClientProvider client={queryClient}>
                <div className="w-[360px] space-y-3">
                    <SkuSelect
                        label="SKU 선택"
                        value={value}
                        onChange={(next) => setValue(next)}
                        required
                    />
                </div>
            </QueryClientProvider>
        );
    },
};

export const UserSelectScenario: UserStory = {
    render: () => {
        const [queryClient] = useState(() =>
            createQueryClient((client) => {
                client.setQueryData(["employees", "all", { filterDeleted: true }], employeeListMock);
            }),
        );

        const [value, setValue] = useState<string | null>(employeeListMock.items[0]?.identity?.identityId ?? null);

        return (
            <QueryClientProvider client={queryClient}>
                <div className="w-[360px] space-y-3">
                    <UserSelect
                        label="담당자 선택"
                        value={value}
                        onChange={setValue}
                        required
                        showCurrentUserFirst={false}
                    />
                </div>
            </QueryClientProvider>
        );
    },
};
