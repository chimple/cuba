import { FC, useState, useEffect, useRef } from "react";
import Course from "../../models/course";
import "./SelectCourse.css";
import { t } from "i18next";
import SelectIconImage from "./SelectIconImage";
import { IoAddCircleSharp } from "react-icons/io5";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { DEFUALT_SUBJECT_CARD_COLOUR } from "../../common/constants";
import { useHistory } from "react-router";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";
import DialogBoxButtons from "../parent/DialogBoxButtons​";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import Loading from "../Loading";
import "../LessonSlider.css";
import "../../pages/DisplayChapters.css";
import Curriculum from "../../models/curriculum";
import Grade from "../../models/grade";

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
  const [curriculums, setCurriculums] = useState<Curriculum[]>();
  const [gradesMap, setGradesMap] = useState(new Map<String, Grade>());
  const api = ServiceConfig.getI().apiHandler;
  const [allCourses, setAllCourses] = useState([
    ...courses.map((course) => {
      return { course, selected: false };
    }),
  ]);
  allCourses.sort((a, b) => {
    return a.course.sortIndex - b.course.sortIndex;
  });
  let selectedCourses: Course[] = [];

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
      const temp = new Map<string, Grade>();
      grades.forEach((grade) => {
        temp.set(grade.docId, grade);
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
          {allCourses.map((course) => {
            if (course.course.curriculum.id === curr) {
              const grade = gradesMap.get(course.course.grade.id);
              const gradeTitle = grade ? grade.title : "";
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
                        {gradeTitle}
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
                        imageHeight={"100%"}
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
    <>
      {curriculums && curriculums.length > 0 && (
        <div>
          {curriculums.map((curriculum) => {
            const coursesForCurriculum = allCourses.filter(
              (course) => course.course.curriculum.id === curriculum.docId
            );

            if (coursesForCurriculum.length > 0) {
              return (
                <div key={curriculum.docId}>
                  <div className="subject-header">
                    {t(curriculum.title + " " + "Curriculum")}
                  </div>
                  {renderSubjectCard(curriculum.docId)}
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
