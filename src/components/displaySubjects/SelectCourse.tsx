import { FC, useState, useEffect } from "react";
import Course from "../../models/course";
import "./SelectCourse.css";
import { t } from "i18next";
import SelectIconImage from "./SelectIconImage";
import { IoAddCircleSharp } from "react-icons/io5";
import { Splide, SplideSlide } from "@splidejs/react-splide";
const SelectCourse: FC<{
  courses: Course[];
  onCourseChange: (course: Course) => void;
}> = ({ courses, onCourseChange }) => {
  const chapterCardColors = [
    "#F99500",
    "#0090D3",
    "#F3609B",
    "#8F5AA5",
    "#009948",
  ];
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
                  backgroundColor: chapterCardColors[index],
                }}
              >
                <SelectIconImage
                  localSrc={`courses/chapter_icons/${course.courseCode}.png`}
                  defaultSrc={"courses/" + "maths" + "/icons/" + "maths10.png"}
                  webSrc={course.thumbnail}
                />
              </div>
              {/* {t(course.title)} */}
              {course.title === "English" ? course.title : t(course.title)}
            </div>
          </SplideSlide>
        );
      })}
      {
        <SplideSlide className="slide">
          <div className="subject-button">
            <div
              className="course-icon"
              style={{
                backgroundColor: "#8F5AA5",
                // opacity: "0.1",
              }}
            >
              <IoAddCircleSharp color="white" size="20vh" onClick={() => {}} />
            </div>
            {t("Add Subject")}
          </div>
        </SplideSlide>
      }
    </Splide>
  );
};
export default SelectCourse;