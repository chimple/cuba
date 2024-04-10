import { FC, useState, useEffect } from "react";
import Course from "../../models/course";
import "./SelectCourse.css";
import { t } from "i18next";
import SelectIconImage from "./SelectIconImage";
import { IoAddCircleSharp } from "react-icons/io5";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import {
  CHAPTER_CARD_COLOURS,
  DEFUALT_SUBJECT_CARD_COLOUR,
  PAGES,
  aboveGrade3,
  belowGrade1,
  grade1,
  grade2,
  grade3,
} from "../../common/constants";
import { useHistory } from "react-router";
const SelectCourse: FC<{
  courses: Course[];
  modeParent: boolean;
  onCourseChange: (course: Course) => void;
}> = ({ courses, modeParent, onCourseChange }) => {
  courses.sort((a, b) => {
    return a.sortIndex - b.sortIndex;
  });
  const history = useHistory();
  return (
    <Splide
      hasTrack={true}
      options={{
        arrows: false,
        wheel: true,
        lazyLoad: true,
        direction: "ltr",
        pagination: false,
      }}
    >
      {courses.map((course, index) => {
        let isGrade1: string | boolean = false;
        let isGrade2: string | boolean = false;
        let gradeDocId = course.grade.id;

        // Check if gradeDocId matches any of the specified grades and assign the value to isGrade1 or isGrade2
        if (gradeDocId === grade1 || gradeDocId === belowGrade1) {
          isGrade1 = true;
        } else if (
          gradeDocId === grade2 ||
          gradeDocId === grade3 ||
          gradeDocId === aboveGrade3
        ) {
          isGrade2 = true;
        } else {
          // If it's neither grade1 nor grade2, assume grade2
          isGrade2 = true;
        }
        return (
          <SplideSlide className="slide">
            <div
              onClick={() => {
                onCourseChange(course);
              }}
              className="subject-button"
              key={course.docId}
            >
              <div id="subject-card-subject-name">
                <p>
                  {isGrade1 ? "Grade 1" : "Grade 2"}
                  {/* {subject.title==="English"?subject.title:t(subject.title)} */}
                </p>
              </div>
              <div
                className="course-icon"
                style={{
                  backgroundColor: course.color ?? DEFUALT_SUBJECT_CARD_COLOUR,
                }}
              >
                <SelectIconImage
                  localSrc={`courses/chapter_icons/${course.courseCode}.webp`}
                  defaultSrc={"courses/" + "en" + "/icons/" + "en38.webp"}
                  webSrc={course.thumbnail}
                />
              </div>
              {t(course.title)}
              {/* {course.title === "English" ? course.title : course.title} */}
            </div>
          </SplideSlide>
        );
      })}
      {modeParent ? (
        <SplideSlide className="slide">
          <div
            onClick={() => {
              history.replace(PAGES.ADD_SUBJECTS);
            }}
            className="subject-button"
            key={courses[0].docId}
          >
            <div
              className="course-icon"
              style={{
                backgroundColor: "#8F5AA5",
              }}
            >
              <IoAddCircleSharp color="white" size="20vh" onClick={() => {}} />
            </div>
            {t("Add Subject")}
          </div>
        </SplideSlide>
      ) : (
        <></>
      )}
    </Splide>
  );
};
export default SelectCourse;
