// Table.tsx
import React, { useState } from 'react';
import './DashboardTable.css'; // Import CSS file for styling
import ExpandedUser from './ExpandedUser';
import TableChoiceHeader from './TableChoiceHeader';
import TableRightHeader from './TableRightHeader';
import TableStudentData from './TableStudentData';
import ExpandedTable from './ExpandedTable';


interface DashboardTableProps {
    studentsData,
    headerData
}

const DashboardTable: React.FC<DashboardTableProps> = ({ studentsData, headerData }) => {
    const [expandedRow, setExpandedRow] = useState(null);

    const handleRowClick = (key) => {
        if (expandedRow === key) {
            setExpandedRow(null);
        } else {
            setExpandedRow(key);
        }
    };
    return (

        <div className="table">
            {/* <div className="table-container"> */}
            <table>
                <thead>
                    <tr>
                        <th><TableChoiceHeader dateRange={'12thFeb-23thFeb'} /></th>
                        <TableRightHeader headerDetails={headerData} />
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
