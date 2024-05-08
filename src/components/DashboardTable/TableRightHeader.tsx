import React from 'react';
interface TableRightHeaderProps {
    headerDetails: string[]
}

const TableRightHeader: React.FC<TableRightHeaderProps> = ({ headerDetails }) => {
    return (
        <>
            {headerDetails.map((day, index) => (
                <th key={index}>{day}</th>
            ))}
        </>

    );
};

export default TableRightHeader;
