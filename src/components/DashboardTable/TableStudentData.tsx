import React from 'react';
import "./TableStudentData.css"
interface TableStudentDataProps {
    studentData
}

function getColor(score) {
    if (score == null) {
        return 'white'
    }
    else if (score < 30) {
        return '#EAA6B1';
    } else if (score >= 30 && score <= 70) {
        return '#F4D6AE';
    } else {
        return '#CEF3D6';
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
