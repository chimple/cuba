import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "./WeeklySummary.css"; // Import the CSS file
import { HomeWeeklySummary } from "../../../common/constants";
import { t } from "i18next";
import { addDays, subDays, format } from "date-fns";

interface WeeklySummaryProps {
  weeklySummary?: HomeWeeklySummary;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ weeklySummary }) => {
  const getCurrentWeekDates = () => {
    const today = new Date();
    const oneWeekBack = subDays(today, 6);
    const formatDate = (date: Date) => format(date, "dd/MM");

    return {
      currentDate: formatDate(today),
      oneWeekBackDate: formatDate(oneWeekBack),
    };
  };

  const { currentDate, oneWeekBackDate } = getCurrentWeekDates();

  const getData = () => {
    const scorePercentage = Math.round(
      ((weeklySummary?.assignments.asgnmetCmptd || 0) /
        (weeklySummary?.assignments.totalAssignments || 1)) *
        100
    );

    const studentPercentage = Math.round(
      ((weeklySummary?.students.stdCompletd || 0) /
        (weeklySummary?.students.totalStudents || 1)) *
        100
    );

    return [
      {
        label: t("Assignments"),
        value: scorePercentage,
        numerator: weeklySummary?.assignments.asgnmetCmptd,
        denominator: weeklySummary?.assignments.totalAssignments,
        color:
          scorePercentage >= 70
            ? "green"
            : scorePercentage <= 49
              ? "red"
              : "orange",
      },
      {
        label: t("Active Students"),
        value: studentPercentage,
        numerator: weeklySummary?.students.stdCompletd,
        denominator: weeklySummary?.students.totalStudents,
        color:
          studentPercentage >= 70
            ? "green"
            : studentPercentage <= 49
              ? "red"
              : "orange",
      },
      {
        label: t("Average Time Spent"),
        value: weeklySummary?.timeSpent ?? 0,
        numerator: weeklySummary?.timeSpent,
        denominator: weeklySummary?.timeSpent,
        color: weeklySummary?.timeSpent
          ? weeklySummary?.timeSpent >= 40
            ? "green"
            : weeklySummary?.timeSpent <= 20
              ? "red"
              : "orange"
          : "#f1f1f1",
      },
      {
        label: t("Average Score"),
        value: weeklySummary?.averageScore ?? 0,
        numerator: weeklySummary?.averageScore,
        denominator: weeklySummary?.averageScore,
        color: weeklySummary?.averageScore
          ? weeklySummary?.averageScore >= 70
            ? "green"
            : weeklySummary?.averageScore <= 49
              ? "red"
              : "orange"
          : "red",
      },
    ];
  };

  return (
    <div className="weekly-summary-container">
      <h3 className="weekly-summary-header">
        {t("Weekly Assignments Summary")} {oneWeekBackDate} - {currentDate}
      </h3>
      <div className="weekly-summary">
        {getData().map((item, index) => (
          <div key={index} className="summary-item">
            <CircularProgressbar
              value={
                item.label === t("Average Time Spent") ? 100 : item.value ?? 0
              }
              text={`${item.value|| 0 }${item.label !== t("Average Time Spent") && item.label !== t("Average Score") ? "%" : ""}`}
              styles={buildStyles({
                pathColor: item.color,
                textColor: "#333",
                trailColor: "#f1f1f1",
              })}
            />

            <div
              className="summary-label"
              style={{
                color: item.color === "#f1f1f1" ? "red" : item.color,
              }}
            >
              <strong>
                {item.label === t("Average Score")
                  ? `${item.numerator}`
                  : item.label === t("Average Time Spent")
                    ? `${item.numerator|| 0} min`
                    : `${item.numerator}/${item.denominator}`}
              </strong>
              <br />
              <div style={{ color: "black" }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklySummary;
