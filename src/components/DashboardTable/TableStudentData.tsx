import React from 'react';
import "./TableStudentData.css"
interface TableStudentDataProps {
    studentData: Map<string, string>
}

function getColor(score) {
    console.log(score)
    if (score < 30) {
        return 'red';
    } else if (score >= 30 && score <= 70) {
        return 'orange';
    } else {
        return 'green';
    }
}

const TableStudentData: React.FC<TableStudentDataProps> = ({ studentData }) => {
    return (
        <>
            {Object.keys(studentData).map((val, key) => (
                <td className="square-cell" style={{ backgroundColor: getColor(studentData[val]) }}>{studentData[val]}</td>
            ))}
        </>
    );

};

export default TableStudentData;
