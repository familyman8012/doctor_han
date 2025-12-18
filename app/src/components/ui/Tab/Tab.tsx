"use client";

import { cn } from "@/components/utils";
import { motion, LayoutGroup } from "framer-motion";
import type { FC } from "react";
import { Badge } from "../Badge/Badge";

export interface BaseTabProps {
    title: string;
    label?: string;
    isActive?: boolean;
    onClick?: () => void;
}

export interface TabProps extends BaseTabProps {
    layoutId: string;
}

export interface TabsProps {
    id: string;
    tabs: BaseTabProps[];
    activeTabIndex: number;
    onTabChange?: (index: number) => void;
    className?: string;
}

export const Tab: FC<TabProps> = ({ title, label, isActive = false, onClick, layoutId }) => {
    return (
        <div
            className={cn(
                "flex items-center relative h-8 px-3 pb-2",
                "text-sm font-medium cursor-pointer transition-colors",
                isActive ? "text-[#0a3b41]" : "text-[#5f6b6d] hover:text-[#0a3b41]",
            )}
            onClick={onClick}
        >
            {title}
            {!!label && (
                <Badge color={isActive ? "primary" : "gray"} size="xs" className="ml-2">
                    {label}
                </Badge>
            )}
            {isActive && (
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#62e3d5]"
                    layoutId={layoutId}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                    }}
                />
            )}
        </div>
    );
};

export const Tabs: FC<TabsProps> = ({ id, tabs, activeTabIndex, onTabChange, className }) => {
    const handleTabClick = (index: number) => {
        onTabChange?.(index);
    };

    return (
        <LayoutGroup id={id}>
            <div className={cn("flex relative border-b border-gray-200", className)}>
                {tabs.map((tab, index) => (
                    <Tab
                        key={`${id}-tab-${index}`}
                        layoutId={`${id}-underline`}
                        title={tab.title}
                        label={tab.label}
                        isActive={index === activeTabIndex}
                        onClick={() => handleTabClick(index)}
                    />
                ))}
            </div>
        </LayoutGroup>
    );
};
