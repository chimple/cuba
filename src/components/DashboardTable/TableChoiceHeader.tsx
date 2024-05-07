import React, { useState } from 'react';
import "./TableChoiceHeader.css"
import TypeSelectionDropDown from './TypeSelectionDropDown';
import { IoIosArrowDropdownCircle } from "react-icons/io";
import { TABLEDROPDOWN } from '../../common/constants';

interface TableChoiceHeaderProps {
   dateRange:string,
}

const TableChoiceHeader: React.FC<TableChoiceHeaderProps> = ({dateRange }) => {
    const [tabIndex, setTabIndex] = useState(TABLEDROPDOWN);
    return (
        <div>
            <TypeSelectionDropDown dropdownValues={Object.values(TABLEDROPDOWN)} />
            <div className='date-range'>{dateRange}</div>
            <div className='sort-name'>
                <div >Name</div>
                <IoIosArrowDropdownCircle className='sort-button' onClick={() => { }} />
            </div>
        </div>
    );
};

export default TableChoiceHeader;
