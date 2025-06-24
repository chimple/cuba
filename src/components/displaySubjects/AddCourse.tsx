import { FC, useState, useEffect } from "react";
import Course from "../../models/course";
import "./SelectCourse.css";
import { t } from "i18next";
import SelectIconImage from "./SelectIconImage";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import {
  DEFUALT_SUBJECT_CARD_COLOUR,
  TableTypes,
} from "../../common/constants";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";
import Loading from "../Loading";
import "../LessonSlider.css";
import "../../pages/DisplayChapters.css";
import { ServiceConfig } from "../../services/ServiceConfig";

const AddCourse: FC<{
  courses: TableTypes<"course">[];
  onSelectedCoursesChange;
}> = ({ courses, onSelectedCoursesChange }) => {
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [coursesSelected, setCoursesSelected] =
    useState<TableTypes<"course">[]>();
  const [curriculums, setCurriculums] = useState<TableTypes<"curriculum">[]>();
  const [gradesMap, setGradesMap] = useState(
    new Map<String, TableTypes<"grade">>()
  );
  const api = ServiceConfig.getI().apiHandler;
  const [allCourses, setAllCourses] = useState([
    ...courses.map((course) => {
      return { course, selected: false };
    }),
  ]);
  allCourses.sort((a, b) => {
    return (a.course.sort_index ?? 0) - (b.course.sort_index ?? 0);
  });
  let selectedCourses: TableTypes<"course">[] = [];

  useEffect(() => {
    getCurriculum();
    getAllGradeDocs();
  }, []);
  const getCurriculum = async () => {
    const curriculumDocs = await api.getAllCurriculums();
    if (curriculumDocs.length > 0) {
      setCurriculums(curriculumDocs);
    }
  };
  const getAllGradeDocs = async () => {
    const grades = await api.getAllGrades();
    if (grades && grades.length > 0) {
      const temp = new Map<string, TableTypes<"grade">>();
      grades.forEach((grade) => {
        temp.set(grade.id, grade);
      });
      setGradesMap(temp);
    }
  };

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
          (courseObject) => courseObject.id === course.id
        );
        if (cCourse == null || cCourse == undefined) {
          selectedCourses.push(course);
          setCoursesSelected(selectedCourses);
        } else if (cCourse?.id === course?.id) {
          selectedCourses.splice(selectedCourses?.indexOf(cCourse!), 1);
          setCoursesSelected(selectedCourses);
        }
        onSelectedCoursesChange(coursesSelected);
      }
    }
  };

  const renderSubjectCard = (curr, currt) => {
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
          {allCourses.map((course) => {
            if (course.course.curriculum_id === curr) {
              const grade = gradesMap.get(course.course.grade_id!);
              const gradeTitle = grade ? grade.name : "";
              return (
                <SplideSlide className="slide">
                  <div
                    onClick={async () => {
                      const newCourses = allCourses.map((c) => {
                        if (c.course.id === course.course.id)
                          c.selected = !c.selected;
                        return c;
                      });

                      setAllCourses(newCourses);
                      handleClick(course.course!);
                    }}
                    className="subject-button"
                    key={course.course.id}
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
                      <p>{gradeTitle}</p>
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
                        localSrc={`courses/chapter_icons/${course.course.code}.png`}
                        defaultSrc={"assets/icons/DefaultIcon.png"}
                        webSrc={
                          course.course.image || "assets/icons/DefaultIcon.png"
                        }
                        imageWidth={"80%"}
                        imageHeight={"auto"}
                      />
                    </div>
                    {t(course?.course.name)}
                    {/* {course.title === "English" ? course.title : course.title} */}
                    {currt ? (
                      <div id="ignore">
                        <div id="ignore">
                          <p id="ignore">{currt} Curriculum</p>
                        </div>
                      </div>
                    ) : null}
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
    <>
      {curriculums && curriculums.length > 0 && (
        <div>
          {curriculums.map((curriculum) => {
            const coursesForCurriculum = allCourses.filter(
              (course) => course.course.curriculum_id === curriculum.id
            );

            if (coursesForCurriculum.length > 0) {
              return (
                <div key={curriculum.id}>
                  <div className="subject-header">
                    {t(curriculum.name) + " " + t("Curriculum")}
                  </div>
                  {renderSubjectCard(curriculum.id, curriculum.name)}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </>
  );
};
export default AddCourse;
