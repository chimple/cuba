// Table.tsx
import React, { useState } from 'react';
import './DashboardTable.css'; // Import CSS file for styling
import ExpandedUser from './ExpandedUser';
import TableChoiceHeader from './TableChoiceHeader';
import TableRightHeader from './TableRightHeader';
import TableStudentData from './TableStudentData';
import ExpandedTable from './ExpandedTable';


interface DashboardTableProps {
    studentsData
}

const DashboardTable: React.FC<DashboardTableProps> = ({ studentsData }) => {
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
  
    return (

        <div className="table">
            {/* <div className="table-container"> */}
            <table>
                <thead>
                    <tr>
                        <th><TableChoiceHeader dateRange={'12thFeb-23thFeb'} /></th>
                        <TableRightHeader headerDetails={daysOfWeek} />
                    </tr>
                </thead>
                <tbody >
                    {Object.keys(studentsData).map((val, key) => (
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
                                    <TableStudentData studentData={studentsData[val]} />
                                }
                            </tr>
                            {expandedRow === key && (
                                <ExpandedTable expandedData={studentsData} />
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
