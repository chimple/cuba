import { FC, useState } from "react";
import Course from "../../models/course";
import "./SelectCourse.css";
import { t } from "i18next";
import SelectIconImage from "./SelectIconImage";

const SelectCourse: FC<{
  courses: Course[];
  onCourseChange: (course: Course) => void;
}> = ({ courses, onCourseChange }) => {
  return (
    <div className="subject-container">
      {courses.map((course) => {
        return (
          <div
            onClick={() => {
              onCourseChange(course);
            }}
            className="subject-button"
            key={course.docId}
          >
            <div className="course-icon">
              <SelectIconImage
                localSrc={`courses/chapter_icons/${course.courseCode}.png`}
                defaultSrc={"courses/" + "maths" + "/icons/" + "maths10.png"}
                webSrc={course.thumbnail}
              />
            </div>
            {/* {t(course.title)} */}
            {course.title === "English" ? course.title : t(course.title)}
          </div>
        );
      })}
    </div>
  );
};
export default SelectCourse;
