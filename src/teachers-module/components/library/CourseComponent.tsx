import React from "react";
import { t } from "i18next";
import "./CourseComponent.css";
import { COURSES, TableTypes, belowGrade1, grade1 } from "../../../common/constants";
import SelectIconImage from "../../../components/displaySubjects/SelectIconImage";

interface CourseComponentProps {
  course: TableTypes<"course">;
  handleCourseCLick: () => void;
}

const CourseComponent: React.FC<CourseComponentProps> = ({
  course,
  handleCourseCLick,
}) => {
  // Determine if it's Grade 1 based on the grade_id
  const isGrade1 =
    course.grade_id === grade1 || course.grade_id === belowGrade1;

  // Build the icon path using course.code.
  // If no code is available, default to English icon.
  // const localSrc = course.code
  //   ? `courses/${course.code}/icons/${course.code}00.webp`
  //   : `courses/en/icons/en00.webp`;

  return (
    <div onClick={handleCourseCLick} className="course-button">
      <div className="course-icon-container">
        <div className="library-course-icon">
          <SelectIconImage
            defaultSrc={"assets/icons/DefaultIcon.png"}
            webSrc={`${course.image}`}
          />
        </div>
        <div className="course-name">
          {course.code ===COURSES.ENGLISH ? course.name : t(course.name)}
        </div>

        <div className="grade-name">
          {course.code ===COURSES.ENGLISH
            ? `Grade ${isGrade1 ? "1" : "2"}`
            : `${t("Grade")} ${isGrade1 ? "1" : "2"}`}
        </div>
      </div>
    </div>
  );
};

export default CourseComponent;
