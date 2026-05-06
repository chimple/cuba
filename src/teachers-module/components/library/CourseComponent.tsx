import React from 'react';
import { t } from 'i18next';
import './CourseComponent.css';
import {
  COURSES,
  TableTypes,
  getDisplayGradeNumber,
} from '../../../common/constants';
import SelectIconImage from '../../../components/displaySubjects/SelectIconImage';

interface CourseComponentProps {
  course: TableTypes<'course'>;
  handleCourseCLick: () => void;
}

const CourseComponent: React.FC<CourseComponentProps> = ({
  course,
  handleCourseCLick,
}) => {
  const displayGradeNumber = getDisplayGradeNumber(course.grade_id);

  return (
    <div onClick={handleCourseCLick} className="course-button">
      <div className="course-icon-container">
        <div className="library-course-icon">
          <SelectIconImage
            defaultSrc={'assets/icons/DefaultIcon.png'}
            webSrc={`${course.image}`}
          />
        </div>
        <div className="course-name">
          {course.code === COURSES.ENGLISH ? course.name : t(course.name)}
        </div>

        <div className="grade-name">
          {course.code === COURSES.ENGLISH
            ? `Grade ${displayGradeNumber}`
            : `${t('Grade')} ${displayGradeNumber}`}
        </div>
      </div>
    </div>
  );
};

export default CourseComponent;
