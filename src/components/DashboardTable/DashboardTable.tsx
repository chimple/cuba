// Table.tsx
import React, { useState } from 'react';
import './DashboardTable.css'; // Import CSS file for styling
import ExpandedUser from './ExpandedUser';
import TableChoiceHeader from './TableChoiceHeader';
import TableRightHeader from './TableRightHeader';
import TableStudentData from './TableStudentData';


interface DashboardTableProps {
}

const DashboardTable: React.FC<DashboardTableProps> = ({ }) => {
    const [expandedRow, setExpandedRow] = useState(null);

    const handleRowClick = (key) => {
        if (expandedRow === key) {
            setExpandedRow(null);
        } else {
            setExpandedRow(key);
        }
    };
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // const data1 = [
    //     { name: "Anom", score: 19, },
    //     { name: "Megha", score: 19, },
    //     { name: "Subham", score: 25 },
    // ]
    const studentData = {
        "Alice": {
            "Math": null,
            "Science": 90,
            "History": 67,
            "English": null,
            "Art": 12,
            "Physical Education": 82,
            "Computer Science": 78
        },
        "Bob": {
            "Math": 78,
            "Science": null,
            "History": 72,
            "English": 90,
            "Art": null,
            "Physical Education": 30,
            "Computer Science": 86
        },
        "Charlie": {
            "Math": 42,
            "Science": null,
            "History": 15,
            "English": 80,
            "Art": 36,
            "Physical Education": null,
            "Computer Science": 19
        },
        "David": {
            "Math": 20,
            "Science": 82,
            "History": 38,
            "English": 95,
            "Art": 30,
            "Physical Education": 95,
            "Computer Science": 29
        },
        "Eva": {
            "Math": 78,
            "Science": 90,
            "History": 45,
            "English": 82,
            "Art": 20,
            "Physical Education": null,
            "Computer Science": 57
        },
        "Frank": {
            "Math": 15,
            "Science": 80,
            "History": 45,
            "English": null,
            "Art": 32,
            "Physical Education": 80,
            "Computer Science": 14
        },
        "Grace": {
            "Math": 90,
            "Science": 12,
            "History": 78,
            "English": null,
            "Art": 62,
            "Physical Education": 15,
            "Computer Science": 98
        },
        "Eva1": {
            "Math": null,
            "Science": 90,
            "History": 45,
            "English": 82,
            "Art": 20,
            "Physical Education": 88,
            "Computer Science": 57
        },
        "Frank1": {
            "Math": null,
            "Science": 80,
            "History": 45,
            "English": 98,
            "Art": 32,
            "Physical Education": 80,
            "Computer Science": 14
        },
        "Grace1": {
            "Math": 90,
            "Science": 12,
            "History": 78,
            "English": 24,
            "Art": 62,
            "Physical Education": 15,
            "Computer Science": 98
        },
        "Alice1": {
            "Math": null,
            "Science": 90,
            "History": 67,
            "English": null,
            "Art": 12,
            "Physical Education": 82,
            "Computer Science": 78
        },
        "Bob1": {
            "Math": 78,
            "Science": null,
            "History": 72,
            "English": 90,
            "Art": null,
            "Physical Education": 30,
            "Computer Science": 86
        },
        "Charlie1": {
            "Math": 42,
            "Science": null,
            "History": 15,
            "English": 80,
            "Art": 36,
            "Physical Education": null,
            "Computer Science": 19
        },
        "David1": {
            "Math": 20,
            "Science": 82,
            "History": 38,
            "English": 95,
            "Art": 30,
            "Physical Education": 95,
            "Computer Science": 29
        },
    };

    return (

        <div className="table">
            {/* <div className="table-container"> */}
            <table>
                <thead>
                    <tr>
                        <th><TableChoiceHeader /></th>
                        <TableRightHeader headerDetails={daysOfWeek} />
                    </tr>
                </thead>
                <tbody >
                    {Object.keys(studentData).map((val, key) => (
                        <React.Fragment key={key}>
                            <tr>
                                <td style={{ borderRight: expandedRow === key ? '0' : '1px solid grey' }} onClick={() => handleRowClick(key)}>
                                    {expandedRow === key ? (
                                        <ExpandedUser name={val} onClickViewDetails={() => { }} />
                                    ) : (
                                        <div>{val}</div>
                                    )}
                                </td>

                                {expandedRow === key ? (
                                    null
                                ) :
                                    <TableStudentData studentData={studentData[val]} />
                                }
                            </tr>
                            {expandedRow === key && (
                                <tr>

                                    <td>{'a'}</td>
                                    {/* <td className="square-cell">{val.score}</td>
                                        <td className="square-cell">{val.score}</td>
                                        <td className="square-cell">{val.score}</td>
                                        <td className="square-cell">{val.score}</td>
                                        <td className="square-cell">{val.score}</td>
                                        <td className="square-cell">{val.score}</td>
                                        <td className="square-cell">{val.score}</td> */}
                                    {/* </td> */}
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            {/* </div> */}
        </div>
    );
};

export default DashboardTable;
