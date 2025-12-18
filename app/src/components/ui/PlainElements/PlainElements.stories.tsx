import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PlainElements } from "./PlainElements";

const meta: Meta = {
    title: "Ui/PlainElements",
    component: PlainElements,
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
type Story = StoryObj;

export const AllElements: Story = {
    render: () => <PlainElements />,
};

export const FormExample: Story = {
    render: () => {
        const [formData, setFormData] = React.useState({
            name: "",
            email: "",
            country: "kr",
            message: "",
            terms: false,
            newsletter: "yes",
        });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            alert(JSON.stringify(formData, null, 2));
        };

        return (
            <div className="p-8 max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold mb-6">Contact Form (Plain Elements)</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="plain">First Name</label>
                            <input
                                type="text"
                                className="plain"
                                placeholder="John"
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="plain">Email Address</label>
                            <input
                                type="email"
                                className="plain"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="plain">Country</label>
                        <select
                            className="plain"
                            value={formData.country}
                            onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                        >
                            <option value="kr">South Korea</option>
                            <option value="us">United States</option>
                            <option value="jp">Japan</option>
                            <option value="cn">China</option>
                        </select>
                    </div>

                    <div>
                        <label className="plain">Message</label>
                        <textarea
                            className="plain"
                            placeholder="Your message..."
                            rows={4}
                            value={formData.message}
                            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                        />
                        <p className="helper-text">Maximum 500 characters</p>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="plain"
                                checked={formData.terms}
                                onChange={(e) => setFormData((prev) => ({ ...prev, terms: e.target.checked }))}
                            />
                            <span className="text-sm">I agree to the terms and conditions</span>
                        </label>

                        <div>
                            <p className="text-sm font-medium mb-2">Subscribe to newsletter?</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        className="plain"
                                        name="newsletter"
                                        value="yes"
                                        checked={formData.newsletter === "yes"}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, newsletter: e.target.value }))
                                        }
                                    />
                                    <span className="text-sm">Yes, subscribe me</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        className="plain"
                                        name="newsletter"
                                        value="no"
                                        checked={formData.newsletter === "no"}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, newsletter: e.target.value }))
                                        }
                                    />
                                    <span className="text-sm">No, thanks</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Submit
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={() =>
                                setFormData({
                                    name: "",
                                    email: "",
                                    country: "kr",
                                    message: "",
                                    terms: false,
                                    newsletter: "yes",
                                })
                            }
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        );
    },
};

export const ComparisonWithComponents: Story = {
    render: () => (
        <div className="p-8">
            <h2 className="text-xl font-semibold mb-6">Plain Elements vs Custom Components</h2>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-medium mb-4">Plain Elements</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="plain">Plain Input</label>
                            <input type="text" className="plain" placeholder="Simple and fast" />
                        </div>

                        <div>
                            <label className="plain">Plain Select</label>
                            <select className="plain">
                                <option>Option A</option>
                                <option>Option B</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="plain" />
                                <span>Plain Checkbox</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" className="plain" name="plain-radio" />
                                <span>Plain Radio</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                            ✅ Lightweight, no JS required
                            <br />✅ Perfect for simple forms
                            <br />✅ Native browser behavior
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-4">Custom Components</h3>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Use custom Input, Select, Checkbox, Radio components for:
                        </p>
                        <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                            <li>Complex validation</li>
                            <li>Custom icons and addons</li>
                            <li>Advanced interaction patterns</li>
                            <li>Consistent component API</li>
                            <li>TypeScript support</li>
                        </ul>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                            ✅ Rich features
                            <br />✅ Consistent API
                            <br />✅ Better for complex apps
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h4 className="font-medium mb-2">When to use Plain Elements?</h4>
                <ul className="text-sm space-y-1">
                    <li>• Quick prototypes and simple forms</li>
                    <li>• When you need native browser behavior</li>
                    <li>• Performance-critical pages with many inputs</li>
                    <li>• Server-rendered forms without client-side JS</li>
                </ul>
            </div>
        </div>
    ),
};

export const CodeSnippets: Story = {
    render: () => (
        <div className="p-8 space-y-6">
            <h2 className="text-xl font-semibold mb-6">Quick Copy Code Snippets</h2>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Form Field</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-xs">
                            {`<div>
  <label class="plain">Username</label>
  <input type="text" class="plain" />
  <p class="helper-text">Choose a unique username</p>
</div>`}
                        </pre>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Form Field with Error</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-xs">
                            {`<div>
  <label class="plain">Email</label>
  <input type="email" class="plain" 
    style="border-color: var(--color-error-300)" />
  <p class="error-text">Invalid email address</p>
</div>`}
                        </pre>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Checkbox Group</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-xs">
                            {`<div class="space-y-2">
  <label class="flex items-center gap-2">
    <input type="checkbox" class="plain" />
    <span>Option 1</span>
  </label>
  <label class="flex items-center gap-2">
    <input type="checkbox" class="plain" />
    <span>Option 2</span>
  </label>
</div>`}
                        </pre>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Radio Group</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-xs">
                            {`<div class="space-y-2">
  <label class="flex items-center gap-2">
    <input type="radio" class="plain" name="group" />
    <span>Option A</span>
  </label>
  <label class="flex items-center gap-2">
    <input type="radio" class="plain" name="group" />
    <span>Option B</span>
  </label>
</div>`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    ),
};
