import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ColorBox, ColorGroup, colorGroups } from "./ColorPalette";

const meta: Meta = {
    title: "Ui/ColorPalette",
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

export const AllColors: Story = {
    render: () => (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Design System Color Palette</h1>

                <ColorGroup title="Gray Scale" colors={colorGroups.gray} columns={6} />
                <ColorGroup title="Neutral Scale" colors={colorGroups.neutral} columns={5} />
                <ColorGroup title="Primary Colors" colors={colorGroups.primary} columns={6} />
                <ColorGroup title="Blue Colors" colors={colorGroups.blue} columns={6} />
                <ColorGroup title="Orange/Brand Colors" colors={colorGroups.orange} columns={6} />
                <ColorGroup title="Red Colors" colors={colorGroups.red} columns={4} />
                <ColorGroup title="Error Colors" colors={colorGroups.error} columns={6} />
                <ColorGroup title="Warning Colors" colors={colorGroups.warning} columns={6} />
                <ColorGroup title="Success Colors" colors={colorGroups.success} columns={6} />
                <ColorGroup title="Green Colors" colors={colorGroups.green} columns={4} />
                <ColorGroup title="Yellow Colors" colors={colorGroups.yellow} columns={3} />
                <ColorGroup title="Indigo Colors" colors={colorGroups.indigo} columns={4} />
            </div>
        </div>
    ),
};

export const BadgeColors: Story = {
    render: () => (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Badge Color System</h1>
            <div className="grid grid-cols-3 gap-8">
                <div>
                    <h3 className="text-sm font-medium mb-3">Green Badge</h3>
                    <div className="space-y-2">
                        <ColorBox color={{ name: "Label", variable: "--color-badge-green-label" }} />
                        <ColorBox color={{ name: "Border", variable: "--color-badge-green-border" }} />
                        <ColorBox color={{ name: "Background", variable: "--color-badge-green-bg" }} />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium mb-3">Yellow Badge</h3>
                    <div className="space-y-2">
                        <ColorBox color={{ name: "Label", variable: "--color-badge-yellow-label" }} />
                        <ColorBox color={{ name: "Border", variable: "--color-badge-yellow-border" }} />
                        <ColorBox color={{ name: "Background", variable: "--color-badge-yellow-bg" }} />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium mb-3">Indigo Badge</h3>
                    <div className="space-y-2">
                        <ColorBox color={{ name: "Label", variable: "--color-badge-indigo-label" }} />
                        <ColorBox color={{ name: "Border", variable: "--color-badge-indigo-border" }} />
                        <ColorBox color={{ name: "Background", variable: "--color-badge-indigo-bg" }} />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium mb-3">Purple Badge</h3>
                    <div className="space-y-2">
                        <ColorBox color={{ name: "Label", variable: "--color-badge-purple-label" }} />
                        <ColorBox color={{ name: "Border", variable: "--color-badge-purple-border" }} />
                        <ColorBox color={{ name: "Background", variable: "--color-badge-purple-bg" }} />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium mb-3">Blue Badge</h3>
                    <div className="space-y-2">
                        <ColorBox color={{ name: "Label", variable: "--color-badge-blue-label" }} />
                        <ColorBox color={{ name: "Border", variable: "--color-badge-blue-border" }} />
                        <ColorBox color={{ name: "Background", variable: "--color-badge-blue-bg" }} />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium mb-3">Red Badge</h3>
                    <div className="space-y-2">
                        <ColorBox color={{ name: "Label", variable: "--color-badge-red-label" }} />
                        <ColorBox color={{ name: "Border", variable: "--color-badge-red-border" }} />
                        <ColorBox color={{ name: "Background", variable: "--color-badge-red-bg" }} />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium mb-3">Gray Badge</h3>
                    <div className="space-y-2">
                        <ColorBox color={{ name: "Label", variable: "--color-badge-gray-label" }} />
                        <ColorBox color={{ name: "Border", variable: "--color-badge-gray-border" }} />
                        <ColorBox color={{ name: "Background", variable: "--color-badge-gray-bg" }} />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium mb-3">Orange Badge</h3>
                    <div className="space-y-2">
                        <ColorBox color={{ name: "Label", variable: "--color-badge-orange-label" }} />
                        <ColorBox color={{ name: "Border", variable: "--color-badge-orange-border" }} />
                        <ColorBox color={{ name: "Background", variable: "--color-badge-orange-bg" }} />
                    </div>
                </div>
            </div>
        </div>
    ),
};

export const SemanticColors: Story = {
    render: () => (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Semantic Color System</h1>

            <div className="space-y-8">
                <div>
                    <h2 className="text-lg font-semibold mb-4">Status Colors</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <h3 className="text-sm font-medium mb-2">Error</h3>
                            <div className="space-y-2">
                                <ColorBox color={{ name: "Error 500", variable: "--color-error-500" }} />
                                <ColorBox color={{ name: "Error 200", variable: "--color-error-200" }} />
                                <ColorBox color={{ name: "Error 50", variable: "--color-error-50" }} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium mb-2">Warning</h3>
                            <div className="space-y-2">
                                <ColorBox color={{ name: "Warning 500", variable: "--color-warning-500" }} />
                                <ColorBox color={{ name: "Warning 200", variable: "--color-warning-200" }} />
                                <ColorBox color={{ name: "Warning 50", variable: "--color-warning-50" }} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium mb-2">Success</h3>
                            <div className="space-y-2">
                                <ColorBox color={{ name: "Success 500", variable: "--color-success-500" }} />
                                <ColorBox color={{ name: "Success 200", variable: "--color-success-200" }} />
                                <ColorBox color={{ name: "Success 50", variable: "--color-success-50" }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-4">UI Element Colors</h2>
                    <div className="grid grid-cols-4 gap-4">
                        <ColorBox color={{ name: "Input Border", variable: "--color-input-border" }} />
                        <ColorBox color={{ name: "Input Focus Border", variable: "--color-input-focus-border" }} />
                        <ColorBox color={{ name: "Background Primary", variable: "--color-bg-primary" }} />
                        <ColorBox color={{ name: "Text Default", variable: "--color-text-default" }} />
                    </div>
                </div>
            </div>
        </div>
    ),
};

export const ColorSearch: Story = {
    render: () => {
        const [searchTerm, setSearchTerm] = React.useState("");

        const allColors = Object.entries(colorGroups).flatMap(([group, colors]) =>
            colors.map((color) => ({ ...color, group })),
        );

        const filteredColors = searchTerm
            ? allColors.filter(
                  (color) =>
                      color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      color.variable.toLowerCase().includes(searchTerm.toLowerCase()),
              )
            : allColors;

        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Color Search</h1>

                <input
                    type="text"
                    placeholder="Search colors by name or variable..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-primary-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {searchTerm && (
                    <p className="text-sm text-gray-600 mb-4">
                        Found {filteredColors.length} color{filteredColors.length !== 1 ? "s" : ""}
                    </p>
                )}

                <div className="grid grid-cols-4 gap-4">
                    {filteredColors.map((color) => (
                        <div key={color.variable}>
                            <p className="text-xs text-gray-500 mb-1">{color.group}</p>
                            <ColorBox color={color} />
                        </div>
                    ))}
                </div>

                {searchTerm && filteredColors.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No colors found matching "{searchTerm}"</p>
                )}
            </div>
        );
    },
};

export const CopyableColors: Story = {
    render: () => {
        const [copiedVariable, setCopiedVariable] = React.useState("");

        const handleCopy = (variable: string, _value: string) => {
            // Copy CSS variable usage
            navigator.clipboard.writeText(`var(${variable})`);
            setCopiedVariable(variable);
            setTimeout(() => setCopiedVariable(""), 2000);
        };

        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Click to Copy CSS Variable</h1>
                <p className="text-gray-600 mb-8">Click any color box to copy its CSS variable to clipboard</p>

                <div className="grid grid-cols-4 gap-4">
                    {colorGroups.primary.map((color) => (
                        <div
                            key={color.variable}
                            className="cursor-pointer relative"
                            onClick={() => handleCopy(color.variable, "")}
                        >
                            <ColorBox color={color} />
                            {copiedVariable === color.variable && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black text-white px-2 py-1 rounded text-xs">
                                    Copied!
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {copiedVariable && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                        Copied: var({copiedVariable})
                    </div>
                )}
            </div>
        );
    },
};
