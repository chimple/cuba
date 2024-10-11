import React, { useState } from "react";
import "./ExpandedTable.css";
interface ExpandedTableProps {
  expandedData;
}

function getColor(score) {
  if (score == null) {
    return "white";
  } else if (score < 30) {
    return "red";
  } else if (score >= 30 && score <= 70) {
    return "orange";
  } else {
    return "green";
  }
}
const ExpandedTable: React.FC<ExpandedTableProps> = ({ expandedData }) => {
  return (
    <>
      {Object.keys(expandedData).map((val, key) => (
        <tr key={key}>
          <td>{"Lesson Name"}</td>
          {Object.keys(expandedData[val]).map((v, k) => (
            <td
              className="square-cell"
              style={{ color: getColor(expandedData[val][v]) }}
            >
              {expandedData[val][v] + "%"}
            </td>
          ))}
        </tr>
      ))}
      {/* <div className='border-divide'></div> */}
    </>
  );
};

export default ExpandedTable;
