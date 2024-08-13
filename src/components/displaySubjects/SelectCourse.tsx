import { FC, useState, useEffect } from "react";
import Course from "../../models/course";
import "./SelectCourse.css";
import { t } from "i18next";
import SelectIconImage from "./SelectIconImage";
import { IoAddCircleSharp } from "react-icons/io5";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import {
  DEFUALT_SUBJECT_CARD_COLOUR,
  PAGES,
  TableTypes,
} from "../../common/constants";
import { useHistory } from "react-router";
import { ServiceConfig } from "../../services/ServiceConfig";
interface CourseDetails {
  course: TableTypes<"course">;
  grade?: TableTypes<"grade"> | null;
  curriculum?: TableTypes<"curriculum"> | null;
}
const SelectCourse: FC<{
  courses: TableTypes<"course">[];
  modeParent: boolean;
  onCourseChange: (course: TableTypes<"course">) => void;
}> = ({ courses, modeParent, onCourseChange }) => {
  const [courseDetails, setCourseDetails] = useState<CourseDetails[]>([]);
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    fetchCourseDetails();
  }, [courses]);
  const fetchCourseDetails = async () => {
    const detailedCourses: CourseDetails[] = await Promise.all(
      courses.map(async (course) => {
        const gradeDoc = await api.getGradeById(course.grade_id!);
        const curriculumDoc = await api.getCurriculumById(
          course.curriculum_id!
        );
        return {
          course,
          grade: gradeDoc,
          curriculum: curriculumDoc,
        };
      })
    );
    setCourseDetails(detailedCourses);
  };
  courseDetails.sort((a, b) => {
    return a.course.sort_index! - b.course.sort_index!;
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
      {courseDetails.map(({ course, grade, curriculum }, index) => {
        return (
          <SplideSlide key={index} className="slide">
            <div
              onClick={() => {
                onCourseChange(course);
              }}
              className="subject-button"
              key={course.id}
            >
              <div id="subject-card-subject-name">
                <p>
                  <p>{grade?.name}</p>
                </p>
              </div>
              <div
                className="course-icon"
                style={{
                  backgroundColor: course.color ?? DEFUALT_SUBJECT_CARD_COLOUR,
                }}
              >
                <SelectIconImage
                  localSrc={`courses/chapter_icons/${course.code}.webp`}
                  defaultSrc={"assets/icons/DefaultIcon.png"}
                  webSrc={course.image || "assets/icons/DefaultIcon.png"}
                  imageWidth={"80%"}
                  imageHeight={"auto"}
                />
              </div>
              <div className="course-title">{course.name}</div>
              {curriculum && (
                <div className="course-curriculum">{curriculum.name}</div>
              )}
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
            key={courses[0].id}
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
