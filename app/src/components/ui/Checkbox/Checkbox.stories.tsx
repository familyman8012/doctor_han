import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";
import { useState } from "react";

interface CheckboxProps {
    label?: string;
    subText?: string;
    size?: "sm" | "md";
    checked?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
}

const meta: Meta<CheckboxProps> = {
    title: "Ui/Checkbox",
    component: Checkbox,
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
            options: ["sm", "md"],
            description: "Checkbox size",
        },
        label: {
            control: "text",
            description: "Main label text",
        },
        subText: {
            control: "text",
            description: "Sub text below the label",
        },
        checked: {
            control: "boolean",
            description: "Checked state",
        },
        disabled: {
            control: "boolean",
            description: "Disabled state",
        },
        readOnly: {
            control: "boolean",
            description: "Read-only state",
        },
    },
};

export default meta;
type Story = StoryObj<CheckboxProps>;

const DefaultRender = (args: CheckboxProps) => {
    const [checked, setChecked] = useState(args.checked || false);
    return <Checkbox {...args} checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
};

export const Default: Story = {
    render: (args) => <DefaultRender {...args} />,
    args: {
        label: "Remember me",
        size: "md",
    },
};

const WithSubTextRender = (args: CheckboxProps) => {
    const [checked, setChecked] = useState(args.checked || false);
    return <Checkbox {...args} checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
};

export const WithSubText: Story = {
    render: (args) => <WithSubTextRender {...args} />,
    args: {
        label: "I agree to the terms",
        subText: "You agree to our Terms of Service and Privacy Policy.",
        size: "md",
    },
};

const SizesRender = () => {
    const [smallChecked, setSmallChecked] = useState(false);
    const [mediumChecked, setMediumChecked] = useState(false);

    return (
        <div className="space-y-4">
            <Checkbox
                size="sm"
                label="Small checkbox"
                checked={smallChecked}
                onChange={(e) => setSmallChecked(e.target.checked)}
            />
            <Checkbox
                size="md"
                label="Medium checkbox"
                checked={mediumChecked}
                onChange={(e) => setMediumChecked(e.target.checked)}
            />
        </div>
    );
};

export const Sizes: Story = {
    render: () => <SizesRender />,
};

export const States: Story = {
    render: () => {
        return (
            <div className="space-y-4">
                <Checkbox label="Default" />
                <Checkbox label="Checked" checked={true} readOnly />
                <Checkbox label="Disabled" disabled />
                <Checkbox label="Disabled Checked" disabled checked={true} />
                <Checkbox label="Read Only" readOnly />
                <Checkbox label="Read Only Checked" readOnly checked={true} />
            </div>
        );
    },
};

const UsageExamplesRender = () => {
    const [terms, setTerms] = useState(false);
    const [newsletter, setNewsletter] = useState(false);
    const [notifications, setNotifications] = useState({
        email: false,
        sms: false,
        push: false,
    });

    return (
        <div className="p-8 space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Form Example</h3>
                <div className="space-y-3">
                    <Checkbox
                        label="I agree to the terms and conditions"
                        subText="Please read our terms carefully before proceeding."
                        checked={terms}
                        onChange={(e) => setTerms(e.target.checked)}
                    />
                    <Checkbox
                        label="Subscribe to newsletter"
                        checked={newsletter}
                        onChange={(e) => setNewsletter(e.target.checked)}
                    />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                    <Checkbox
                        label="Email notifications"
                        checked={notifications.email}
                        onChange={(e) => setNotifications((prev) => ({ ...prev, email: e.target.checked }))}
                    />
                    <Checkbox
                        label="SMS notifications"
                        checked={notifications.sms}
                        onChange={(e) => setNotifications((prev) => ({ ...prev, sms: e.target.checked }))}
                    />
                    <Checkbox
                        label="Push notifications"
                        checked={notifications.push}
                        onChange={(e) => setNotifications((prev) => ({ ...prev, push: e.target.checked }))}
                    />
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
