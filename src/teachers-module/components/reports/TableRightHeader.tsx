import React from "react";
import "./TableRightHeader.css";
import { t } from "i18next";


interface AssignmentHeader {
  headerName: string;
  startAt: string;
  endAt: string;
}

interface TableRightHeaderProps {
  headerDetails: Map<string, AssignmentHeader>[];
  dateRangeValue: {
    startDate: Date;
    endDate: Date;
    isStudentProfilePage: boolean;
  };
}

const TableRightHeader: React.FC<TableRightHeaderProps> = ({
  headerDetails,
  dateRangeValue,
}) => {
  const { startDate } = dateRangeValue;

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
    });

  return (
    <>
      {headerDetails.map((assignmentMap, index) => {
        const [assignmentId, details] =
          Array.from(assignmentMap.entries())[0] ?? [];

        if (!details) return null;

        const { headerName } = details;

        const displayDate = new Date(startDate);
        displayDate.setDate(startDate.getDate() + index);

        return (
          <th className="tableRightHeader" key={assignmentId || index}>
            <div className="aboveText">
              <span>{formatDate(displayDate)}</span>
            </div>
            <div className="tableRightHeaderText">
              {t(headerName)}
            </div>
            {/* <div className="belowText">
              <span>&nbsp;</span>
            </div> */}
          </th>
        );
      })}
    </>
  );
};

export default TableRightHeader;