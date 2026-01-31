"use client";

import { Check, ChevronDown } from "lucide-react";
import type React from "react";
import { type FC, useId, useMemo } from "react";
import ReactSelect, {
    components,
    type ControlProps,
    type DropdownIndicatorProps,
    type FormatOptionLabelMeta,
    type GroupBase,
    type MultiValue,
    type OptionProps,
    type SingleValue,
    type StylesConfig,
} from "react-select";

export interface IOption {
    value: string | number;
    label: string | React.ReactNode;
    description?: string;
    status?: string;
    icon?: React.ReactNode;
    isDisabled?: boolean;
}

export interface SelectProps {
    options: IOption[];
    value?: IOption | IOption[] | string | number | null;
    onChange?: (option: IOption | IOption[] | null) => void;
    onInputChange?: (value: string) => void;
    onMenuScrollToBottom?: () => void;
    placeholder?: string;
    LeadingIcon?: React.ReactElement;
    width?: string;
    height?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl"; // 사이즈 prop 추가
    isSearchable?: boolean;
    isDisabled?: boolean;
    isMulti?: boolean;
    isClearable?: boolean;
    formatOptionLabel?: (option: IOption, meta: FormatOptionLabelMeta<IOption>) => React.ReactNode;
    formatStatus?: (status: string) => React.ReactNode;
    prefixLabel?: string;
    className?: string;
    name?: string;
    showCheckmark?: boolean;
    usePortal?: boolean;
    noOptionsMessage?: (obj: { inputValue: string }) => string | React.ReactNode;
    showDescriptionWhenSelected?: boolean; // 선택된 상태에서 description 표시 여부
    onMenuOpen?: () => void;
    onMenuClose?: () => void;
    isLoading?: boolean;
}

const DropdownIndicator = (props: DropdownIndicatorProps<IOption, boolean>) => {
    return (
        <components.DropdownIndicator {...props}>
            <ChevronDown className="h-4 w-4 text-gray-500" />
        </components.DropdownIndicator>
    );
};

const CustomControl = (prefixLabel: string) => {
    const ControlComponent = <Option, IsMulti extends boolean, Group extends GroupBase<Option>>(
        props: ControlProps<Option, IsMulti, Group>
    ) => {
        const { children, ...rest } = props;
        return (
            <components.Control {...rest}>
                <span className="px-2 text-gray-500">{prefixLabel}</span>
                {children}
            </components.Control>
        );
    };

    ControlComponent.displayName = "CustomControl";
    return ControlComponent;
};

const CustomOption = ({ showCheckmark }: { showCheckmark: boolean }) => {
    const OptionComponent = (props: OptionProps<IOption, boolean>) => {
        const { data, isSelected, children } = props;

        return (
            <components.Option {...props}>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        {data.icon && <span className="flex-shrink-0">{data.icon}</span>}
                        <span>{children}</span>
                    </div>
                    {showCheckmark && isSelected && <Check className="h-4 w-4 text-[#62e3d5] flex-shrink-0" />}
                </div>
            </components.Option>
        );
    };

    OptionComponent.displayName = "CustomOption";
    return OptionComponent;
};

export const Select: FC<SelectProps> = ({
    options,
    value,
    onChange,
    onInputChange,
    placeholder = "Select...",
    LeadingIcon,
    width,
    height,
    size = "sm", // 기본값 sm (38px)
    isSearchable = true,
    isDisabled,
    isMulti = false,
    isClearable = false,
    formatOptionLabel,
    formatStatus,
    prefixLabel,
    className,
    name,
    showCheckmark = false,
    usePortal = true,
    noOptionsMessage,
    showDescriptionWhenSelected = false,
    isLoading = false,
    ...restProps
}) => {
    void LeadingIcon; // Prop retained for API compatibility

    // 사이즈별 높이 설정
    const sizeHeights = {
        xs: "34px", // 리스트 페이지용
        sm: "38px", // 상세 페이지용 (기본)
        md: "40px",
        lg: "44px",
        xl: "60px",
    };
    const computedHeight = height || sizeHeights[size] || "38px";

    const customStyles: StylesConfig<IOption, boolean, GroupBase<IOption>> = {
        control: (provided, state) => ({
            ...provided,
            width: width || "100%",
            minHeight: computedHeight,
            height:
                isMulti ||
                (showDescriptionWhenSelected && computedValue && !Array.isArray(computedValue) && (computedValue as IOption)?.description)
                    ? "auto"
                    : computedHeight,
            display: "flex",
            border:
                state.menuIsOpen || state.isFocused
                    ? "1px solid transparent !important"
                    : "1px solid #e5e7eb !important",
            boxShadow: state.menuIsOpen || state.isFocused ? "0 0 0 2px #62e3d5" : "none",
            borderRadius: "8px",
            backgroundColor: isDisabled ? "#f9fafb" : "white",
            "&:hover": {
                borderColor: state.menuIsOpen || state.isFocused ? "transparent" : "#d1d5db",
            },
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: "2px 4px 2px 8px",
        }),
        dropdownIndicator: (provided, state) => ({
            ...provided,
            padding: state.selectProps.menuIsOpen ? "8px 0 8px 8px" : "8px 8px 8px 0",
            transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : undefined,
            transition: "transform 0.2s",
        }),
        indicatorSeparator: () => ({
            display: "none",
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 140,
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            borderRadius: "8px",
        }),
        menuList: (provided) => ({
            ...provided,
            paddingTop: 0,
            paddingBottom: 0,
            maxHeight: "270px",
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: "14px",
            lineHeight: "20px",
            padding: "8px 12px",
            backgroundColor: state.isFocused ? "#f3f4f6" : state.isSelected ? "#62e3d5/10" : "transparent",
            color: state.isSelected ? "#0a3b41" : state.isFocused ? "#0a3b41" : "#374151",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            opacity: state.isDisabled ? 0.5 : 1,
            "&:active": {
                backgroundColor: state.isDisabled ? "transparent" : "#62e3d5/20",
            },
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
            fontSize: "14px",
        }),
        singleValue: (provided) => ({
            ...provided,
            fontSize: "14px",
            color: "#0a3b41",
        }),
        input: (provided) => ({
            ...provided,
            fontSize: "14px",
            color: "#0a3b41",
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: "var(--color-primary-50)",
            borderRadius: "4px",
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: "var(--color-primary-700)",
            fontSize: "14px",
            paddingLeft: "8px",
            paddingRight: "4px",
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: "var(--color-primary-600)",
            ":hover": {
                backgroundColor: "var(--color-primary-100)",
                color: "var(--color-primary-800)",
            },
        }),
        menuPortal: (provided) => ({
            ...provided,
            // 모달 오버레이(z-index: 999998) 위로 올리기 위해 충분히 큰 값 사용
            zIndex: 1000002,
        }),
    };

    const menuPortalTarget = useMemo<HTMLElement | undefined>(() => {
        if (!usePortal || typeof window === "undefined") {
            return undefined;
        }
        return document.body;
    }, [usePortal]);

    // Convert value to option object if needed
    const computedValue = useMemo(() => {
        if (!value) return isMulti ? [] : null;

        // For multi-select
        if (isMulti) {
            if (Array.isArray(value)) {
                // If value is already an array of options
                if (value.length > 0 && typeof value[0] === "object" && value[0] !== null && "value" in value[0]) {
                    return value as IOption[];
                }
                // If value is an array of primitive values
                return value
                    .map((v) => {
                        if (typeof v === "object" && v !== null && "value" in v) {
                            return v as IOption;
                        }
                        return options.find((option) => option.value === v) ?? null;
                    })
                    .filter(Boolean) as IOption[];
            }
            return [];
        }

        // For single select
        if (typeof value === "object" && "value" in value) {
            return value as IOption;
        }

        return options.find((option) => option.value === value) || null;
    }, [value, options, isMulti]);

    // Format option label with status badge if needed
    const customFormatOptionLabel = (option: IOption, context?: { context?: "menu" | "value" }) => {
        if (showCheckmark && context?.context === "menu") {
            if (option.description) {
                return (
                    <div className="py-1">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                    </div>
                );
            }
            return option.label;
        }

        if (formatOptionLabel) {
            const selectMetaValue: IOption[] = Array.isArray(computedValue)
                ? computedValue
                : computedValue
                  ? [computedValue]
                  : [];
            const meta: FormatOptionLabelMeta<IOption> = {
                context: context?.context ?? "menu",
                inputValue: "",
                selectValue: selectMetaValue,
            };
            return formatOptionLabel(option, meta);
        }

        const statusBadge = formatStatus && option.status ? formatStatus(option.status) : null;

        if (context?.context === "value") {
            if (showDescriptionWhenSelected && option.description) {
                return (
                    <div className="py-1">
                        <div className="flex items-center gap-2">
                            {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                            {statusBadge}
                            <span className="font-medium text-sm">{option.label}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                    </div>
                );
            }
            return (
                <div className="flex items-center gap-2">
                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                    {statusBadge}
                    <span>{option.label}</span>
                </div>
            );
        }

        if (option.description) {
            if (option.icon) {
                return (
                    <div className="flex items-center gap-3 py-1">
                        <span className="flex-shrink-0">{option.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                {statusBadge}
                                <span className="font-medium">{option.label}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                        </div>
                    </div>
                );
            }

            return (
                <div className="py-1">
                    <div className="flex items-center gap-2">
                        {statusBadge}
                        <span className="font-medium">{option.label}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                {statusBadge}
                <span>{option.label}</span>
            </div>
        );
    };

    const handleChange = (newValue: MultiValue<IOption> | SingleValue<IOption>) => {
        if (!onChange) return;

        // Convert readonly array to mutable array for compatibility with existing onChange signature
        if (Array.isArray(newValue)) {
            const mutableArray: IOption[] = [...newValue];
            onChange(mutableArray);
        } else {
            // SingleValue<IOption> is IOption | null, which matches onChange signature
            onChange(newValue as IOption | null);
        }
    };

    const handleInputChange = (inputValue: string, meta: { action: string }) => {
        if (meta.action === "input-change") {
            onInputChange?.(inputValue);
        } else if (meta.action === "input-blur") {
            onInputChange?.("");
        }
    };

    // Custom filter to search in both label and description
    const customFilterOption = (option: { data: IOption }, searchText: string) => {
        const search = searchText.toLowerCase();
        const label = (typeof option.data.label === "string" ? option.data.label : "").toLowerCase();
        const description = (option.data.description || "").toLowerCase();

        return label.includes(search) || description.includes(search);
    };

    return (
        <ReactSelect
            classNamePrefix="react-select"
            className={className}
            styles={customStyles}
            menuPortalTarget={menuPortalTarget}
            menuPosition={usePortal ? "fixed" : "absolute"}
            isLoading={isLoading}
            components={{
                DropdownIndicator,
                Control: prefixLabel ? CustomControl(prefixLabel) : components.Control,
                Option: showCheckmark ? CustomOption({ showCheckmark }) : components.Option,
            }}
            options={options}
            value={computedValue}
            onChange={handleChange}
            onInputChange={handleInputChange}
            placeholder={placeholder}
            isClearable={isClearable}
            isSearchable={isSearchable}
            isDisabled={isDisabled}
            isMulti={isMulti}
            formatOptionLabel={customFormatOptionLabel}
            filterOption={customFilterOption}
            instanceId={useId()}
            name={name}
            noOptionsMessage={noOptionsMessage}
            {...restProps}
        />
    );
};

Select.displayName = "Select";
