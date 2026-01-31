// import { ArrowDownFilled } from '@ComponentFarm/atom/icons';

interface CustomHeaderParams {
    date: Date;
    decreaseMonth: () => void;
    increaseMonth: () => void;
    prevMonthButtonDisabled: boolean;
    nextMonthButtonDisabled: boolean;
    onChange: (date: Date) => void;
    monthCount: number;
}

interface CustomHeaderProps {
    showMonthYearPicker: boolean[];
    setShowMonthYearPicker: React.Dispatch<React.SetStateAction<boolean[]>>;
    params: CustomHeaderParams;
    monthIndex: number;
}

const CustomHeader = ({
    showMonthYearPicker,
    setShowMonthYearPicker,
    params,
    monthIndex,
}: CustomHeaderProps) => {
    const monthNames = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleDateString("ko", { month: "long" }));

    const handleHeaderClick = () => {
        const updatedState = [...showMonthYearPicker];
        updatedState[monthIndex] = !updatedState[monthIndex];
        setShowMonthYearPicker(updatedState);
    };

    // CustomHeader 컴포넌트 내부
    const handleMonthClick = (monthNum: number) => {
        const year = params.date.getFullYear();
        const newDate = new Date(year, monthNum, 1); // 해당 월의 첫 날

        // 연/월 선택 후 해당 월의 첫 날로 설정
        params.onChange(newDate);

        // 연/월 선택기를 숨기고 날짜 선택기를 다시 표시
        setShowMonthYearPicker((prev) => {
            const newValues = [...prev];
            newValues[params.monthCount] = false;
            return newValues;
        });
    };

    return (
        <div className="date-picker-custom-header">
            <button
                type="button"
                className="react-datepicker__navigation react-datepicker__navigation--previous"
                onClick={params.decreaseMonth}
                disabled={params.prevMonthButtonDisabled}
            >
                <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--previous">
                    <span className="hiddenZoneV">Previous Month</span>
                </span>
            </button>

            {showMonthYearPicker[monthIndex] ? (
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
            ) : (
                <button type="button" className="react-datepicker__current-month" onClick={handleHeaderClick}>
                    <span className="area_current_date">
                        {params.date.toLocaleDateString("ko", {
                            month: "long",
                            year: "numeric",
                        })}
                        {/* <ArrowDownFilled /> */}
                    </span>
                </button>
            )}

            <button
                type="button"
                className="react-datepicker__navigation react-datepicker__navigation--next"
                onClick={params.increaseMonth}
                disabled={params.nextMonthButtonDisabled}
            >
                <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--next">
                    <span className="hiddenZoneV"> Next Month</span>
                </span>
            </button>
        </div>
    );
};

export default CustomHeader;
