import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton";

interface SkeletonProps {
    variant?: "text" | "circular" | "rectangular" | "rounded";
    width?: string | number;
    height?: string | number;
    animation?: "pulse" | "wave" | "none";
}

const meta: Meta<SkeletonProps> = {
    title: "Ui/Skeleton",
    component: Skeleton,
    tags: ["autodocs"],
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
    argTypes: {
        variant: {
            control: "select",
            options: ["text", "circular", "rectangular", "rounded"],
            description: "Skeleton shape variant",
        },
        width: {
            control: "text",
            description: "Width of the skeleton",
        },
        height: {
            control: "text",
            description: "Height of the skeleton",
        },
        animation: {
            control: "radio",
            options: ["pulse", "wave", "none"],
            description: "Animation type",
        },
    },
};

export default meta;
type Story = StoryObj<SkeletonProps>;

export const Default: Story = {
    args: {
        variant: "text",
        animation: "pulse",
    },
};

export const Variants: Story = {
    render: () => (
        <div className="space-y-4">
            <div>
                <p className="text-sm font-medium mb-2">Text</p>
                <Skeleton variant="text" width="100%" />
            </div>
            <div>
                <p className="text-sm font-medium mb-2">Circular</p>
                <Skeleton variant="circular" width={40} height={40} />
            </div>
            <div>
                <p className="text-sm font-medium mb-2">Rectangular</p>
                <Skeleton variant="rectangular" width={200} height={100} />
            </div>
            <div>
                <p className="text-sm font-medium mb-2">Rounded</p>
                <Skeleton variant="rounded" width={200} height={100} />
            </div>
        </div>
    ),
};

export const Animations: Story = {
    render: () => (
        <div className="space-y-4">
            <div>
                <p className="text-sm font-medium mb-2">Pulse</p>
                <Skeleton animation="pulse" width="100%" height={40} variant="rounded" />
            </div>
            <div>
                <p className="text-sm font-medium mb-2">Wave</p>
                <Skeleton animation="wave" width="100%" height={40} variant="rounded" />
            </div>
            <div>
                <p className="text-sm font-medium mb-2">None</p>
                <Skeleton animation="none" width="100%" height={40} variant="rounded" />
            </div>
        </div>
    ),
};

export const CardSkeleton: Story = {
    render: () => (
        <div className="max-w-sm border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="50%" />
                    <Skeleton variant="text" width="30%" />
                </div>
            </div>
            <Skeleton variant="rounded" width="100%" height={200} className="mb-4" />
            <div className="space-y-2">
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="70%" />
            </div>
        </div>
    ),
};

export const TableSkeleton: Story = {
    render: () => (
        <div className="w-full">
            <table className="w-full">
                <thead>
                    <tr className="border-b">
                        <th className="text-left p-2">
                            <Skeleton variant="text" width="60%" />
                        </th>
                        <th className="text-left p-2">
                            <Skeleton variant="text" width="40%" />
                        </th>
                        <th className="text-left p-2">
                            <Skeleton variant="text" width="50%" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(3)].map((_, i) => (
                        <tr key={i} className="border-b">
                            <td className="p-2">
                                <Skeleton variant="text" width="80%" />
                            </td>
                            <td className="p-2">
                                <Skeleton variant="text" width="60%" />
                            </td>
                            <td className="p-2">
                                <Skeleton variant="text" width="40%" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    ),
};

export const UsageExamples: Story = {
    render: () => (
        <div className="p-8 space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Article Loading</h3>
                <article className="max-w-2xl">
                    <Skeleton variant="text" width="60%" height={32} className="mb-2" />
                    <Skeleton variant="text" width="30%" className="mb-4" />
                    <div className="space-y-2">
                        <Skeleton variant="text" width="100%" />
                        <Skeleton variant="text" width="100%" />
                        <Skeleton variant="text" width="90%" />
                        <Skeleton variant="text" width="95%" />
                        <Skeleton variant="text" width="85%" />
                    </div>
                </article>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">User List Loading</h3>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Skeleton variant="circular" width={48} height={48} />
                            <div className="flex-1">
                                <Skeleton variant="text" width="30%" className="mb-1" />
                                <Skeleton variant="text" width="50%" />
                            </div>
                            <Skeleton variant="rounded" width={80} height={32} />
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Form Loading</h3>
                <div className="max-w-md space-y-4">
                    <div>
                        <Skeleton variant="text" width="20%" className="mb-1" />
                        <Skeleton variant="rounded" width="100%" height={40} />
                    </div>
                    <div>
                        <Skeleton variant="text" width="25%" className="mb-1" />
                        <Skeleton variant="rounded" width="100%" height={40} />
                    </div>
                    <Skeleton variant="rounded" width="30%" height={40} />
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            source: {
                code: null,
            },
        },
    },
};
