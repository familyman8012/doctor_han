import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Tabs, type TabsProps } from "./Tab";

type StoryProps = TabsProps;

const meta: Meta<StoryProps> = {
    title: "Ui/Tab",
    component: Tabs,
    tags: ["autodocs"],
    args: {
        id: "tabs-example",
        tabs: [{ title: "Tab 1" }, { title: "Tab 2", label: "3" }, { title: "Tab 3" }],
        activeTabIndex: 0,
    },
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
};

export default meta;
type Story = StoryObj<StoryProps>;

const InteractiveTabs = (args: StoryProps) => {
    const [activeIndex, setActiveIndex] = useState(args.activeTabIndex);

    return <Tabs {...args} activeTabIndex={activeIndex} onTabChange={setActiveIndex} />;
};

export const Default: Story = {
    render: (args) => <InteractiveTabs {...args} />,
    args: {
        tabs: [{ title: "Overview" }, { title: "Details" }, { title: "Settings" }],
    },
};

export const WithLabels: Story = {
    render: (args) => <InteractiveTabs {...args} />,
    args: {
        tabs: [
            { title: "Overview", label: "12" },
            { title: "Details", label: "New" },
            { title: "Settings", label: "3" },
        ],
    },
};

export const ManyTabs: Story = {
    render: (args) => <InteractiveTabs {...args} />,
    args: {
        tabs: [
            { title: "Dashboard" },
            { title: "Analytics", label: "5" },
            { title: "Reports" },
            { title: "Users", label: "23" },
            { title: "Settings" },
            { title: "Logs" },
            { title: "Documentation" },
        ],
    },
};

const UsageExamplesRender = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [activeTab2, setActiveTab2] = useState(1);

    return (
        <div className="p-8 space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Basic Usage</h3>
                <Tabs
                    id="basic-tabs"
                    tabs={[{ title: "Home" }, { title: "Products" }, { title: "About" }]}
                    activeTabIndex={activeTab}
                    onTabChange={setActiveTab}
                />
                <div className="mt-4 p-4 bg-gray-50 rounded">
                    <p>Active tab index: {activeTab}</p>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">With Badges</h3>
                <Tabs
                    id="badge-tabs"
                    tabs={[
                        { title: "Inbox", label: "12" },
                        { title: "Drafts", label: "3" },
                        { title: "Sent" },
                        { title: "Spam", label: "99+" },
                    ]}
                    activeTabIndex={activeTab2}
                    onTabChange={setActiveTab2}
                />
                <div className="mt-4 p-4 bg-gray-50 rounded">
                    <p>Active tab: {["Inbox", "Drafts", "Sent", "Spam"][activeTab2]}</p>
                </div>
            </div>
        </div>
    );
};

export const UsageExamples: Story = {
    render: () => <UsageExamplesRender />,
    parameters: {
        docs: {
            source: {
                code: null,
            },
        },
    },
};
