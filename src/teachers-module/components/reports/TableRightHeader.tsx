import React from "react";
import "./TableRightHeader.css";
import { t } from "i18next";
interface TableRightHeaderProps {
  headerDetails: Map<string,{ headerName: string; startAt: string; endAt: string, subjectName?: string; }>[];
  showSubjects?: boolean;
  subjects?: {id: string; name: string}[];
  subjectName?: string;
}

const TableRightHeader: React.FC<TableRightHeaderProps> = ({
  headerDetails,
}) => {
  return (
    <>
       {headerDetails.map((assignmentMap, index) => {
        const [assignmentId, { headerName, startAt, endAt, subjectName }] = 
          Array.from(assignmentMap.entries())[0];

        // Use subjectName if available, otherwise fall back to headerName
        const displayName = subjectName || headerName;

        return (
          <th className="tableRightHeader" key={assignmentId}>
            <div className="aboveText">
              <span>{startAt}</span>
            </div>
            <div className="tableRightHeaderText">
              {t(displayName)}
            </div>
            <div className="belowText">
              <span>{endAt}</span>
            </div>
          </th>
        );
      })}
    </>
  );
};

export default TableRightHeader;
