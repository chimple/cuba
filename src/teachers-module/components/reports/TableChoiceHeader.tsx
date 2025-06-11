import React, { useEffect, useState } from "react";
import "./TableChoiceHeader.css";
import {
  addDays,
  addMonths,
  format,
  isAfter,
  subDays,
  subMonths,
} from "date-fns";
import { t } from "i18next";
import { funnel, personCircle } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import { TABLESORTBY } from "../../../common/constants";
import CustomDropdown from "../CustomDropdown";
import CalendarPicker from "../../../common/CalendarPicker";

interface TableChoiceHeaderProps {
  onDateChange;
  onIsAssignments;
  isMonthly;
  handleNameSort;
  sortBy;
  isAssignmentsOnlyProp;
  dateRangeValue: {
    startDate: Date;
    endDate: Date;
  };
  isAssignmentReport: boolean;
}

const TableChoiceHeader: React.FC<TableChoiceHeaderProps> = ({
  onDateChange,
  onIsAssignments,
  isMonthly,
  handleNameSort,
  sortBy,
  isAssignmentsOnlyProp,
  dateRangeValue,
  isAssignmentReport,
}) => {
  const [selectedValue, setSelectedValue] = useState<string | undefined>();

  const [isAssignmentsOnly, setIsAssignmentsOnly] = useState(
    isAssignmentsOnlyProp
  );
  const [dateRange, setDateRange] = useState(dateRangeValue);

  useEffect(() => {
    onDateChange(dateRange);
  }, [dateRange]);
  useEffect(() => {
    if (isMonthly) {
      setDateRange((prevRange) => {
        return {
          startDate: subMonths(prevRange.endDate, 6),
          endDate: prevRange.endDate,
        };
      });
    } else {
      setDateRange((prevRange) => {
        return {
          startDate: subDays(prevRange.endDate, 6),
          endDate: prevRange.endDate,
        };
      });
    }
  }, [isMonthly]);

  const handleCalendarSelect = () => {};

  const handlePrevDateRange = () => {
    setDateRange((prevRange) => {
      if (isMonthly) {
        // For 6-month intervals
        return {
          startDate: subMonths(prevRange.startDate, 6),
          endDate: subMonths(prevRange.endDate, 6),
        };
      } else {
        // For weekly intervals
        return {
          startDate: subDays(prevRange.startDate, 7),
          endDate: subDays(prevRange.endDate, 7),
        };
      }
    });
  };

  const handleNextDateRange = () => {
    setDateRange((prevRange) => {
      if (isMonthly) {
        // For 6-month intervals
        return {
          startDate: addMonths(prevRange.startDate, 6),
          endDate: addMonths(prevRange.endDate, 6),
        };
      } else {
        // For weekly intervals
        return {
          startDate: addDays(prevRange.startDate, 7),
          endDate: addDays(prevRange.endDate, 7),
        };
      }
    });
  };
  const toggleAssignmentsOnly = () => {
    setIsAssignmentsOnly(!isAssignmentsOnly);
    onIsAssignments(!isAssignmentsOnly);
  };
  const isNextButtonDisabled = () => {
    const today = new Date();
    const formattedEndDate = format(dateRange.endDate, "yyyy-MM-dd");
    const formattedToday = format(today, "yyyy-MM-dd");
    return (
      isAfter(dateRange.endDate, today) || formattedEndDate === formattedToday
    );
  };

  return (
    <div className="date-range-selector">
      {!isAssignmentReport && (
        <div className="toggle-container">
          <div className="pill-toggle">
      <div
        className={`pill-option ${isAssignmentsOnly ? "active" : ""}`}
        onClick={() => {
          if (!isAssignmentsOnly) {
            setIsAssignmentsOnly(true);
            onIsAssignments(true);
          }
        }}
      >
        {t("Assignments")}
      </div>
      <div
        className={`pill-option ${!isAssignmentsOnly ? "active" : ""}`}
        onClick={() => {
          if (isAssignmentsOnly) {
            setIsAssignmentsOnly(false);
            onIsAssignments(false);
          }
        }}
      >
        {t("All Activities")}
           </div>
         </div>
        </div>
      )}
      <div className="date-range-container">
        <p className="table-date-range-text">{t("Click date to select Date Range")}</p>
        <div className="date-range-controls">
          <button className="nav-btn" onClick={handlePrevDateRange}>
            {"<"}
          </button>
          <div className="date-range" onClick={handleCalendarSelect}>
            {`${dateRange.startDate.getDate().toString().padStart(2, "0")}/${(
              dateRange.startDate.getMonth() + 1
            )
              .toString()
              .padStart(
                2,
                "0"
              )} - ${dateRange.endDate.getDate().toString().padStart(2, "0")}/${(
              dateRange.endDate.getMonth() + 1
            )
              .toString()
              .padStart(2, "0")}`}
          </div>
          <button
            className="nav-btn"
            onClick={handleNextDateRange}
            disabled={isNextButtonDisabled()}
          >
            {">"}
          </button>
        </div>
      </div>
      <div className="table-sort-divider"></div>

      <div>
        <select
        value={sortBy.id} className="table-choice-filter"
        onChange={(e) => {
          const selectedId = e.target.value;
          const selectedOption = Object.entries(TABLESORTBY).find(([key]) => key === selectedId);
          if (selectedOption) {
            handleNameSort({ id: selectedOption[0], name: selectedOption[1] });
          }
        }}
        style={{
          backgroundImage: `url('/assets/icons/filterArrow.svg')`,
        }}
        >
          {Object.entries(TABLESORTBY).map(([key, value]) => (
            <option key={key} value={key}>
              {t(value)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TableChoiceHeader;
