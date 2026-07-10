import React from "react";
import "./TableRightHeader.css";
import { t } from "i18next";
interface TableRightHeaderProps {
  headerDetails: Map<
    string,
    { headerName: string; startAt: string; endAt: string }
  >[];
}

const TableRightHeader: React.FC<TableRightHeaderProps> = ({
  headerDetails,
}) => {
  return (
    <>
      {headerDetails.map((assignmentMap, index) => {
        const [assignmentId, { headerName, startAt, endAt }] = Array.from(
          assignmentMap.entries()
        )[0];

        return (
          <th className="tableRightHeader" key={assignmentId}>
            <div className="aboveText">
              <span>{startAt}</span>
            </div>
            <div className="tableRightHeaderText">{t(headerName)}</div>
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
