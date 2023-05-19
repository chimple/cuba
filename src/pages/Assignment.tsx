import { IonPage } from "@ionic/react";
import JoinClass from "../components/assignment/JoinClass";
import "./Assignment.css";
import { useEffect, useState } from "react";
import BackButton from "../components/common/BackButton";
import { PAGES } from "../common/constants";
import { useHistory } from "react-router";
import Loading from "../components/Loading";
import Class from "../models/class";
import Assignment from "../models/assignment";
import Lesson from "../models/lesson";
import LessonSlider from "../components/LessonSlider";
import { ServiceConfig } from "../services/ServiceConfig";

const AssignmentPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isLinked, setIsLinked] = useState(true);
  const [currentClass, setCurrentClass] = useState<Class>();
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    init();
  }, []);

  const init = async (fromCache: boolean = true) => {
    setLoading(true);
    const student = api.currentStudent;
    if (!student) {
      history.replace(PAGES.DISPLAY_STUDENT);
      return;
    }
    const linked = await api.isStudentLinked(student.docId, fromCache);
    if (!linked) {
      setIsLinked(false);
      setLoading(false);
      return;
    }
    const studentResult = await api.getStudentResult(student.docId);
    if (
      !!studentResult &&
      !!studentResult.classes &&
      studentResult.classes.length > 0
    ) {
      const classId = studentResult.classes[0];
      const classDoc = await api.getClassById(classId);
      const allAssignments: Assignment[] = [];
      await Promise.all(
        studentResult.classes.map(async (_class) => {
          const res = await api.getPendingAssignments(_class, student.docId);
          allAssignments.push(...res);
        })
      );
      const _lessons: Lesson[] = [];
      await Promise.all(
        allAssignments.map(async (_assignment) => {
          const res = await api.getLesson(_assignment.lesson.id);
          if (!!res) {
            res.assignment = _assignment;
            _lessons.push(res);
          }
        })
      );
      setLessons(_lessons);
      // setAssignments(allAssignments);
      setCurrentClass(classDoc);
      setLoading(false);
      setIsLinked(true);
    } else {
      setIsLinked(false);
      setLoading(false);
      return;
    }
  };

  return (
    <IonPage>
      <div className="assignment-main">
        <div className="assignment-header">
          <BackButton
            onClicked={() => {
              history.replace(PAGES.HOME);
            }}
            iconSize="8vh"
          />
          <div>{currentClass?.name ? currentClass?.name : ""}</div>
          <div className="right-button"></div>
        </div>
        {!loading && (
          <div
            className={
              !isLinked || lessons.length < 1
                ? "lesson-body"
                : "assignment-body"
            }
          >
            {!isLinked ? (
              <JoinClass
                onClassJoin={() => {
                  init(false);
                }}
              />
            ) : (
              <div>
                {lessons.length > 0 ? (
                  <LessonSlider
                    lessonData={lessons}
                    isHome={true}
                    course={undefined}
                    lessonsScoreMap={{}}
                    startIndex={0}
                    showSubjectName={true}
                  />
                ) : (
                  <div>You have to pending assignments</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Loading isLoading={loading} />
    </IonPage>
  );
};
export default AssignmentPage;
