"use client";

import dayjs from "dayjs";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/Input/Input";
import DatePicker from "@/components/widgets/DatePicker/DatePicker";
import { cn } from "@/components/utils";
import styles from "./DateTimePicker.module.css";

export interface DateTimePickerProps {
    label?: ReactNode;
    required?: boolean;
    value?: string | null;
    onChange?: (value: string | null) => void;
    disabled?: boolean;
    minDate?: Date | null;
    maxDate?: Date | null;
    placeholderText?: string;
    timePlaceholder?: string;
    helperText?: string;
    error?: string;
    className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function buildIso(date: string, time: string | null): string | null {
    const fallbackTime = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
    const candidate = dayjs(`${date}T${fallbackTime}:00`);
    if (!candidate.isValid()) return null;
    return candidate.second(0).millisecond(0).toISOString();
}

export function DateTimePicker({
    label,
    required,
    value,
    onChange,
    disabled,
    minDate,
    maxDate,
    placeholderText = "날짜 선택",
    timePlaceholder = "시간 선택",
    helperText,
    error,
    className,
}: DateTimePickerProps) {
    const parsed = useMemo(() => (value ? dayjs(value) : null), [value]);
    const hasValidValue = parsed?.isValid?.() ?? false;
    const dateValue = hasValidValue ? parsed!.format("YYYY-MM-DD") : null;
    const timeValue = hasValidValue ? parsed!.format("HH:mm") : "";

    const handleDateChange = (nextDate: string | null) => {
        if (!onChange) return;
        if (!nextDate) {
            onChange(null);
            return;
        }
        const iso = buildIso(nextDate, timeValue);
        onChange(iso);
    };

    const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!onChange || !dateValue) return;
        const nextRaw = event.target.value;
        const [hoursString = "0", minutesString = "0"] = nextRaw.split(":");
        const hours = clamp(Number.parseInt(hoursString, 10) || 0, 0, 23);
        const minutes = clamp(Number.parseInt(minutesString, 10) || 0, 0, 59);
        const iso = buildIso(dateValue, `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
        onChange(iso);
    };

    const timeDisabled = disabled || !dateValue;

    return (
        <div className={cn(styles.container, className)}>
            {label ? (
                <span className={styles.labelRow}>
                    {label}
                    {required ? <span className="text-red-500">*</span> : null}
                </span>
            ) : null}
            <div className={styles.controls}>
                <div className={styles.datePicker}>
                    <DatePicker
                        selectedDate={dateValue}
                        onChange={handleDateChange}
                        disabled={disabled}
                        minDate={minDate ?? undefined}
                        maxDate={maxDate ?? undefined}
                        placeholderText={placeholderText}
                        error={error}
                    />
                </div>
                <div className={styles.timeInputWrapper}>
                    <Input
                        type="time"
                        step={60}
                        size="sm"
                        className={cn(styles.timeInput, error && styles.timeInputError)}
                        value={dateValue ? timeValue : ""}
                        onChange={handleTimeChange}
                        disabled={timeDisabled}
                        placeholder={timePlaceholder}
                        aria-label={timePlaceholder}
                    />
                </div>
            </div>
            {error ? (
                <p className="text-sm text-red-500">{error}</p>
            ) : helperText ? (
                <p className={styles.helperText}>{helperText}</p>
            ) : null}
        </div>
    );
}

export default DateTimePicker;
