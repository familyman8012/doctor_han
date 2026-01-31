import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from "./Toggle";
import { useState } from "react";

interface ToggleProps {
    variant?: "primary" | "red" | "green";
    checked?: boolean;
    disabled?: boolean;
    loading?: boolean;
}

const meta: Meta<ToggleProps> = {
    title: "Ui/Toggle",
    component: Toggle,
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
            control: "radio",
            options: ["primary", "red", "green"],
            description: "Toggle color variant",
        },
        checked: {
            control: "boolean",
            description: "Checked state",
        },
        disabled: {
            control: "boolean",
            description: "Disabled state",
        },
        loading: {
            control: "boolean",
            description: "Loading state",
        },
    },
};

export default meta;
type Story = StoryObj<ToggleProps>;

const DefaultRender = (args: ToggleProps) => {
    const [checked, setChecked] = useState(args.checked || false);
    return <Toggle {...args} checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
};

export const Default: Story = {
    render: (args) => <DefaultRender {...args} />,
    args: {
        variant: "primary",
    },
};

const VariantsRender = () => {
    const [primary, setPrimary] = useState(false);
    const [red, setRed] = useState(false);
    const [green, setGreen] = useState(true);

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Toggle variant="primary" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
                <span className="text-sm">Primary</span>
            </div>
            <div className="flex items-center gap-2">
                <Toggle variant="red" checked={red} onChange={(e) => setRed(e.target.checked)} />
                <span className="text-sm">Red</span>
            </div>
            <div className="flex items-center gap-2">
                <Toggle variant="green" checked={green} onChange={(e) => setGreen(e.target.checked)} />
                <span className="text-sm">Green</span>
            </div>
        </div>
    );
};

export const Variants: Story = {
    render: () => <VariantsRender />,
};

export const States: Story = {
    render: () => {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Toggle />
                    <span className="text-sm">Default</span>
                </div>
                <div className="flex items-center gap-2">
                    <Toggle checked={true} onChange={() => {}} />
                    <span className="text-sm">Checked</span>
                </div>
                <div className="flex items-center gap-2">
                    <Toggle disabled />
                    <span className="text-sm">Disabled</span>
                </div>
                <div className="flex items-center gap-2">
                    <Toggle disabled checked={true} />
                    <span className="text-sm">Disabled Checked</span>
                </div>
                <div className="flex items-center gap-2">
                    <Toggle loading />
                    <span className="text-sm">Loading</span>
                </div>
            </div>
        );
    },
};

const UsageExamplesRender = () => {
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        sms: false,
    });

    const [features, setFeatures] = useState({
        darkMode: false,
        autoSave: true,
        analytics: true,
    });

    return (
        <div className="p-8 space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive email updates about your account</p>
                        </div>
                        <Toggle
                            checked={notifications.email}
                            onChange={(e) => setNotifications((prev) => ({ ...prev, email: e.target.checked }))}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                        </div>
                        <Toggle
                            checked={notifications.push}
                            onChange={(e) => setNotifications((prev) => ({ ...prev, push: e.target.checked }))}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium">SMS Notifications</p>
                            <p className="text-sm text-gray-500">Receive SMS updates for important alerts</p>
                        </div>
                        <Toggle
                            checked={notifications.sms}
                            onChange={(e) => setNotifications((prev) => ({ ...prev, sms: e.target.checked }))}
                        />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Feature Toggles</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Dark Mode</span>
                        <Toggle
                            variant="primary"
                            checked={features.darkMode}
                            onChange={(e) => setFeatures((prev) => ({ ...prev, darkMode: e.target.checked }))}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Auto-save</span>
                        <Toggle
                            variant="green"
                            checked={features.autoSave}
                            onChange={(e) => setFeatures((prev) => ({ ...prev, autoSave: e.target.checked }))}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Analytics</span>
                        <Toggle
                            variant={features.analytics ? "green" : "red"}
                            checked={features.analytics}
                            onChange={(e) => setFeatures((prev) => ({ ...prev, analytics: e.target.checked }))}
                        />
                    </div>
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
