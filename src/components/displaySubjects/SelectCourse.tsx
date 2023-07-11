import { FC, useState } from "react";
import Course from "../../models/course";
import "./SelectCourse.css";
import { t } from "i18next";
import CachedImage from "../common/CachedImage";

const SelectCourse: FC<{
  courses: Course[];
  onCourseChange: (course: Course) => void;
}> = ({ courses, onCourseChange }) => {
  const [count, setCount] = useState(1);
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
              {count === 1 ? (
                <img
                  className="class-avatar-img"
                  src={"assets/icons/EnglishIco.svg"}
                  alt=""
                  onError={() => {
                    setCount(2);
                    console.log(course.thumbnail);
                  }}
                />
              ) : count === 2 ? (
                <CachedImage
                  className="class-avatar-img"
                  src={
                    course.thumbnail ??
                    "courses/" + "maths" + "/icons/" + "maths10.png"
                  }
                  alt=""
                  onError={() => {
                    setCount(3);
                  }}
                />
              ) : (
                <img
                  className="class-avatar-img"
                  src={"courses/" + "maths" + "/icons/" + "maths10.png"}
                  alt="all"
                />
              )}
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
