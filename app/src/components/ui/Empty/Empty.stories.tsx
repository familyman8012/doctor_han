import type { Meta, StoryObj } from "@storybook/react";
import { Empty } from "./Empty";
import { Search, ShoppingCart, Users, FileX, Inbox } from "lucide-react";

const meta: Meta<typeof Empty> = {
    title: "Ui/Empty",
    component: Empty,
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
type Story = StoryObj<typeof Empty>;

export const Default: Story = {
    args: {},
};

export const WithCustomText: Story = {
    args: {
        children: "검색 결과가 없습니다",
    },
};

export const WithIcon: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="border rounded-lg p-4">
                <Empty Icon={<Search />}>검색 결과가 없습니다</Empty>
            </div>

            <div className="border rounded-lg p-4">
                <Empty Icon={<ShoppingCart />}>장바구니가 비어있습니다</Empty>
            </div>

            <div className="border rounded-lg p-4">
                <Empty Icon={<Users />}>등록된 사용자가 없습니다</Empty>
            </div>
        </div>
    ),
};

export const WithDescription: Story = {
    render: () => (
        <div className="border rounded-lg p-4">
            <Empty Icon={<FileX />} title="파일을 찾을 수 없습니다" description="다른 검색어를 시도해보세요" />
        </div>
    ),
};

export const UsageExamples: Story = {
    render: () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Table Empty State</h3>
                <div className="border rounded-lg">
                    <table className="w-full">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Email</th>
                                <th className="text-left p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={3}>
                                    <Empty Icon={<Inbox />}>아직 데이터가 없습니다</Empty>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Card Grid Empty State</h3>
                <div className="border rounded-lg p-8 bg-gray-50">
                    <Empty Icon={<Search />} title="검색 결과가 없습니다" description="다른 키워드로 검색해보세요" />
                </div>
            </div>
        </div>
    ),
};
