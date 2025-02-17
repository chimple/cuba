import { FC, useState, useEffect } from "react";
import Course from "../../models/course";
import "./SelectCourse.css";
import { t } from "i18next";
import SelectIconImage from "./SelectIconImage";
import { IoAddCircleSharp } from "react-icons/io5";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { DEFUALT_SUBJECT_CARD_COLOUR, PAGES } from "../../common/constants";
import { useHistory } from "react-router";
import { getDoc } from "firebase/firestore";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";

interface CourseDetails {
  course: Course;
  grade?: Grade | null;
  curriculum?: Curriculum | null;
}

const SelectCourse: FC<{
  courses: Course[];
  modeParent: boolean;
  onCourseChange: (course: Course) => void;
}> = ({ courses, modeParent, onCourseChange }) => {
  const [courseDetails, setCourseDetails] = useState<CourseDetails[]>([]);
  const history = useHistory();

  useEffect(() => {
    fetchCourseDetails();
  }, [courses]);

  // Function to define priority based on courseCode
  const getCoursePriority = (courseCode: string): number => {
    if (courseCode.toLowerCase() === "en") return 1; // English always 1st
    if (courseCode.toLowerCase() === "maths") return 2; // Maths always 2nd
    if (courseCode.toLowerCase() === "puzzle") return 4; // Digital Skills always 4th
    return 3; // Any other subject will be in the 3rd position
  };

  // Fetch Course Details (with Grade & Curriculum)
  const fetchCourseDetails = async () => {
    const detailedCourses: CourseDetails[] = await Promise.all(
      courses.map(async (course) => {
        const gradeDoc = await getDoc(course.grade);
        const curriculumDoc = await getDoc(course.curriculum);
        return {
          course,
          grade: gradeDoc.exists() ? (gradeDoc.data() as Grade) : null,
          curriculum: curriculumDoc.exists()
            ? (curriculumDoc.data() as Curriculum)
            : null,
        };
      })
    );

    // Sorting courses based on fixed priority order
    detailedCourses.sort(
      (a, b) => getCoursePriority(a.course.courseCode) - getCoursePriority(b.course.courseCode)
    );

    setCourseDetails(detailedCourses);
  };

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
      {courseDetails.map(({ course, grade, curriculum }) => {
        return (
          <SplideSlide className="slide" key={course.docId}>
            <div
              onClick={() => {
                onCourseChange(course);
              }}
              className="subject-button"
            >
              <div id="subject-card-subject-name">
                <p>{grade?.title}</p>
              </div>
              <div
                className="course-icon"
                style={{
                  backgroundColor: course.color ?? DEFUALT_SUBJECT_CARD_COLOUR,
                }}
              >
                <SelectIconImage
                  localSrc={`courses/chapter_icons/${course.courseCode}.webp`}
                  defaultSrc={"assets/icons/DefaultIcon.png"}
                  webSrc={course.thumbnail || "assets/icons/DefaultIcon.png"}
                  imageWidth={"100%"}
                  imageHeight={"80%"}
                />
              </div>
              <div className="course-title">{course.title}</div>
              {curriculum && (
                <div className="course-curriculum">{curriculum.title}</div>
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
      ) : null}
    </Splide>
  );
};

export default SelectCourse;
