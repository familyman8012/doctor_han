import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { Search, Mail, AlertCircle, User, Lock } from "lucide-react";
import { useState } from "react";

interface InputProps {
    label?: string;
    leadingText?: string;
    placeholder?: string;
    error?: string;
    helperText?: string;
    disabled?: boolean;
    readOnly?: boolean;
    type?: string;
}

const meta: Meta<InputProps> = {
    title: "Ui/Input",
    component: Input,
    tags: ["autodocs"],
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
    argTypes: {
        label: {
            control: "text",
            description: "Input label",
        },
        leadingText: {
            control: "text",
            description: "Text prefix for the input",
        },
        placeholder: {
            control: "text",
            description: "Placeholder text",
        },
        error: {
            control: "text",
            description: "Error message",
        },
        helperText: {
            control: "text",
            description: "Helper text",
        },
        disabled: {
            control: "boolean",
            description: "Disabled state",
        },
        readOnly: {
            control: "boolean",
            description: "Read-only state",
        },
        type: {
            control: "select",
            options: ["text", "email", "password", "number", "tel", "url"],
            description: "Input type",
        },
    },
};

export default meta;
type Story = StoryObj<InputProps>;

export const Default: Story = {
    render: (args) => {
        const [value, setValue] = useState("");

        return <Input {...args} value={value} onChange={(e) => setValue(e.target.value)} />;
    },
    args: {
        label: "Email",
        placeholder: "Enter your email",
        type: "email",
    },
};

export const WithIcons: Story = {
    render: () => {
        const [search, setSearch] = useState("");
        const [email, setEmail] = useState("");

        return (
            <div className="space-y-4 max-w-md">
                <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    LeadingIcon={<Search />}
                />
                <Input
                    label="Email Address"
                    placeholder="john@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    LeadingIcon={<Mail />}
                    TrailingIcon={<AlertCircle />}
                />
            </div>
        );
    },
};

export const WithLeadingText: Story = {
    render: () => {
        const [website, setWebsite] = useState("");
        const [price, setPrice] = useState("");

        return (
            <div className="space-y-4 max-w-md">
                <Input
                    label="Website"
                    leadingText="https://"
                    placeholder="www.example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                />
                <Input
                    label="Price"
                    leadingText="$"
                    placeholder="0.00"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    helperText="Enter amount in USD"
                />
            </div>
        );
    },
};

export const States: Story = {
    render: () => {
        return (
            <div className="space-y-4 max-w-md">
                <Input label="Default" placeholder="Default input" />
                <Input label="With Helper Text" placeholder="Enter your name" helperText="This field is optional" />
                <Input
                    label="With Error"
                    placeholder="Enter email"
                    value="invalid-email"
                    error="Please enter a valid email address"
                />
                <Input label="Disabled" placeholder="Disabled input" disabled />
                <Input label="Read Only" value="Read only value" readOnly />
            </div>
        );
    },
};

export const UsageExamples: Story = {
    render: () => {
        const [formData, setFormData] = useState({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            budget: "",
        });

        const [errors, setErrors] = useState<Record<string, string>>({});

        const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({ ...prev, [field]: e.target.value }));
            // Clear error when user starts typing
            if (errors[field]) {
                setErrors((prev) => ({ ...prev, [field]: "" }));
            }
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const newErrors: Record<string, string> = {};

            if (!formData.username) newErrors.username = "Username is required";
            if (!formData.email) newErrors.email = "Email is required";
            else if (!formData.email.includes("@")) newErrors.email = "Invalid email format";
            if (!formData.password) newErrors.password = "Password is required";
            else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            }

            setErrors(newErrors);

            if (Object.keys(newErrors).length === 0) {
                alert("Form submitted successfully!");
            }
        };

        return (
            <div className="p-8">
                <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Sign Up Form</h3>

                    <Input
                        label="Username"
                        placeholder="Choose a username"
                        value={formData.username}
                        onChange={handleChange("username")}
                        error={errors.username}
                        LeadingIcon={<User />}
                    />

                    <Input
                        label="Email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleChange("email")}
                        error={errors.email}
                        helperText="We'll never share your email"
                        LeadingIcon={<Mail />}
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange("password")}
                        error={errors.password}
                        helperText="Must be at least 8 characters"
                        LeadingIcon={<Lock />}
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleChange("confirmPassword")}
                        error={errors.confirmPassword}
                        LeadingIcon={<Lock />}
                    />

                    <Input
                        label="Monthly Budget (Optional)"
                        leadingText="$"
                        placeholder="0.00"
                        type="number"
                        value={formData.budget}
                        onChange={handleChange("budget")}
                        helperText="Set your monthly spending limit"
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Sign Up
                    </button>
                </form>
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
