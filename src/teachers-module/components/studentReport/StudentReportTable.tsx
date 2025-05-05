import React, { useMemo, useState } from "react";
import "./StudentReportTable.css";
import { t } from "i18next";
import { SwapVert } from "@mui/icons-material";
import { SCORECOLOR } from "../../../common/constants";

interface StudentReportTableProps {
  report: {
    lessonName: string;
    score: number;
    date: string; // Format: "DD-MM-YYYY"
    isAssignment: boolean;
  }[];
}

const StudentReportTable: React.FC<StudentReportTableProps> = ({ report }) => {
  const [isActivityAscending, setIsActivityAscending] = useState(false);
  const [isDateAscending, setIsDateAscending] = useState(false);
  const [isNameSort, setIsNameSort] = useState(false);

  const parseDate = (date: string) => {
    const [day, month, year] = date.split("/");
    return new Date(`${year}-${month}-${day}`);
  };

  const sortedReport = useMemo(() => {
    if (isNameSort) {
      if (isActivityAscending) {
        return [...report].sort((a, b) =>
          a.lessonName.localeCompare(b.lessonName)
        );
      }
      if (!isActivityAscending) {
        return [...report].sort((a, b) =>
          b.lessonName.localeCompare(a.lessonName)
        );
      }
    } else {
      if (isDateAscending) {
        return [...report].sort(
          (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()
        );
      } else {
        return [...report].sort(
          (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()
        );
      }
    }
    return [];
  }, [report, isActivityAscending, isDateAscending, isNameSort]);

  const handleActivitySwapVert = () => {
    setIsNameSort(true);
    setIsActivityAscending((prev) => !prev);
  };

  const handleDateSwapVert = () => {
    setIsNameSort(false);

    setIsDateAscending((prev) => !prev);
  };

  return (
    <div className="student-report-table-container">
      <div className="student-report-table">
        <div className="student-report-table-header">
          <div className="student-report-table-row">
            <div className="student-report-table-cell">
              <div
                className="student-report-table-swap"
                onClick={handleActivitySwapVert}
              >
                {t("Activity")}
                <SwapVert />
              </div>
            </div>
            <div className="student-report-table-cell">{t("Score")}</div>
            <div className="student-report-table-cell">
              <div
                className="student-report-table-swap"
                onClick={handleDateSwapVert}
              >
                {t("Date")}
                <SwapVert />
              </div>
            </div>
          </div>
        </div>
        <div className="student-report-table-body">
          {sortedReport.map((row, index) => (
            <div className="student-report-table-row" key={index}>
              <div className="student-report-table-cell">
                <div className="student-report-table-subject">
                  <span className="activity-text">{row.lessonName}</span>
                  <img
                    src={
                      row.isAssignment
                        ? "assets/icons/assignment.png"
                        : "assets/icons/self_played.png"
                    }
                    alt="assignment icon"
                    className="assignment-icon"
                  />
                </div>
              </div>
              <div className="student-report-table-cell">
                <span
                  style={{
                    color:
                      row.score < 30
                        ? SCORECOLOR.RED
                        : row.score > 70
                          ? SCORECOLOR.GREEN
                          : SCORECOLOR.ORANGE,
                  }}
                >
                  {row.score}
                </span>
              </div>
              <div className="student-report-table-cell">{row.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentReportTable;
