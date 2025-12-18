'use client';

import React, {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
  forwardRef,
} from 'react';
import { ko } from 'date-fns/locale/ko';
import dayjs from 'dayjs';
import DatePicker, { registerLocale } from 'react-datepicker';
import { Input } from '@/components/ui/Input/Input';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import '../DatePicker/DatePicker.css';
import './DateRange.css';

registerLocale('ko', ko);

export type DateRangeType = [Date | null, Date | null];

/**
 * Date를 정오(12:00)로 정규화하여 DST/타임존 문제 방지
 */
export function atNoon(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
}

/**
 * DateRangePicker 프리셋 버튼 정의
 * - 완전한 범위 [Date, Date] 또는 초기화용 null만 허용
 */
export interface DateRangePreset {
  label: string;
  /** 완전한 날짜 범위 [Date, Date] 또는 초기화 시 null 반환 */
  getRange: () => [Date, Date] | null;
}

/**
 * 기본 프리셋: 오늘, 최근 7일, 최근 30일, 초기화
 */
export const DEFAULT_DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    label: '오늘',
    getRange: () => {
      const today = atNoon(new Date());
      return [today, today];
    },
  },
  {
    label: '최근 7일',
    getRange: () => {
      const today = atNoon(new Date());
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return [start, today];
    },
  },
  {
    label: '최근 30일',
    getRange: () => {
      const today = atNoon(new Date());
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      return [start, today];
    },
  },
  {
    label: '초기화',
    getRange: () => null,
  },
];

interface DateRangePickerProps {
  onDateRangeChange: (update: DateRangeType) => void;
  value?: DateRangeType;  // controlled mode
  initialDateRange?: DateRangeType;  // uncontrolled mode (deprecated)
  exceptDateRange?: DateRangeType;
  placeholder?: string;
  disabled?: boolean;
  maxDate?: any;
  customInput?: React.ReactElement;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  error?: string;
  popperPlacement?: 'bottom-start' | 'bottom-end' | 'bottom' | 'top-start' | 'top-end' | 'top';
  /** 커스텀 프리셋 버튼. 미지정 시 기본 프리셋 사용 */
  presets?: DateRangePreset[];
}

// RangeCustomInput - 단일 input 커스텀 컴포넌트
const RangeCustomInput = forwardRef<HTMLInputElement, any>((props, ref) => {
  const { value, onClick, placeholder, disabled, size, error } = props;
  
  return (
    <Input
      ref={ref}
      value={value}
      placeholder={placeholder || "기간 선택"}
      onClick={onClick}
      disabled={disabled}
      size={size}
      variant={error ? 'error' : 'default'}
      readOnly
      className="h-[34px] w-[224px]"
      TrailingIcon={<Calendar className="w-4 h-4 text-black" />}
    />
  );
});

RangeCustomInput.displayName = 'RangeCustomInput';

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
  value,  // controlled mode
  initialDateRange = [null, null],  // fallback for uncontrolled
  exceptDateRange = [null, null],
  placeholder,
  disabled = false,
  maxDate,
  customInput,
  size = 'sm',
  error,
  presets = DEFAULT_DATE_RANGE_PRESETS,
}) => {
  const isControlled = value !== undefined;
  const [internalDateRange, setInternalDateRange] = useState<DateRangeType>(initialDateRange);

  // controlled mode일 때는 value 사용, uncontrolled일 때는 internal state 사용
  const committedRange: DateRangeType = (isControlled ? value : internalDateRange) ?? [null, null];

  // 선택 중 임시 range (react-datepicker에 보여줄 상태)
  const [pendingRange, setPendingRange] = useState<DateRangeType | null>(null);

  // 캘린더에 표시할 range: 선택 중이면 pendingRange, 아니면 committedRange
  const displayRange = pendingRange ?? committedRange;

  const [startDateInput, setStartDateInput] = useState<string | null>('');
  const [endDateInput, setEndDateInput] = useState<string | null>('');
  const [open, setOpen] = useState(false);
  const [, setIsResetVisible] = useState(false);
  const refEndDate = useRef<HTMLInputElement | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  // 날짜 비교 헬퍼
  const isSameDate = (a: Date | null, b: Date | null) =>
    (!a || !b ? a === b : a.getTime() === b.getTime());
  const isSameRange = (a: DateRangeType | null, b: DateRangeType | null) =>
    (!a && !b) || (!!a && !!b && isSameDate(a[0], b[0]) && isSameDate(a[1], b[1]));

  // 부모/내부 상태와 동기화되면 pendingRange 해제
  useEffect(() => {
    if (pendingRange && isSameRange(pendingRange, committedRange)) {
      setPendingRange(null);
    }
  }, [pendingRange, committedRange]);

  // value prop이 변경될 때 input 값 업데이트 (controlled mode)
  useEffect(() => {
    if (isControlled && value) {
      const [start, end] = value;
      setStartDateInput(start ? dayjs(start).format('YYYY-MM-DD') : '');
      setEndDateInput(end ? dayjs(end).format('YYYY-MM-DD') : '');
    }
  }, [value, isControlled]);

  // 초기값 설정용 useEffect (uncontrolled mode)
  useEffect(() => {
    if (!isControlled && (initialDateRange[0] || initialDateRange[1])) {
      const start = initialDateRange[0];
      const end = initialDateRange[1];
      
      if (start) {
        setStartDateInput(dayjs(start).format('YYYY-MM-DD'));
      }
      if (end) {
        setEndDateInput(dayjs(end).format('YYYY-MM-DD'));
      }
      setInternalDateRange([start, end]);
    }
  }, []); // 초기 렌더링 시에만 실행

  const validateDate = (dateStr: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) {
      return false;
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    if (year < 2000) {
      return false;
    }

    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setStartDateInput(dateStr);

    if (validateDate(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);
      const endDate = displayRange[1];

      // 종료일이 설정되어 있고, 시작일이 종료일로부터 1년 이내인지 확인
      if (endDate) {
        const oneMonthAfterStartDate = new Date(startDate);
        oneMonthAfterStartDate.setMonth(oneMonthAfterStartDate.getMonth() + 1); // 변경된 부분

        if (endDate > oneMonthAfterStartDate) {
          setEndDateInput('');
          if (!isControlled) {
            setInternalDateRange([startDate, null]);
          }
          onDateRangeChange([startDate, null]);
        }
      } else {
        // 시작일과 (조정된) 종료일 업데이트
        if (!isControlled) {
          setInternalDateRange([startDate, endDate]);
        }
        onDateRangeChange([startDate, endDate]);
      }
    }
  };

  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setEndDateInput(dateStr);

    if (validateDate(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const endDate = new Date(year, month - 1, day);
      const startDate = displayRange[0];

      // 시작일이 설정되어 있고, 종료일이 시작일로부터 1년 이내인지 확인
      if (startDate && endDate) {
        const oneMonthLater = new Date(startDate);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

        if (endDate > oneMonthLater) {
          alert('종료일은 시작일로부터 최대 1개월 이내로 설정해야 합니다.');
          setEndDateInput('');

          return; // 조건을 충족하지 않으면 업데이트 중단
        }
      }

      // 종료일 업데이트
      const update: DateRangeType = [displayRange[0], endDate];
      if (!isControlled) {
        setInternalDateRange(update);
      }
      onDateRangeChange(update);
    }
  };

  const handleStartDateKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && startDateInput && validateDate(startDateInput)) {
      refEndDate.current?.focus();
    }
  };

  const handleEndDateKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && endDateInput && validateDate(endDateInput)) {
      setOpen(false);
      refEndDate.current?.blur();
    }
  };

  const handleFocus = () => {
    setOpen(true);
    setIsResetVisible(true);
  };

  const onChange = (dates: [Date | null, Date | null] | Date | null) => {
    if (!dates) {
      if (!isControlled) {
        setInternalDateRange([null, null]);
      }
      setPendingRange(null);
      setStartDateInput('');
      setEndDateInput('');
      onDateRangeChange([null, null]);
      return;
    }

    // selectsRange가 true일 때는 [Date | null, Date | null] 형태
    if (Array.isArray(dates)) {
      const [start, end] = dates;
      // 로컬 시간으로 날짜 생성 (시간을 12시로 설정하여 타임존 문제 방지)
      const formattedUpdate: DateRangeType = [
        start ? new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0) : null,
        end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12, 0, 0) : null,
      ];

      // UI에 즉시 반영 (부분 선택/완료 모두)
      setPendingRange(formattedUpdate);

      if (!isControlled) {
        setInternalDateRange(formattedUpdate);
      }
      if (formattedUpdate[0]) {
        setStartDateInput(dayjs(formattedUpdate[0]).format('YYYY-MM-DD'));
      }
      if (formattedUpdate[1]) {
        setEndDateInput(dayjs(formattedUpdate[1]).format('YYYY-MM-DD'));
        setOpen(false);
      }
      onDateRangeChange(formattedUpdate);
    }
  };
  const onClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setOpen(false);
      setIsResetVisible(false);
    }
  };

  const handleResetClick = () => {
    if (!isControlled) {
      setInternalDateRange([null, null]);
    }
    setPendingRange(null);
    setStartDateInput('');
    setEndDateInput('');
    setIsResetVisible(false);
    onDateRangeChange([null, null]);
    // setOpen(false);
  };

  useEffect(() => {
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const setDateRangeAndUpdateInputs = (range: DateRangeType) => {
    setPendingRange(null);
    if (!isControlled) {
      setInternalDateRange(range);
    }
    setStartDateInput(range[0] ? dayjs(range[0]).format('YYYY-MM-DD') : '');
    setEndDateInput(range[1] ? dayjs(range[1]).format('YYYY-MM-DD') : '');
    onDateRangeChange(range);
  };

  const getExcludedDates = (excludeDate: DateRangeType) => {
    const start = excludeDate[0];
    const end = excludeDate[1];

    if (!start || !end) {
      return [];
    }

    const daysDifference = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Array.from({ length: daysDifference + 1 }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return date;
    });
  };

  // 표시용 텍스트는 controlled/uncontrolled 모두 공통 로직으로 계산한다.
  const rangeForDisplay: DateRangeType =
    (isControlled ? value : internalDateRange) ?? [null, null];
  const [displayStart, displayEnd] = rangeForDisplay;
  const displayText =
    displayStart && displayEnd
      ? `${dayjs(displayStart).format('YYYY-MM-DD')} - ${dayjs(displayEnd).format(
          'YYYY-MM-DD',
        )}`
      : '';

  return (
    <div className="DateRangeWrap">
      <div className="box_daterange_input" onClick={() => setOpen(!open)}>
        {customInput ? (
          React.cloneElement(customInput as React.ReactElement<any>, {
            value: displayText,
            placeholder,
            disabled,
            size,
            error,
          })
        ) : (
          <RangeCustomInput
            value={displayText}
            placeholder={placeholder}
            disabled={disabled}
            size={size}
            error={error}
          />
        )}
      </div>
      {open && (
        <div className="DateRageBox" ref={ref}>
          <div className="area_calendar">
            <div className="box_calendar">
              <DatePicker
                selected={displayRange[0]}
                startDate={displayRange[0]}
                endDate={displayRange[1]}
                // minDate={displayRange[0]}
                onChange={onChange}
                selectsRange
                inline
                monthsShown={2}
                locale="ko"
                showYearDropdown
                showMonthDropdown
                yearDropdownItemNumber={8}
                dateFormatCalendar="yyyy년 MM월"
                excludeDates={getExcludedDates(exceptDateRange)}
                maxDate={maxDate}
              />
            </div>
            <div className="box_btn">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    const range = preset.getRange();
                    if (range === null) {
                      handleResetClick();
                    } else {
                      setDateRangeAndUpdateInputs(range);
                    }
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          {/* <div className="area_direct_input">
            <dl>
              <dt>시작일</dt>
              <dd>
                <input
                  type="text"
                  id="startDate"
                  className="inp"
                  // placeholder="시작일"
                  value={startDateInput ?? ''}
                  onChange={handleStartDateChange}
                  onKeyDown={handleStartDateKeyDown}
                  onFocus={handleFocus}
                />
              </dd>
            </dl>
            <span className="bar">-</span>
            <dl>
              <dt>종료일</dt>
              <dd>
                <input
                  type="text"
                  id="endDate"
                  className="inp"
                  // placeholder="종료일"
                  value={endDateInput ?? ''}
                  onChange={handleEndDateChange}
                  onKeyDown={handleEndDateKeyDown}
                  onFocus={handleFocus}
                  disabled={!validateDate(String(startDateInput))}
                  ref={refEndDate}
                />
              </dd>
            </dl>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
