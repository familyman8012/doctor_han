import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import Pagination from "./Pagination";
import MobilePagination from "./MobilePagination";

const meta: Meta<typeof Pagination> = {
    title: "Widgets/Pagination",
    component: Pagination,
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
type Story = StoryObj<typeof Pagination>;

export const UsageExamples: Story = {
    render: () => {
        const PaginationExamples = () => {
            const [currentPage1, setCurrentPage1] = useState(1);
            const [currentPage2, setCurrentPage2] = useState(5);
            const [currentPage3, setCurrentPage3] = useState(1);
            const [mobilePage, setMobilePage] = useState(1);

            const itemsPerPage = 10;
            const totalCount = 150;
            const smallTotalCount = 30;

            return (
                <div className="p-8 space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Pagination Component Examples</h3>

                        <div className="space-y-8">
                            {/* Basic Pagination */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Basic Pagination (First Page)</h4>
                                <div className="p-4 bg-gray-50 rounded">
                                    <div className="text-xs text-gray-600 mb-2">
                                        Page {currentPage1} of {Math.ceil(totalCount / itemsPerPage)} (Total{" "}
                                        {totalCount} items)
                                    </div>
                                    <Pagination
                                        pageInfo={[currentPage1, itemsPerPage]}
                                        totalCount={totalCount}
                                        handlePageChange={setCurrentPage1}
                                    />
                                </div>
                            </div>

                            {/* Middle Page */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Pagination (Middle Page)</h4>
                                <div className="p-4 bg-gray-50 rounded">
                                    <div className="text-xs text-gray-600 mb-2">
                                        Page {currentPage2} of {Math.ceil(totalCount / itemsPerPage)} (Total{" "}
                                        {totalCount} items)
                                    </div>
                                    <Pagination
                                        pageInfo={[currentPage2, itemsPerPage]}
                                        totalCount={totalCount}
                                        handlePageChange={setCurrentPage2}
                                    />
                                </div>
                            </div>

                            {/* Few Pages */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Pagination with Few Pages</h4>
                                <div className="p-4 bg-gray-50 rounded">
                                    <div className="text-xs text-gray-600 mb-2">
                                        Page {currentPage3} of {Math.ceil(smallTotalCount / itemsPerPage)} (Total{" "}
                                        {smallTotalCount} items)
                                    </div>
                                    <Pagination
                                        pageInfo={[currentPage3, itemsPerPage]}
                                        totalCount={smallTotalCount}
                                        handlePageChange={setCurrentPage3}
                                    />
                                </div>
                            </div>

                            {/* Mobile Pagination */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Mobile Pagination</h4>
                                <div className="p-4 bg-gray-50 rounded max-w-sm">
                                    <div className="text-xs text-gray-600 mb-2">
                                        Simple pagination for mobile devices
                                    </div>
                                    <MobilePagination
                                        currentPage={mobilePage}
                                        totalPages={15}
                                        onPageChange={setMobilePage}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 rounded">
                        <h4 className="text-sm font-medium mb-2">Implementation Details</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>• react-js-pagination 라이브러리 사용</li>
                            <li>• pageInfo: [currentPage, itemsPerPage] 형식의 배열</li>
                            <li>• totalCount: 전체 아이템 개수</li>
                            <li>• handlePageChange: 페이지 변경 시 호출되는 콜백</li>
                            <li>• Tailwind CSS로 스타일링</li>
                        </ul>
                    </div>
                </div>
            );
        };

        return <PaginationExamples />;
    },
    parameters: {
        docs: {
            source: {
                code: null,
            },
        },
    },
};

const Default: Story = {
    render: (args) => {
        const PaginationExample = () => {
            const [currentPage, setCurrentPage] = useState(1);

            return (
                <div className="p-4">
                    <div className="text-sm mb-2">Current Page: {currentPage}</div>
                    <Pagination
                        {...args}
                        pageInfo={[currentPage, args.pageInfo[1]]}
                        handlePageChange={setCurrentPage}
                    />
                </div>
            );
        };

        return <PaginationExample />;
    },
    args: {
        pageInfo: [1, 10],
        totalCount: 100,
    },
};

const MobileVersion: Story = {
    render: () => {
        const MobileExample = () => {
            const [currentPage, setCurrentPage] = useState(1);

            return (
                <div className="p-4 max-w-sm">
                    <MobilePagination currentPage={currentPage} totalPages={10} onPageChange={setCurrentPage} />
                </div>
            );
        };

        return <MobileExample />;
    },
};

export { Default, MobileVersion };
