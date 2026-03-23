import React from 'react';
import { t } from 'i18next';
import './CourseComponent.css';
import {
  COURSES,
  TableTypes,
  belowGrade1,
  grade1,
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
  // Determine if it's Grade 1 based on the grade_id
  const isGrade1 =
    course.grade_id === grade1 || course.grade_id === belowGrade1;

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
            ? `Grade ${isGrade1 ? '1' : '2'}`
            : `${t('Grade')} ${isGrade1 ? '1' : '2'}`}
        </div>
      </div>
    </div>
  );
};

export default CourseComponent;
