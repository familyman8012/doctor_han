import { ChevronDown } from "lucide-react";
import type DatepickerLibrary from "react-datepicker";

interface CustomHeaderProps {
    showMonthYearPicker: boolean;
    setShowMonthYearPicker: React.Dispatch<React.SetStateAction<boolean>>;
    params: {
        date: Date;
        decreaseYear: () => void;
        increaseYear: () => void;
        decreaseMonth: () => void;
        increaseMonth: () => void;
        prevYearButtonDisabled: boolean;
        nextYearButtonDisabled: boolean;
        prevMonthButtonDisabled: boolean;
        nextMonthButtonDisabled: boolean;
    };
    datePickerRef: React.RefObject<DatepickerLibrary | null>;
}

const CustomHeader = ({ showMonthYearPicker, setShowMonthYearPicker, params, datePickerRef }: CustomHeaderProps) => {
    const monthNames = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleDateString("ko", { month: "long" }));

    const handleHeaderClick = () => {
        setShowMonthYearPicker((prev: boolean) => !prev);
    };

    const handleMonthClick = (monthNum: number) => {
        setShowMonthYearPicker(false); // 날짜 선택기로 전환
        const newDate = new Date(params.date.getFullYear(), monthNum, 1);
        if (datePickerRef?.current) {
            datePickerRef?.current.setSelected(newDate);
        }
    };

    return (
        <div className="date-picker-custom-header">
            <button
                type="button"
                className="react-datepicker__navigation react-datepicker__navigation--previous"
                onClick={showMonthYearPicker ? params.decreaseYear : params.decreaseMonth}
                disabled={showMonthYearPicker ? params.prevYearButtonDisabled : params.prevMonthButtonDisabled}
            >
                <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--previous">
                    <span className="hiddenZoneV">Previous Month</span>
                </span>
            </button>
            <button
                type="button"
                className={showMonthYearPicker ? "react-datepicker__current-month" : "react-datepicker__current-month"}
                onClick={handleHeaderClick}
            >
                <span className="area_current_date">
                    {showMonthYearPicker
                        ? params.date.getFullYear().toString()
                        : params.date.toLocaleDateString("ko", {
                              month: "long",
                              year: "numeric",
                          })}
                    <ChevronDown className="w-3 h-3" />
                </span>
            </button>
            <button
                type="button"
                className="react-datepicker__navigation react-datepicker__navigation--next"
                onClick={showMonthYearPicker ? params.increaseYear : params.increaseMonth}
                disabled={showMonthYearPicker ? params.nextYearButtonDisabled : params.nextMonthButtonDisabled}
            >
                <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--next">
                    <span className="hiddenZoneV"> Next Month</span>
                </span>
            </button>
            {showMonthYearPicker && (
                <div className="month-list">
                    {monthNames.map((monthName, idx) => (
                        <button
                            type="button"
                            key={monthName}
                            onClick={() => handleMonthClick(idx)}
                            className={params.date.getMonth() === idx ? "selected-month" : ""}
                        >
                            {monthName}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomHeader;
