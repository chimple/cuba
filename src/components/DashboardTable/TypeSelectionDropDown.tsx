import React from 'react';
import "./TypeSelectionDropDown.css"
import { TABLEDROPDOWN } from '../../common/constants';
interface TypeSelectionDropDownProps {
    dropdownValues: TABLEDROPDOWN[],
}

const TypeSelectionDropDown: React.FC<TypeSelectionDropDownProps> = ({ dropdownValues }) => {
    return (
        <div>
            <select className="type-dropdown" onChange={(val) => { }}>
                {Object.values(dropdownValues).map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                ))}
            </select></div>
    );
};

export default TypeSelectionDropDown;
