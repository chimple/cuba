import React from "react";
import "./TableStudentData.css";
import { TABLEDROPDOWN } from "../../../common/constants";

interface TableStudentDataProps {
  studentData: Record<string, any[]>; // Holds student results per assignment
  isScore: boolean; // Determines if we show scores or count of results
  assignmentMap: Record<string, { belongsToClass: boolean }>; // Map of assignment IDs to their status
  assignmentUserRecords?: { assignment_id: string; user_id: string }[]; // ✅ Optional
  selectedType: string
}

function getColor(studentResults: any[], belongsToClass: boolean, isIndividuallyAssigned: boolean, selectedType: string) {
  if (selectedType === TABLEDROPDOWN.MONTHLY || selectedType === TABLEDROPDOWN.WEEKLY || selectedType === TABLEDROPDOWN.CHAPTER) {
    if (studentResults.length > 0 && studentResults.some((r) => r.score !== null)) {
      let totalScore = studentResults.reduce((sum, result) => sum + (result.score || 0), 0);
      const averageScore = totalScore / studentResults.length;
      if (averageScore < 30) return "#F09393";
      if (averageScore <= 70) return "#FDF7C3";
      return "#A4CC51";
    }
    return "#FFFFFF";
  }
  
  // If student has played and has a score, apply the score-based color.
  if (studentResults.length > 0 && studentResults.some((r) => r.score !== null)) {
    let totalScore = studentResults.reduce((sum, result) => sum + (result.score || 0), 0);
    const averageScore = totalScore / studentResults.length;
    if (averageScore < 30) return "#F09393";
    if (averageScore <= 70) return "#FDF7C3";
    return "#A4CC51";
  }

  if (isIndividuallyAssigned) {
    return "#FFFFFF";
  }

  return "#C4C4C4"; 
}

function TableStudentData({ studentData, isScore, assignmentMap, assignmentUserRecords, selectedType }: TableStudentDataProps) {
  return (
    <>
      {Object.keys(studentData).map((assignmentId) => {
        const currentResults = studentData[assignmentId] || [];
        const assignmentDetails = assignmentMap[assignmentId];
        const belongsToClass = assignmentDetails?.belongsToClass ?? false;

        let isIndividuallyAssigned = (assignmentUserRecords ?? []).some(
          (record) => record.assignment_id === assignmentId &&
          studentData[assignmentId]?.some((r) => r.student_id === record.user_id)
        );

        if (!isIndividuallyAssigned && studentData[assignmentId]?.length > 0 && !belongsToClass) {
          isIndividuallyAssigned = true;
        }

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
