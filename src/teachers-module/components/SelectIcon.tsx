import React from 'react';
import './SelectIcon.css';
import { t } from 'i18next';

interface SelectIconProps {
  isSelected: boolean;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

const SelectIcon: React.FC<SelectIconProps> = ({ onClick, isSelected }) => {
  const label = t(isSelected ? 'Remove' : 'Add');

  return (
    <div className="select-icon-container">
      <div
        id="select-Assignmenticon"
        className={`select-Assignmenticon${isSelected ? ' is-selected' : ''}`}
        onClick={onClick}
      >
        <span
          id="select-Assignmenticon-image"
          className="select-Assignmenticon-image"
          aria-hidden="true"
        >
          {isSelected ? '-' : '+'}
        </span>

        <span id="select-text" className="select-text">
          {label}
        </span>
      </div>
    </div>
  );
};

export default SelectIcon;
