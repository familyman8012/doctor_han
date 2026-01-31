import type { Meta, StoryObj } from "@storybook/react";
import { Radio, RadioGroup } from "./Radio";
import { useState } from "react";

interface RadioProps {
    label?: string;
    subText?: string;
    size?: "sm" | "md";
    checked?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
}

const meta: Meta<RadioProps> = {
    title: "Ui/Radio",
    component: Radio,
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
            description: "Radio size",
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
type Story = StoryObj<RadioProps>;

const DefaultRender = (args: RadioProps) => {
    const [checked, setChecked] = useState(args.checked || false);
    return <Radio {...args} checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
};

export const Default: Story = {
    render: (args) => <DefaultRender {...args} />,
    args: {
        label: "Option 1",
        size: "md",
    },
};

const RadioGroupExampleRender = () => {
    const [selected, setSelected] = useState("option1");

    return (
        <RadioGroup name="example" value={selected} onChange={(value) => setSelected(String(value))}>
            <Radio value="option1" label="Option 1" />
            <Radio value="option2" label="Option 2" />
            <Radio value="option3" label="Option 3" />
        </RadioGroup>
    );
};

export const RadioGroupExample: Story = {
    render: () => <RadioGroupExampleRender />,
};

const WithSubTextRender = () => {
    const [selected, setSelected] = useState("free");

    return (
        <RadioGroup name="plan" value={selected} onChange={(value) => setSelected(String(value))}>
            <Radio value="free" label="Free Plan" subText="Basic features for personal use" />
            <Radio value="pro" label="Pro Plan" subText="Advanced features for professionals" />
            <Radio value="enterprise" label="Enterprise Plan" subText="Full features with priority support" />
        </RadioGroup>
    );
};

export const WithSubText: Story = {
    render: () => <WithSubTextRender />,
};

const SizesRender = () => {
    const [smallSelected, setSmallSelected] = useState("small1");
    const [mediumSelected, setMediumSelected] = useState("medium1");

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium mb-2">Small</h3>
                <RadioGroup
                    name="small-group"
                    value={smallSelected}
                    onChange={(value) => setSmallSelected(String(value))}
                    direction="horizontal"
                >
                    <Radio size="sm" value="small1" label="Small 1" />
                    <Radio size="sm" value="small2" label="Small 2" />
                    <Radio size="sm" value="small3" label="Small 3" />
                </RadioGroup>
            </div>

            <div>
                <h3 className="text-sm font-medium mb-2">Medium</h3>
                <RadioGroup
                    name="medium-group"
                    value={mediumSelected}
                    onChange={(value) => setMediumSelected(String(value))}
                    direction="horizontal"
                >
                    <Radio size="md" value="medium1" label="Medium 1" />
                    <Radio size="md" value="medium2" label="Medium 2" />
                    <Radio size="md" value="medium3" label="Medium 3" />
                </RadioGroup>
            </div>
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
                <Radio label="Default" name="states" value="default" />
                <Radio label="Checked" name="states" value="checked" checked={true} readOnly />
                <Radio label="Disabled" name="states" value="disabled" disabled />
                <Radio label="Disabled Checked" name="states" value="disabled-checked" disabled checked={true} />
                <Radio label="Read Only" name="states" value="readonly" readOnly />
                <Radio label="Read Only Checked" name="states" value="readonly-checked" readOnly checked={true} />
            </div>
        );
    },
};

const UsageExamplesRender = () => {
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [shippingSpeed, setShippingSpeed] = useState("standard");

    return (
        <div className="p-8 space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                <RadioGroup
                    name="payment"
                    value={paymentMethod}
                    onChange={(value) => setPaymentMethod(String(value))}
                >
                    <Radio value="card" label="Credit/Debit Card" subText="Visa, Mastercard, American Express" />
                    <Radio value="paypal" label="PayPal" subText="Redirect to PayPal for payment" />
                    <Radio value="bank" label="Bank Transfer" subText="Direct transfer from your bank account" />
                </RadioGroup>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Shipping Speed</h3>
                <RadioGroup
                    name="shipping"
                    value={shippingSpeed}
                    onChange={(value) => setShippingSpeed(String(value))}
                    direction="horizontal"
                >
                    <Radio value="standard" label="Standard (5-7 days)" />
                    <Radio value="express" label="Express (2-3 days)" />
                    <Radio value="overnight" label="Overnight" />
                </RadioGroup>
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
