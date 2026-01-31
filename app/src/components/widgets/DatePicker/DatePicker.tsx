"use client";

import React, {
    useEffect,
    useRef,
    useState,
    forwardRef,
} from "react";
import { ko } from "date-fns/locale/ko";
import DatepickerLibrary, { registerLocale } from "react-datepicker";
import CustomHeader from "./CustomHeader";
import { Input } from "@/components/ui/Input/Input";
import { Calendar } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css";

registerLocale("ko", ko);

export type NewDate = string | React.ChangeEvent<Element> | null;

export interface DatePickerProps {
  className?: string;
  DatePickerRef?: React.RefObject<DatepickerLibrary | null>;
  selectedDate: string | null;
  onChange?: (date: string | null, event?: unknown) => void;
  disabled?: boolean;
  dateFormat?: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  placeholderText?: string;
  showYearDropdown?: boolean;
  showMonthDropdown?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  error?: string;
  helperText?: string;
  customInput?: React.ReactElement; // customInput prop 추가
  popperPlacement?: 'bottom-start' | 'bottom-end' | 'bottom' | 'top-start' | 'top-end' | 'top'; // popperPlacement prop 추가
  popperClassName?: string;
  usePortal?: boolean;
  portalId?: string;
  isClearable?: boolean;
  errorClassName?: string; // 에러 텍스트 커스텀 클래스
}

// DefaultCustomInput 컴포넌트 - 기본 Input 컴포넌트를 react-datepicker와 연결
interface DefaultCustomInputProps {
  value?: string;
  onClick?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  error?: string;
}

const DefaultCustomInput = forwardRef<HTMLInputElement, DefaultCustomInputProps>((props, ref) => {
  const { value, onClick, onChange, placeholder, disabled, size, error } = props;
  
  return (
    <Input
      ref={ref}
      value={value}
      onClick={onClick}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      size={size}
      variant={error ? 'error' : 'default'}
      readOnly
      LeadingIcon={<Calendar className="w-4 h-4" />}
    />
  );
});

DefaultCustomInput.displayName = 'DefaultCustomInput';

const DEFAULT_PORTAL_ID = 'ncos-date-picker-portal-root';

const DatePicker: React.FC<DatePickerProps> = ({
  className,
  DatePickerRef,
  selectedDate,
  onChange,
  dateFormat = 'yyyy-MM-dd',
  minDate,
  maxDate,
  placeholderText = 'Select date',
  showYearDropdown = false,
  showMonthDropdown = false,
  disabled = false,
  size = 'sm',
  error,
  helperText,
  customInput,
  popperPlacement = 'bottom-start',
  popperClassName,
  usePortal = false,
  portalId = DEFAULT_PORTAL_ID,
  isClearable = false,
  errorClassName,
}) => {
  const [selectedDateState, setSelectedDateState] = useState<Date | null>(
    selectedDate ? new Date(selectedDate + 'T00:00:00') : null
  );
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const datePickerRef = useRef<DatepickerLibrary | null>(null);
  const resolvedDatePickerRef = DatePickerRef ?? datePickerRef;
  const [portalElementId, setPortalElementId] = useState<string | undefined>(
    usePortal ? portalId : undefined
  );

  // 날짜 문자열을 로컬 시간으로 파싱 (UTC 변환 방지)
  useEffect(() => {
    const newDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled component: selectedDate prop 변경 시 내부 상태 동기화 필요
    setSelectedDateState(newDate);
     
    setShowMonthYearPicker(false);
  }, [selectedDate]);

  // 포털 설정 변경 감지
  useEffect(() => {
    if (!usePortal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- portal 비활성화 시 상태 초기화 필요
      setPortalElementId(undefined);
      return;
    }

    if (typeof document === 'undefined') {
      return;
    }

    const targetId = portalId ?? DEFAULT_PORTAL_ID;
    let portalRoot = document.getElementById(targetId);

    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.setAttribute('id', targetId);
      portalRoot.setAttribute('data-role', 'datepicker-portal-root');
      document.body.appendChild(portalRoot);
    }

    setPortalElementId(targetId);
  }, [portalId, usePortal]);

  const handleChange = (
    date: Date | null,
    event?: unknown
  ) => {
    setSelectedDateState(date);
    if (onChange) {
      if (date) {
        // UTC 시간대 문제 해결을 위해 로컬 날짜 정보를 직접 추출
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const localDateString = `${year}-${month}-${day}`;
        onChange(localDateString, event);
      } else {
        onChange(null, event);
      }
    }
  };
  
    return (
      <div className={`date-picker-wrapper ${className || ''}`}>
        <DatepickerLibrary
          ref={resolvedDatePickerRef}
          selected={selectedDateState}
          onChange={handleChange}
          dateFormat={dateFormat}
          minDate={minDate ?? undefined}
          maxDate={maxDate ?? undefined}
          renderCustomHeader={(params) => CustomHeader({
            showMonthYearPicker,
            setShowMonthYearPicker,
            params,
            datePickerRef,
          })}
          dateFormatCalendar="yyyy년 MM월"
          placeholderText={placeholderText}
          locale="ko"
          showMonthYearPicker={showMonthYearPicker}
          showYearDropdown={showYearDropdown}
          showMonthDropdown={showMonthDropdown}
          disabled={disabled}
          customInput={customInput || <DefaultCustomInput size={size} error={error} />}
          popperPlacement={popperPlacement}
          popperProps={usePortal ? { strategy: 'fixed' } : undefined}
          popperClassName={[
            'ncos-date-picker-popper',
            popperClassName,
            usePortal ? 'ncos-date-picker-popper--portal' : undefined,
          ].filter(Boolean).join(' ')}
          portalId={portalElementId}
          isClearable={isClearable}
        />
        {error && (
          <p className={["text-red-500", errorClassName || "text-xs mt-1"].join(" ")}>{error}</p>
        )}
        {helperText && !error && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
      </div>
    )
  }

  export default DatePicker;
