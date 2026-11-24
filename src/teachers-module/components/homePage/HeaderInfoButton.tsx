import React from 'react';
import { getTrackableProps, TRACKABLE_IDS } from '../../../analytics/trackable';

interface HeaderInfoButtonProps {
  label: string;
  onClick: () => void;
}

const HeaderInfoButton: React.FC<HeaderInfoButtonProps> = ({
  label,
  onClick,
}) => (
  <button
    type="button"
    id={TRACKABLE_IDS.TEACHER_HEADER_INFO_BUTTON}
    {...getTrackableProps(TRACKABLE_IDS.TEACHER_HEADER_INFO_BUTTON)}
    className="header-info-icon-button teacher_header_info_button"
    onClick={onClick}
    aria-label={label}
  >
    <img src="/assets/icons/infoIcon.svg" alt="" className="header-info-icon" />
  </button>
);

export default HeaderInfoButton;
