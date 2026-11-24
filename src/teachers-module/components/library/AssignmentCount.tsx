import React from 'react';
import './AssigmentCount.css';
import { t } from 'i18next';
import { getTrackableProps, TRACKABLE_IDS } from '../../../analytics/trackable';
interface AssigmentCountProps {
  assignments: number;
  onClick: () => void;
}

const AssigmentCount: React.FC<AssigmentCountProps> = ({
  assignments,
  onClick,
}) => {
  return (
    <div
      id={TRACKABLE_IDS.TEACHER_ASSIGNMENT_COUNT_NEXT_BUTTON}
      {...getTrackableProps(TRACKABLE_IDS.TEACHER_ASSIGNMENT_COUNT_NEXT_BUTTON)}
      className="assignment-count-container teacher_assignment_count_next_button"
      onClick={onClick}
    >
      <div className="assignment-count-body">
        <div className="assignment-count-text">
          {assignments} {t('Assignments')}
        </div>
        <div className="assignment-count-next-button">
          {t('Next')}
          <img src="assets/icons/arrowRightWhite.png" alt="Arrow_sign" />
        </div>
      </div>
    </div>
  );
};

export default AssigmentCount;
