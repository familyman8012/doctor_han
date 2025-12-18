import type { Meta, StoryObj } from "@storybook/react";
import { ButtonGroup, SegmentedControl } from "./ButtonGroup";
import { useState } from "react";
import { LayoutGrid, List, Grid3X3 } from "lucide-react";

const meta: Meta<typeof ButtonGroup> = {
    title: "Ui/ButtonGroup",
    component: ButtonGroup,
    tags: ["autodocs"],
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
    argTypes: {
        size: {
            control: "radio",
            options: ["sm", "md", "lg"],
            description: "Button group size",
        },
        orientation: {
            control: "radio",
            options: ["horizontal", "vertical"],
            description: "Button group orientation",
        },
    },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
    args: {
        size: "md",
        orientation: "horizontal",
        options: [
            { value: "option1", label: "Option 1" },
            { value: "option2", label: "Option 2" },
            { value: "option3", label: "Option 3" },
        ],
    },
    render: (args) => {
        const [value, setValue] = useState(args.options?.[0]?.value ?? "option1");

        return <ButtonGroup {...args} value={value} onChange={setValue} />;
    },
};

export const Sizes: Story = {
    render: () => {
        const [small, setSmall] = useState("left");
        const [medium, setMedium] = useState("center");
        const [large, setLarge] = useState("right");

        return (
            <div className="space-y-4">
                <div>
                    <p className="text-sm font-medium mb-2">Small</p>
                    <ButtonGroup
                        size="sm"
                        options={[
                            { value: "left", label: "Left" },
                            { value: "center", label: "Center" },
                            { value: "right", label: "Right" },
                        ]}
                        value={small}
                        onChange={setSmall}
                    />
                </div>
                <div>
                    <p className="text-sm font-medium mb-2">Medium</p>
                    <ButtonGroup
                        size="md"
                        options={[
                            { value: "left", label: "Left" },
                            { value: "center", label: "Center" },
                            { value: "right", label: "Right" },
                        ]}
                        value={medium}
                        onChange={setMedium}
                    />
                </div>
                <div>
                    <p className="text-sm font-medium mb-2">Large</p>
                    <ButtonGroup
                        size="lg"
                        options={[
                            { value: "left", label: "Left" },
                            { value: "center", label: "Center" },
                            { value: "right", label: "Right" },
                        ]}
                        value={large}
                        onChange={setLarge}
                    />
                </div>
            </div>
        );
    },
};

export const WithIcons: Story = {
    render: () => {
        const [view, setView] = useState("grid");

        return (
            <ButtonGroup
                options={[
                    { value: "grid", content: <LayoutGrid className="h-4 w-4" /> },
                    { value: "list", content: <List className="h-4 w-4" /> },
                    { value: "gallery", content: <Grid3X3 className="h-4 w-4" /> },
                ]}
                value={view}
                onChange={setView}
            />
        );
    },
};

export const Vertical: Story = {
    render: () => {
        const [value, setValue] = useState("profile");

        return (
            <ButtonGroup
                orientation="vertical"
                options={[
                    { value: "profile", label: "Profile" },
                    { value: "settings", label: "Settings" },
                    { value: "notifications", label: "Notifications" },
                    { value: "security", label: "Security" },
                ]}
                value={value}
                onChange={setValue}
            />
        );
    },
};

export const SegmentedControlExample: Story = {
    render: () => {
        const [value, setValue] = useState("day");

        return (
            <div className="space-y-4">
                <div>
                    <p className="text-sm font-medium mb-2">Segmented Control Style</p>
                    <SegmentedControl
                        options={[
                            { value: "day", label: "Day" },
                            { value: "week", label: "Week" },
                            { value: "month", label: "Month" },
                            { value: "year", label: "Year" },
                        ]}
                        value={value}
                        onChange={setValue}
                    />
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Regular Button Group Style</p>
                    <ButtonGroup
                        options={[
                            { value: "day", label: "Day" },
                            { value: "week", label: "Week" },
                            { value: "month", label: "Month" },
                            { value: "year", label: "Year" },
                        ]}
                        value={value}
                        onChange={setValue}
                    />
                </div>
            </div>
        );
    },
};

export const WithDisabled: Story = {
    render: () => {
        const [value, setValue] = useState("active");

        return (
            <ButtonGroup
                options={[
                    { value: "active", label: "Active" },
                    { value: "disabled", label: "Disabled", disabled: true },
                    { value: "pending", label: "Pending" },
                ]}
                value={value}
                onChange={setValue}
            />
        );
    },
};

export const UsageExamples: Story = {
    render: () => {
        const [sortBy, setSortBy] = useState("newest");
        const [viewMode, setViewMode] = useState("grid");
        const [timeRange, setTimeRange] = useState("7d");
        const [tabValue, setTabValue] = useState("overview");

        return (
            <div className="p-8 space-y-8">
                <div>
                    <h3 className="text-lg font-semibold mb-4">Sort Options</h3>
                    <ButtonGroup
                        size="sm"
                        options={[
                            { value: "newest", label: "Newest" },
                            { value: "oldest", label: "Oldest" },
                            { value: "popular", label: "Most Popular" },
                            { value: "price-low", label: "Price: Low to High" },
                            { value: "price-high", label: "Price: High to Low" },
                        ]}
                        value={sortBy}
                        onChange={setSortBy}
                    />
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">View Mode</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">View as:</span>
                        <ButtonGroup
                            options={[
                                {
                                    value: "grid",
                                    content: (
                                        <>
                                            <LayoutGrid className="h-4 w-4 mr-2" /> Grid
                                        </>
                                    ),
                                },
                                {
                                    value: "list",
                                    content: (
                                        <>
                                            <List className="h-4 w-4 mr-2" /> List
                                        </>
                                    ),
                                },
                            ]}
                            value={viewMode}
                            onChange={setViewMode}
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Time Range Selector</h3>
                    <SegmentedControl
                        options={[
                            { value: "1d", label: "1D" },
                            { value: "7d", label: "7D" },
                            { value: "1m", label: "1M" },
                            { value: "3m", label: "3M" },
                            { value: "1y", label: "1Y" },
                            { value: "all", label: "All" },
                        ]}
                        value={timeRange}
                        onChange={setTimeRange}
                    />
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Tab Navigation</h3>
                    <SegmentedControl
                        size="lg"
                        options={[
                            { value: "overview", label: "Overview" },
                            { value: "analytics", label: "Analytics" },
                            { value: "reports", label: "Reports" },
                            { value: "settings", label: "Settings" },
                        ]}
                        value={tabValue}
                        onChange={setTabValue}
                    />
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">Current tab: {tabValue}</p>
                    </div>
                </div>
            </div>
        );
    },
    parameters: {
        docs: {
            source: {
                code: null,
            },
        },
    },
};
