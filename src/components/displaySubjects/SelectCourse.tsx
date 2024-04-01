import { FC, useState, useEffect } from "react";
import Course from "../../models/course";
import "./SelectCourse.css";
import { t } from "i18next";
import SelectIconImage from "./SelectIconImage";
import { IoAddCircleSharp } from "react-icons/io5";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { CHAPTER_CARD_COLOURS, PAGES } from "../../common/constants";
import { useHistory } from "react-router";
const SelectCourse: FC<{
  courses: Course[];
  modeParent: boolean;
  onCourseChange: (course: Course) => void;
}> = ({ courses, modeParent, onCourseChange }) => {
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
        return (
          <SplideSlide className="slide">
            <div
              onClick={() => {
                onCourseChange(course);
              }}
              className="subject-button"
              key={course.docId}
            >
              <div
                className="course-icon"
                style={{
                  backgroundColor: course.color,
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
      {modeParent ?
       <SplideSlide className="slide">
          <div 
            onClick={() => {
              history.replace(PAGES.ADD_SUBJECTS);
              }}
              className="subject-button"
              key={courses[0].docId}>
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
        </SplideSlide>: <></>}
      
    </Splide>
  );
};
export default SelectCourse;
