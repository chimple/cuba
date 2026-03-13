import React, { useEffect, useState } from "react";
import "./Library.css";
import CourseComponent from "./CourseComponent";
import { useHistory } from "react-router";
import { PAGES, TableTypes } from "../../../common/constants";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { Util } from "../../../utility/util";
import { t } from "i18next";

const Library: React.FC = () => {
  const [courses, setCourses] = useState<TableTypes<"course">[]>([]);
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const current_class = await Util.getCurrentClass();
    const course_res = await api.getCoursesForClassStudent(
      current_class?.id ?? ""
    );

    course_res.sort(
      (a, b) => (a.sort_index ?? Infinity) - (b.sort_index ?? Infinity)
    );
    setCourses(course_res);
  };

  return (
    <div id="library-container" className="library-container">
      <div id="library-subtitle" className="library-subtitle">
        {t("Choose any subject to view the assignments")}
      </div>
      <div
        id="library-subtitle-divider"
        className="library-subtitle-divider"
      />
      <div id="library-course-grid" className="library-course-grid">
        {courses.map((course) => (
          <CourseComponent
            key={course.id}
            course={course}
            handleCourseCLick={() => {
              history.replace(PAGES.SHOW_CHAPTERS, { course });
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Library;
