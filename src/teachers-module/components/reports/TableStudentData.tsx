import React from "react";
import "./TableStudentData.css";
import { TABLEDROPDOWN } from "../../../common/constants";

interface TableStudentDataProps {
  studentData: Record<string, any[]>; // Holds student results per assignment
  isScore: boolean; // Determines if we show scores or count of results
  assignmentMap: Record<string, { belongsToClass: boolean }>; // Map of assignment IDs to their status
  assignmentUserRecords?: { assignment_id: string; user_id: string }[]; // ✅ Optional
  selectedType: string,
  headerDetails?: Map<string, any>[]; // Add this prop
}

function getColor(studentResults: any[], belongsToClass: boolean, isIndividuallyAssigned: boolean, selectedType: string) {
  // If student has played and has a score, apply the score-based color
  if (studentResults.length > 0 && studentResults.some((r) => r.score !== null)) {
    let totalScore = studentResults.reduce((sum, result) => sum + (result.score || 0), 0);
    const averageScore = totalScore / studentResults.length;
    if (averageScore < 30) return "#F09393";
    if (averageScore <= 70) return "#FDF7C3";
    return "#A4CC51";
  }

  // For all-subjects view, we don't need the gray background for unassigned
  return "#FFFFFF";
}

function TableStudentData({ studentData, isScore, assignmentMap, selectedType }: TableStudentDataProps) {
  return (
    <>
      {Object.keys(studentData).map((assignmentId) => {
        const currentResults = studentData[assignmentId] || [];
        const assignmentDetails = assignmentMap[assignmentId];
        const belongsToClass = assignmentDetails?.belongsToClass ?? false;

        // For all-subjects view, we consider all assignments as individually assigned
        const isIndividuallyAssigned = true;

        const backgroundColor = getColor(currentResults, belongsToClass, isIndividuallyAssigned, selectedType);

        let displayValue = "";
        if (currentResults.length > 0) {
          if (isScore) {
            displayValue = currentResults[0].score !== null ? currentResults[0].score.toString() : "";
          } else {
            displayValue = currentResults.length.toString();
          }
        }

        return (
          <td className="square-cell" key={assignmentId} style={{ backgroundColor }}>
            <div className="square-cell-container">
              {displayValue}
            </div>
          </td>
        );
      })}
    </>
  );
}
export default TableStudentData;
