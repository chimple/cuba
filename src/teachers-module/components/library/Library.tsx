import React, { useCallback, useEffect, useState } from 'react';
import './Library.css';
import CourseComponent from './CourseComponent';
import { useHistory } from 'react-router';
import { PAGES, TableTypes } from '../../../common/constants';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { Util } from '../../../utility/util';
import { t } from 'i18next';

const Library: React.FC = () => {
  const [courses, setCourses] = useState<TableTypes<'course'>[]>([]);
  const [grades, setGrades] = useState<TableTypes<'grade'>[]>([]);
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();

  const init = useCallback(async () => {
    const current_class = await Util.getCurrentClass();
    const course_res = await api.getCoursesForClassStudent(
      current_class?.id ?? '',
    );

    course_res.sort(
      (a, b) => (a.sort_index ?? Infinity) - (b.sort_index ?? Infinity),
    );
    const grade_res = await api.getAllGrades();
    setGrades(grade_res);
    setCourses(course_res);
  }, [api]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div id="library-container" className="library-container">
      <div id="library-subtitle" className="library-subtitle">
        {t('Choose any subject to view the assignments')}
      </div>
      <div id="library-subtitle-divider" className="library-subtitle-divider" />
      <div id="library-course-grid" className="library-course-grid">
        {courses.map((course) => {
          const gradeName = grades.find(
            (grade) => grade.id === course.grade_id,
          )?.name;
          return (
            <CourseComponent
              key={course.id}
              course={course}
              gradeName={gradeName}
              handleCourseCLick={() => {
                history.replace(PAGES.SHOW_CHAPTERS, { course, gradeName });
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Library;
