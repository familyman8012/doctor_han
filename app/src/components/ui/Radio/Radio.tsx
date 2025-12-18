import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { cn } from "@/components/utils";

const radioVariants = cva(
	"appearance-none bg-white bg-no-repeat bg-center bg-contain border rounded-full cursor-pointer transition-colors",
	{
		variants: {
			size: {
				xs: "w-3.5 h-3.5", // 14px - 컴팩트한 테이블/리스트용
				sm: "w-4 h-4", // 16px - 일반 폼 요소용 (기본값)
				md: "w-5 h-5", // 20px - 강조가 필요한 경우
			},
		},
		defaultVariants: {
			size: "sm",
		},
	},
);

const labelVariants = cva("flex cursor-pointer", {
	variants: {
		size: {
			xs: "text-xs", // 12px
			sm: "text-sm", // 14px
			md: "text-base", // 16px
		},
		hasSubText: {
			true: "",
			false: "items-center",
		},
	},
	defaultVariants: {
		size: "sm",
		hasSubText: false,
	},
});

export interface RadioProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type">,
		VariantProps<typeof radioVariants> {
	label?: string;
	labelColor?: string;
	subText?: string;
	size?: "xs" | "sm" | "md";
}

export const Radio: React.FC<RadioProps> = ({
	id,
	value,
	checked,
	onChange,
	size = "sm",
	readOnly,
	disabled,
	label,
	labelColor,
	subText,
	name,
	className,
	...props
}) => {
	const radioId = id || `radio-${value}`;

	return (
		<label
			htmlFor={radioId}
			className={cn(
				labelVariants({ size, hasSubText: !!subText }),
				"group",
				disabled && "cursor-not-allowed ",
				className,
			)}
		>
			<div className="relative inline-flex items-center justify-center">
				<input
					id={radioId}
					type="radio"
					name={name}
					value={value}
					checked={checked}
					onChange={onChange}
					readOnly={readOnly}
					disabled={disabled}
					className={cn(
						radioVariants({ size }),
						"border-gray-300",
						"checked:border-[#62e3d5]",
						"focus:outline-none focus:ring-2 focus:ring-[#62e3d5]/20 focus:ring-offset-2",
						readOnly && "border-gray-300 bg-gray-50 pointer-events-none",
						disabled && "border-gray-200 bg-gray-100 pointer-events-none",
					)}
					{...props}
				/>
				{/* 체크 표시를 위한 내부 원 */}
				{checked && (
					<div
						className={cn(
							"absolute rounded-full pointer-events-none",
							size === "xs"
								? "w-1.5 h-1.5"
								: size === "sm"
									? "w-2 h-2"
									: "w-2.5 h-2.5",
							disabled || readOnly ? "bg-gray-400" : "bg-[#62e3d5]",
						)}
					/>
				)}
			</div>
			{(label || subText) && (
				<span className="flex flex-col ml-2">
					{label && (
						<span
							className={cn(
								"font-medium text-[#0a3b41]",
								size === "xs"
									? "text-xs leading-4"
									: size === "sm"
										? "text-sm leading-5"
										: "text-base leading-6",
								labelColor,
							)}
						>
							{label}
						</span>
					)}
					{subText && (
						<span
							className={cn(
								"font-normal text-gray-500",
								size === "xs"
									? "text-xs leading-4"
									: size === "sm"
										? "text-sm leading-5"
										: "text-base leading-6",
							)}
						>
							{subText}
						</span>
					)}
				</span>
			)}
		</label>
	);
};

Radio.displayName = "Radio";

export interface RadioGroupProps {
	name: string;
	value?: string | number;
	onChange?: (value: string | number) => void;
	children: React.ReactNode;
	className?: string;
	direction?: "horizontal" | "vertical";
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
	name,
	value,
	onChange,
	children,
	className,
	direction = "vertical",
}) => {
	return (
		<div
			className={cn(
				"flex",
				direction === "horizontal" ? "flex-row gap-4" : "flex-col gap-3",
				className,
			)}
		>
			{React.Children.map(children, (child) => {
				if (React.isValidElement<RadioProps>(child) && child.type === Radio) {
					return React.cloneElement(child, {
						name,
						checked: child.props.value === value,
						onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
							if (onChange) {
								onChange(e.target.value);
							}
							if (child.props.onChange) {
								child.props.onChange(e);
							}
						},
					});
				}
				return child;
			})}
		</div>
	);
};

RadioGroup.displayName = "RadioGroup";
