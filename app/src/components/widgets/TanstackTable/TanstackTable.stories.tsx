import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";
import "react-loading-skeleton/dist/skeleton.css";

import TanstackTable from "./TanstackTable";

interface SampleRow {
    id: string;
    name: string;
    email: string;
    team: string;
    joinedAt: string;
    projects: number;
}

const SAMPLE_DATA: SampleRow[] = Array.from({ length: 20 }).map((_, index) => ({
    id: `user-${index + 1}`,
    name: `사용자 ${index + 1}`,
    email: `user${index + 1}@example.com`,
    team: index % 2 === 0 ? "Growth" : "Platform",
    joinedAt: `2024-0${(index % 9) + 1}-15`,
    projects: Math.floor(Math.random() * 8) + 1,
}));

const columns: ColumnDef<SampleRow>[] = [
    {
        id: "select",
        size: 48,
        header: ({ table }) => (
            <input
                type="checkbox"
                checked={table.getIsAllRowsSelected()}
                ref={(input) => {
                    if (!input) return;
                    input.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
                }}
                onChange={(event) => table.toggleAllRowsSelected(event.target.checked)}
            />
        ),
        cell: ({ row }) => (
            <input
                type="checkbox"
                checked={row.getIsSelected()}
                ref={(input) => {
                    if (!input) return;
                    input.indeterminate = row.getIsSomeSelected();
                }}
                onChange={(event) => row.toggleSelected(event.target.checked)}
            />
        ),
        enableSorting: false,
        enableResizing: false,
    },
    {
        id: "name",
        accessorKey: "name",
        header: "이름",
        size: 160,
        cell: ({ getValue }) => <span className="text-sm font-medium text-[#0a3b41]">{getValue<string>()}</span>,
    },
    {
        id: "email",
        accessorKey: "email",
        header: "이메일",
        size: 220,
        cell: ({ getValue }) => <span className="text-sm text-[#5f6b6d]">{getValue<string>()}</span>,
    },
    {
        id: "team",
        accessorKey: "team",
        header: "팀",
        size: 140,
        cell: ({ getValue }) => <span className="text-sm text-[#0a3b41]">{getValue<string>()}</span>,
    },
    {
        id: "joined_at",
        accessorKey: "joinedAt",
        header: "입사일",
        size: 140,
        cell: ({ getValue }) => <span className="text-sm text-[#5f6b6d]">{getValue<string>()}</span>,
    },
    {
        id: "projects",
        accessorKey: "projects",
        header: "프로젝트 수",
        size: 140,
        cell: ({ getValue }) => <span className="text-sm text-[#0a3b41]">{getValue<number>()}</span>,
    },
];

const meta: Meta<typeof TanstackTable<SampleRow>> = {
    title: "Widgets/TanstackTable",
    component: TanstackTable,
    parameters: {
        layout: "fullscreen",
    },
};

export default meta;

type Story = StoryObj<typeof TanstackTable<SampleRow>>;

const BasicRender = () => {
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    return (
        <div className="p-6 bg-[#f4f7fa] min-h-screen">
            <TanstackTable<SampleRow>
                data={SAMPLE_DATA}
                columns={columns}
                enableRowSelection
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
            />
        </div>
    );
};

export const 기본: Story = {
    render: () => <BasicRender />,
};

const RemoteSortingRender = () => {
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [sorting, setSorting] = useState<SortingState>([]);

    return (
        <div className="p-6 bg-[#f4f7fa] min-h-screen">
            <TanstackTable<SampleRow>
                data={SAMPLE_DATA}
                columns={columns}
                manualSorting
                sorting={sorting}
                onSortingChange={setSorting}
                enableRowSelection
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
            />
        </div>
    );
};

export const 원격정렬: Story = {
    render: () => <RemoteSortingRender />,
};

export const 로딩: Story = {
    render: () => (
        <div className="p-6 bg-[#f4f7fa] min-h-screen">
            <TanstackTable<SampleRow> data={[]} columns={columns} isLoading />
        </div>
    ),
};

export const 빈데이터: Story = {
    render: () => (
        <div className="p-6 bg-[#f4f7fa] min-h-screen">
            <TanstackTable<SampleRow>
                data={[]}
                columns={columns}
                emptyState={<span className="text-sm text-[#5f6b6d]">데이터가 비어 있습니다.</span>}
            />
        </div>
    ),
};
