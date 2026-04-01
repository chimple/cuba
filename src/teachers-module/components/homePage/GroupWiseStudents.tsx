import React from 'react';
import 'react-circular-progressbar/dist/styles.css';
import './GroupWiseStudents.css';
import { BANDWISECOLOR, TableTypes } from '../../../common/constants';
import { t } from 'i18next';

interface GroupWiseStudentsProps {
  color: string;
  studentsProgress?: Map<string, any>[];
  studentLength: string;
  onClickCallBack: Function;
}

const GroupWiseStudents: React.FC<GroupWiseStudentsProps> = ({
  color,
  studentsProgress,
  studentLength,
  onClickCallBack,
}) => {
  const groupTitle =
    color === BANDWISECOLOR.RED
      ? t('Not active for last 7 or more days')
      : color === BANDWISECOLOR.YELLOW
        ? t('Medium Engagement <45 minutes')
        : color === BANDWISECOLOR.GREEN
          ? t('High Engagement 45+ minutes')
          : t('App not downloaded');

  return (
    <div
      className="group-wise-container"
      style={{ borderColor: color }}
      onClick={() => {
        onClickCallBack();
      }}
    >
      <div className="group-wise-header" style={{ backgroundColor: color }}>
        <span>{groupTitle}</span>
        <span className="group-wise-count">
          {studentsProgress?.length ?? 0}/{studentLength}
        </span>
      </div>

      <div className="group-wise-content">
        <div className="avatars-wrapper">
          {(studentsProgress ?? []).map((stdpr) => {
            const student = stdpr.get('student') as TableTypes<'user'>;
            return (
              <div className="student-avatar-container" key={student.id}>
                <img
                  src={student.image || `assets/avatars/${student.avatar}.png`}
                  alt="Profile"
                  className="avatar"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `assets/avatars/${student.avatar}.png`;
                  }}
                />
                <span className="avatar-name">
                  {student.name && student.name.length > 8
                    ? student.name.substring(0, 8) + '...'
                    : (student.name ?? '')}
                </span>
              </div>
            );
          })}
        </div>

        <img
          src="assets/icons/arrowSign.png"
          alt="expand-icon"
          className="expand-icon"
        />
      </div>
    </div>
  );
};

export default GroupWiseStudents;
