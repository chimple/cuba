import { IonButton, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import { FirebaseApi } from "../services/api/FirebaseApi";
import { Util } from "../utility/util";
import User from "../models/user";
import { useHistory } from "react-router";
import Assignment from "../models/assignment";
import StudentAvatar from "../components/common/StudentAvatar";
import { PAGES } from "../common/constants";
import "./LiveQuizRoom.css";
import { t } from "i18next";
import BarLoader from "react-spinners/BarLoader";

const LiveQuizRoom: React.FC = () => {
  const [students, setStudents] = useState(new Map<String, User>());
  const [prevPlayedStudents, setPrevPlayedStudents] = useState<User[]>([]);
  const [notPlayedStudents, setNotPlayedStudents] = useState<User[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment>();
  const api = FirebaseApi.getInstance();
  const history = useHistory();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramAssignmentId = urlSearchParams.get("assignmentId") ?? "";
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [lessonName, setLessonName] = useState<string | undefined>();
  const [courseName, setCourseName] = useState<string | undefined>();
  let lessonRef;
  let courseRef;

  const state = (history.location.state as any) ?? {};
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const currentStudent = Util.getCurrentStudent();

    if (!currentStudent) return;
    let assignment: Assignment | undefined;
    if (!!state?.assignment) {
      const tempAssignment = JSON.parse(state.assignment);
      if (
        tempAssignment?.assigner &&
        tempAssignment?.class &&
        tempAssignment?.lesson &&
        tempAssignment?.school &&
        tempAssignment?.course
      ) {
        tempAssignment.assigner = Util.getRef(tempAssignment?.assigner);
        tempAssignment.class = Util.getRef(tempAssignment?.class);
        tempAssignment.lesson = Util.getRef(tempAssignment?.lesson);
        tempAssignment.school = Util.getRef(tempAssignment?.school);
        tempAssignment.course = Util.getRef(tempAssignment?.course);
        assignment = tempAssignment;
      }
    }
    if (!assignment) {
      assignment = await api.getAssignmentById(paramAssignmentId);
    }
    lessonRef = assignment?.lesson;
    courseRef = assignment?.course;
    const lesson = await api.getLesson(lessonRef.id);
    setLessonName(lesson?.title);

    const course = await api.getCourse(courseRef?.id);
    setCourseName(course?.title);

    if (!assignment?.lesson?.id) return;
    setCurrentAssignment(assignment);
    downloadQuiz(assignment.lesson.id);
    const linked = await api.isStudentLinked(currentStudent.docId, true);
    if (!linked) return;

    const studentResult = await api.getStudentResult(currentStudent.docId);
    if (
      !studentResult ||
      !studentResult.classes ||
      studentResult.classes.length < 1
    )
      return;
    const classId = studentResult.classes[0];
    if (!classId) return;
    const studentsData = await api.getStudentsForClass(classId);
    const tempStudentMap = new Map<String, User>();
    for (let student of studentsData) {
      tempStudentMap.set(student.docId, student);
    }
    setStudents(tempStudentMap);

    const allStudents = tempStudentMap ?? students;
    let tempPrevPlayedStudents: User[] = prevPlayedStudents;
    let tempNotPlayedStudents: User[] = [];
    // const tempLiveStudents: User[] = [];
    if (tempPrevPlayedStudents.length < 1) {
      if (
        !!assignment &&
        !!assignment.completedStudents &&
        assignment.completedStudents.length > 0
      ) {
        tempPrevPlayedStudents = assignment.completedStudents.map(
          (value) => allStudents.get(value)!
        );
      }
    }
    console.log(
      "🚀 ~ file: LiveQuizRoom.tsx:98 ~ hasPlayedBefore ~ tempPrevPlayedStudents:",
      tempPrevPlayedStudents
    );
    tempNotPlayedStudents = Array.from(allStudents.values()).filter(
      (student) => {
        const hasPlayedBefore = tempPrevPlayedStudents.some(
          (prevStudent) => prevStudent.docId === student.docId
        );
        return !hasPlayedBefore;
      }
    );
    setPrevPlayedStudents(tempPrevPlayedStudents);
    setNotPlayedStudents(tempNotPlayedStudents);
  };

  const downloadQuiz = async (lessonId: string) => {
    const dow = await Util.downloadZipBundle([lessonId]);
    console.log("🚀 ~ file: LiveQuizRoom.tsx:103 ~ downloadQuiz ~ dow:", dow);
    setIsDownloaded(dow);
  };
  const joinQuiz = async (studentId: string, assignmentId: string) => {
    console.log(
      "🚀 ~ file: LiveQuizRoom.tsx:111 ~ joinQuiz ~ assignmentId:",
      assignmentId
    );
    console.log(
      "🚀 ~ file: LiveQuizRoom.tsx:111 ~ joinQuiz ~ studentId:",
      studentId
    );
    setIsJoining(true);
    const res = await api.joinLiveQuiz(studentId, assignmentId);
    console.log("🚀 ~ file: LiveQuizRoom.tsx:108 ~ joinQuiz ~ res:", res);
    history.replace(PAGES.LIVE_QUIZ_GAME + "?liveRoomId=" + res);
    setIsJoining(false);
    return;
  };

  return (
    <IonPage className="live-quiz-room-page">
      <div className="live-quiz-room-header">
        <p id="header-text">{(courseName && courseName + " ⇒") ?? ""}</p>
        <p id="header-text">{(lessonName && lessonName) ?? ""}</p>
      </div>

      <div className="played-students">
        <p id="container-text">{t("Played")}</p>
        <div id="student-container-1">
          {prevPlayedStudents.length > 0 ? (
            prevPlayedStudents.map((student) => (
              <div key={student.docId} className="student-avatar-container">
                <StudentAvatar
                  student={student}
                  onClicked={() => {}}
                  width={70}
                  namePosition={"above"}
                />
                {!!currentAssignment?.results && (
                  <p className="student-score">
                    {currentAssignment.results[student.docId]?.score}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p>{t("No students have played yet.")}</p>
          )}
        </div>
      </div>

      <div className="not-played-students">
        <p id="container-text">{t("Not Played")}</p>
        <div id="student-container-2">
          {notPlayedStudents.map((student) => (
            <StudentAvatar
              key={student.docId}
              student={student}
              onClicked={() => {}}
              width={70}
              namePosition={"above"}
            />
          ))}
        </div>
      </div>

      <div className="button-container">
        {!!isDownloaded ? (
          <IonButton
            size="default"
            color="green"
            shape="round"
            id="button-inner"
            disabled={!isDownloaded || isJoining}
            onClick={() => {
              if (!!currentAssignment?.docId) {
                joinQuiz(
                  Util.getCurrentStudent()?.docId!,
                  currentAssignment.docId
                );
              }
            }}
          >
            {isJoining ? t("Joining...") : t("Join Now")}
          </IonButton>
        ) : (
          <BarLoader
            color="rgb(95, 226, 54)"
            height={26}
            width={143}
            loading={!isDownloaded}
          />
        )}
      </div>
    </IonPage>
  );
};

export default LiveQuizRoom;
