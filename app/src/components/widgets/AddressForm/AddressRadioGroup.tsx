"use client";

import React from "react";
import { cn } from "@/components/utils";
import { Radio, type RadioProps } from "@/components/ui/Radio/Radio";

export interface AddressRadioGroupProps {
  name: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  children: React.ReactNode;
  className?: string;
  direction?: "horizontal" | "vertical";
  disabled?: boolean;
  readOnly?: boolean;
}

export const AddressRadioGroup: React.FC<AddressRadioGroupProps> = ({
  name,
  value,
  onChange,
  children,
  className,
  direction = "vertical",
  disabled = false,
  readOnly = false,
}) => {
  const groupId = React.useId();

  const isRadioEl = (type: any) =>
    type === Radio || (typeof type === "function" && (type.displayName === "Radio" || type.name === "Radio"));

  const enhance = (node: React.ReactNode, index = 0): React.ReactNode => {
    if (!React.isValidElement(node)) return node;

    if (isRadioEl(node.type)) {
      const child = node as React.ReactElement<RadioProps>;
      const childValue = child.props.value ?? String(index);
      const childId = child.props.id ?? `addr-radio-${groupId}-${childValue}`;
      return React.cloneElement(child, {
        id: childId,
        name,
        checked: child.props.value === value,
        disabled: Boolean(disabled || child.props.disabled),
        readOnly: Boolean(readOnly || child.props.readOnly),
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          onChange?.(e.target.value);
          child.props.onChange?.(e);
        },
      });
    }

    const el = node as React.ReactElement<any>;
    const hasChildren = (el.props as any)?.children !== undefined;
    if ((el.type as any) === React.Fragment || hasChildren) {
      const nextChildren = React.Children.map((el.props as any).children, (c, i) => enhance(c, i));
      // clone with explicit children arg to avoid TS complaining about props shape
      return React.cloneElement(el, undefined as any, nextChildren as any);
    }

    return node;
  };

  return (
    <div
      className={cn("flex", direction === "horizontal" ? "flex-row gap-4" : "flex-col gap-3", className)}
      role="radiogroup"
      aria-disabled={disabled}
      aria-readonly={readOnly}
    >
      {React.Children.map(children, (child, i) => enhance(child, i))}
    </div>
  );
};

AddressRadioGroup.displayName = "AddressRadioGroup";

export default AddressRadioGroup;
