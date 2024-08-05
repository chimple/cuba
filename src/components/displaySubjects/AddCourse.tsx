import { FC, useState, useEffect, useRef } from "react";
import Course from "../../models/course";
import "./SelectCourse.css";
import { t } from "i18next";
import SelectIconImage from "./SelectIconImage";
import { IoAddCircleSharp } from "react-icons/io5";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import {
  ACTION,
  CHAPTER_CARD_COLOURS,
  EVENTS,
  PAGES,
  DEFUALT_SUBJECT_CARD_COLOUR,
  aboveGrade3,
  belowGrade1,
  grade1,
  grade2,
  grade3,
  NCERT_CURRICULUM,
  KARNATAKA_STATE_BOARD_CURRICULUM,
  OTHER_CURRICULUM,
} from "../../common/constants";
import { useHistory } from "react-router";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";
import DialogBoxButtons from "../parent/DialogBoxButtons​";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import Loading from "../Loading";
import "../LessonSlider.css";
import "../../pages/DisplayChapters.css";

const AddCourse: FC<{
  courses: Course[];
  onSelectedCoursesChange;
}> = ({ courses, onSelectedCoursesChange }) => {
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [coursesSelected, setCoursesSelected] = useState<Course[]>();
  const currentStudent = Util.getCurrentStudent();
  const [allCourses, setAllCourses] = useState([
    ...courses.map((course) => {
      return { course, selected: false };
    }),
  ]);
  allCourses.sort((a, b) => {
    return a.course.sortIndex - b.course.sortIndex;
  });
  let selectedCourses: Course[] = [];

  useEffect(() => {}, []);

  const handleClick = (course) => {
    if (!online) {
      presentToast({
        message: t(`Device is offline.`),
        color: "danger",
        duration: 3000,
        position: "bottom",
        buttons: [
          {
            text: "Dismiss",
            role: "cancel",
          },
        ],
      });
      return;
    } else {
      if (coursesSelected == null || coursesSelected == undefined) {
        selectedCourses.push(course);
        setCoursesSelected(selectedCourses);
        onSelectedCoursesChange(selectedCourses);
      } else {
        selectedCourses = coursesSelected!;
        const cCourse = selectedCourses?.find(
          (courseObject) => courseObject.docId === course.docId
        );
        if (cCourse == null || cCourse == undefined) {
          selectedCourses.push(course);
          setCoursesSelected(selectedCourses);
        } else if (cCourse?.docId === course?.docId) {
          selectedCourses.splice(selectedCourses?.indexOf(cCourse!), 1);
          setCoursesSelected(selectedCourses);
        }
        onSelectedCoursesChange(coursesSelected);
      }
    }
  };

  const renderSubjectCard = (curr) => {
    return (
      <div className="Subject-slider-content">
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
          {allCourses.map((course, index) => {
            if (course.course.curriculum.id === curr) {
              let isGrade1: string | boolean = false;
              let isGrade2: string | boolean = false;
              let gradeDocId = course.course.grade.id;

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
              // const ccCourse = setSelectedCourses.find(o=> o.docId === course.docId);
              return (
                <SplideSlide className="slide">
                  <div
                    onClick={async () => {
                      const newCourses = allCourses.map((c, i) => {
                        if (c.course.docId === course.course.docId)
                          c.selected = !c.selected;
                        return c;
                      });

                      setAllCourses(newCourses);
                      handleClick(course.course!);
                    }}
                    className="subject-button"
                    key={course.course.docId}
                  >
                    {course.selected ? (
                      <div id="subject-card-select-icon">
                        <div>
                          <BsFillCheckCircleFill
                            color={"white"}
                            className="gender-check-box"
                            size="4vh"
                          />
                        </div>
                      </div>
                    ) : null}
                    <div id="subject-card-subject-name">
                      <p>
                        {isGrade1 ? "Grade 1" : "Grade 2"}
                        {/* {subject.title==="English"?subject.title:t(subject.title)} */}
                      </p>
                    </div>
                    <div
                      className="course-icon"
                      style={{
                        backgroundColor:
                          course.course.color ?? DEFUALT_SUBJECT_CARD_COLOUR,
                        flexDirection: "column",
                      }}
                    >
                      <SelectIconImage
                        localSrc={`courses/chapter_icons/${course.course.courseCode}.png`}
                        defaultSrc={"assets/icons/DefaultIcon.png"}
                        webSrc={
                          course.course.thumbnail ||
                          "assets/icons/DefaultIcon.png"
                        }
                        imageWidth={"100%"}
                        imageHeight={"80%"}
                      />
                    </div>
                    {t(course?.course.title)}
                    {/* {course.title === "English" ? course.title : course.title} */}
                  </div>
                </SplideSlide>
              );
            }
          })}
          <Loading isLoading={isLoading} />
        </Splide>
      </div>
    );
  };

  return (
    <div>
      <div className="subject-header">{t("NCERT curriculum")}</div>
      {renderSubjectCard(NCERT_CURRICULUM)}
      <div className="subject-header">{t("Karnataka board curriculum")}</div>
      {renderSubjectCard(KARNATAKA_STATE_BOARD_CURRICULUM)}
      <div className="subject-header">{t("Chimple curriculum")}</div>
      {renderSubjectCard(OTHER_CURRICULUM)}
    </div>
  );
};
export default AddCourse;
