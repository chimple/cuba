import React, { useEffect, useRef, useState } from "react";
import "./Library.css";
import CourseComponent from "./CourseComponent";
import { useHistory } from "react-router";
import { PAGES, TableTypes } from "../../../common/constants";
import { ServiceConfig } from "../../../services/ServiceConfig";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Util } from "../../../utility/util";
import { t } from "i18next";

const Library: React.FC = () => {
  const [courses, setCourses] = useState<TableTypes<"course">[]>([]);
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const inputEl = useRef(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const current_class = await Util.getCurrentClass();
    const course_res = await api.getCoursesForClassStudent(current_class?.id ?? "");
    
    course_res.sort(
      (a, b) => (a.sort_index ?? Infinity) - (b.sort_index ?? Infinity)
    );
    console.log("My following subjects are- ", course_res)
    setCourses(course_res);
  };

  return (
    <div className="library-container">
      <div
        className="lesson-search"
        onClick={() => history.replace(PAGES.SEARCH_LESSON)}
      >
        <SearchOutlinedIcon style={{ color: "black" }} />
        <span className="text">{t("Search")}...</span>
      </div>
      <div className="course-grid">
        {courses.map(course => (
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
