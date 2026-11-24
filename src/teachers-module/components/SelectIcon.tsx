import React from 'react';
import './SelectIcon.css';
import { t } from 'i18next';
import { getTrackableProps, type TrackableId } from '../../analytics/trackable';

interface SelectIconProps {
  isSelected: boolean;
  onClick: React.MouseEventHandler<HTMLDivElement>;
  trackableId?: TrackableId;
}

const SelectIcon: React.FC<SelectIconProps> = ({
  onClick,
  isSelected,
  trackableId,
}) => {
  const label = t(isSelected ? 'Remove' : 'Add');

  return (
    <div className="select-icon-container">
      <div
        id="select-Assignmenticon"
        {...(trackableId ? getTrackableProps(trackableId) : {})}
        className={`select-Assignmenticon${trackableId ? ` ${trackableId}` : ''}${isSelected ? ' is-selected' : ''}`}
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
