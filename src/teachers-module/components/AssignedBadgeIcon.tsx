import React from 'react';
import './AssignedBadgeIcon.css';

type AssignedBadgeIconProps = {
  id?: string;
  className?: string;
  ariaLabel?: string;
  title?: string;
};

const AssignedBadgeIcon: React.FC<AssignedBadgeIconProps> = ({
  id,
  className = '',
  ariaLabel,
  title,
}) => {
  return (
    <span
      id={id}
      className={`assigned-badge-icon ${className}`.trim()}
      aria-label={ariaLabel}
      title={title}
    >
      <img
        src="/assets/icons/assignmentSelectGreen.svg"
        alt=""
        className="assigned-badge-icon-sheet"
        aria-hidden="true"
      />
      <img
        src="/assets/icons/GreenSign.svg"
        alt=""
        className="assigned-badge-icon-check"
        aria-hidden="true"
      />
    </span>
  );
};

export default AssignedBadgeIcon;
