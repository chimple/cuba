import React from "react";
interface TableRightHeaderProps {
  headerDetails: Map<
    string,
    { headerName: string; startAt: string; endAt: string; courseId?: any }
  >[];
  showSubjects?: boolean; // Add this line
  subjects?: { id: string; name: string }[]; // Add this line
}

const TableRightHeader: React.FC<TableRightHeaderProps> = ({
  headerDetails,
  showSubjects = false,
  subjects = [],
}) => {
  
  // For Assignment Report with All Subjects, show subjects as headers
  if (showSubjects && subjects.length > 0) {
    return (
      <>
        {subjects.map((subject, index) => (
          <th key={`subject-${index}`}>{subject.name}</th>
        ))}
      </>
    );
  }

  // Original behavior for other cases
  return (
    <>
      {headerDetails.map((dayMap, index) => {
        const firstEntry = dayMap.values().next().value;
        return (
          <th key={index}>{firstEntry?.headerName || ''}</th>
        );
      })}
    </>
  );
};

export default TableRightHeader;