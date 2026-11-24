import React, { MouseEventHandler } from 'react';
import 'react-circular-progressbar/dist/styles.css';
import './AssignmentNextButton.css'; // Import the CSS file
import { t } from 'i18next';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import {
  getTrackableProps,
  TRACKABLE_IDS,
} from '../../../../analytics/trackable';

interface AssignmentNextButtonProps {
  assignmentCount: Number;
  onClickCallBack: MouseEventHandler<HTMLDivElement>;
}
const AssignmentNextButton: React.FC<AssignmentNextButtonProps> = ({
  assignmentCount,
  onClickCallBack,
}) => {
  return (
    <div
      id={TRACKABLE_IDS.TEACHER_ASSIGNMENTS_NEXT_BUTTON}
      {...getTrackableProps(TRACKABLE_IDS.TEACHER_ASSIGNMENTS_NEXT_BUTTON)}
      className="assign-button teacher_assignments_next_button"
      onClick={onClickCallBack}
    >
      <div className="assign-button-text">
        <LibraryBooksOutlinedIcon></LibraryBooksOutlinedIcon>
        <span id="assignment-count">
          {assignmentCount.toString()} {t('Assignments')}
        </span>
      </div>
      <div className="assign-button-text">
        <span>{t('Next')}</span>
        <ArrowForwardIosOutlinedIcon></ArrowForwardIosOutlinedIcon>
      </div>
    </div>
  );
};

export default AssignmentNextButton;
