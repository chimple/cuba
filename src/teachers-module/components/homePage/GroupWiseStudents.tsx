import React from 'react';
import 'react-circular-progressbar/dist/styles.css';
import './GroupWiseStudents.css';
import {
  getBandTitleByColor,
  StudentProgressData,
  TableTypes,
} from '../../../common/constants';
import { t } from 'i18next';

interface GroupWiseStudentsProps {
  color: string;
  studentsProgress?: StudentProgressData[];
  studentLength: string;
  onStudentClick?: (student: TableTypes<'user'>) => void;
}

const GroupWiseStudents: React.FC<GroupWiseStudentsProps> = ({
  color,
  studentsProgress,
  studentLength,
  onStudentClick,
}) => {
  const groupTitle = getBandTitleByColor(color, t as (key: string) => string);

  return (
    <div className="group-wise-container" style={{ borderColor: color }}>
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
              <div
                className="student-avatar-container"
                key={student.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onStudentClick?.(student);
                }}
              >
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
      </div>
    </div>
  );
};

export default GroupWiseStudents;
