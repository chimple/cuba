import React from "react";
import "./TableStudentData.css";
import { TABLEDROPDOWN } from "../../../common/constants";

interface TableStudentDataProps {
  studentData: Record<string, any[]>;
  isScore: boolean;
  assignmentMap: Record<string, { belongsToClass: boolean }>;
  assignmentUserRecords?: { assignment_id: string; user_id: string }[];
  selectedType: string;
}

function getColor(totalScore: number, count: number) {
  if (count === 0) return "#FFFFFF";
  const averageScore = totalScore / count;
  if (averageScore < 30) return "#F09393";
  if (averageScore <= 70) return "#FDF7C3";
  return "#A4CC51";
}

function TableStudentData({
  studentData,
  isScore,
  assignmentMap,
  selectedType
}: TableStudentDataProps) {
  return (
    <>
      {Object.keys(studentData).map((assignmentId) => {
        const currentResults = studentData[assignmentId] || [];

        let displayValue = "";
        if (currentResults.length > 0) {
          if (isScore) {
            displayValue = currentResults[0].score !== null ? currentResults[0].score.toString() : "";
          } else {
            displayValue = currentResults.length.toString();
          }
        }

        const bgColor = getColor(
          currentResults.reduce((sum, r) => sum + (r.score || 0), 0),
          currentResults.length
        );

        return (
          <td key={assignmentId} className="square-cell" style={{ backgroundColor: bgColor }}>
            <div className="square-cell-container">{displayValue}</div>
          </td>
        );
      })}
    </>
  );
}

export default TableStudentData;