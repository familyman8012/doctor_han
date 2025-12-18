import type { Meta, StoryObj } from "@storybook/react";
import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/Button/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
    title: "Ui/Tooltip",
    component: Tooltip,
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

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
    render: () => (
        <div className="p-8 space-y-8">
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="sm">기본 툴팁</Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">기본 툴팁입니다.</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    ),
};

export const WithIcon: Story = {
    render: () => (
        <div className="p-8 space-y-4">
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 text-sm text-slate-700 cursor-help">
                            <HelpCircle className="h-4 w-4 text-slate-400" />
                            <span>도움말</span>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs whitespace-pre-line text-xs">
                        여러 줄 설명을 포함하는 툴팁입니다.
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    ),
};
