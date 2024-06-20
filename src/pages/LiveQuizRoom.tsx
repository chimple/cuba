import { IonButton, IonPage } from "@ionic/react";
import { useEffect, useState } from "react";
import { Util } from "../utility/util";
import { useHistory } from "react-router";
import StudentAvatar from "../components/common/StudentAvatar";
import { PAGES, TableTypes } from "../common/constants";
import "./LiveQuizRoom.css";
import { t } from "i18next";
import BarLoader from "react-spinners/BarLoader";
import { FaHeart } from "react-icons/fa";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";
import BackButton from "../components/common/BackButton";
import SkeltonLoading from "../components/SkeltonLoading";
import { ServiceConfig } from "../services/ServiceConfig";
const LiveQuizRoom: React.FC = () => {
  const [students, setStudents] = useState(
    new Map<String, TableTypes<"user">>()
  );
  const [prevPlayedStudents, setPrevPlayedStudents] = useState<
    TableTypes<"user">[]
  >([]);
  const [notPlayedStudents, setNotPlayedStudents] = useState<
    TableTypes<"user">[]
  >([]);
  const [currentAssignment, setCurrentAssignment] =
    useState<TableTypes<"assignment">>();
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const paramAssignmentId = urlSearchParams.get("assignmentId") ?? "";
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [lesson, setLesson] = useState<TableTypes<"lesson"> | undefined>();
  const [course, setCourse] = useState<TableTypes<"course"> | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  let lessonId;
  let courseId;
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [assignmentResult, setAssignmentResult] =
    useState<TableTypes<"result">[]>();

  const state = (history.location.state as any) ?? {};
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setIsLoading(true);
    const currentStudent = Util.getCurrentStudent();

    if (!currentStudent) return;
    let assignment;
    if (!!state?.assignment) {
      const tempAssignment: TableTypes<"assignment"> = JSON.parse(
        state.assignment
      );
      if (
        tempAssignment?.created_by &&
        tempAssignment?.class_id &&
        tempAssignment?.lesson_id &&
        tempAssignment?.school_id &&
        tempAssignment?.course_id
      ) {
        assignment = tempAssignment;
      }
    }
    if (!assignment) {
      assignment = await api.getAssignmentById(paramAssignmentId);
    }
    lessonId = assignment?.lesson_id;
    courseId = assignment?.course_id;
    const tempLesson = await api.getLesson(lessonId);
    if (!!tempLesson) {
      setLesson(tempLesson);
    }
    const tempCourse = await api.getCourse(courseId);
    if (!!tempCourse) {
      setCourse(tempCourse);
    }
    if (!assignment?.lesson_id) return;
    setCurrentAssignment(assignment);
    if (tempLesson?.cocos_lesson_id) {
      downloadQuiz(tempLesson?.cocos_lesson_id);
    }
    const linked = await api.isStudentLinked(currentStudent.id, true);
    if (!linked) return;

    const studentResult = await api.getStudentClassesAndSchools(
      currentStudent.id
    );
    if (
      !studentResult ||
      !studentResult.classes ||
      studentResult.classes.length < 1
    )
      return;
    const classId = studentResult.classes[0];
    if (!classId) return;
    const results =
      await api.getStudentResultsByAssignmentId(paramAssignmentId);
    const studentsData = results[0];
    const tempStudentMap = new Map<String, TableTypes<"user">>();
    studentsData.user_data.map((student) => {
      tempStudentMap.set(student.id, student);
    });
    setStudents(tempStudentMap);

    const allStudents = tempStudentMap ?? students;
    let tempPrevPlayedStudents: TableTypes<"user">[] = prevPlayedStudents;
    let tempNotPlayedStudents: TableTypes<"user">[] = [];
    // const tempLiveStudents: User[] = [];
    if (tempPrevPlayedStudents.length < 1) {
      let resultData: TableTypes<"result">[] | null = studentsData.result_data;
      let userData: TableTypes<"user">[] | null = studentsData.user_data;
      if (results) {
        setAssignmentResult(resultData);
        for (let userResult of resultData) {
          for (let user of userData) {
            if (user.id === userResult.student_id) {
              if (user) {
                tempPrevPlayedStudents.push(user);
              }
            }
          }
        }
      }
    }
    console.log(
      "🚀 ~ file: LiveQuizRoom.tsx:98 ~ hasPlayedBefore ~ tempPrevPlayedStudents:",
      tempPrevPlayedStudents
    );
    tempNotPlayedStudents = Array.from(allStudents.values()).filter(
      (student) => {
        const hasPlayedBefore = tempPrevPlayedStudents.some(
          (prevStudent) => prevStudent.id === student.id
        );
        return !hasPlayedBefore;
      }
    );
    setPrevPlayedStudents(tempPrevPlayedStudents);
    setNotPlayedStudents(tempNotPlayedStudents);
    setIsLoading(false);
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
    const res = await api.joinLiveQuiz(assignmentId, studentId);
    console.log("🚀 ~ file: LiveQuizRoom.tsx:108 ~ joinQuiz ~ res:", res);
    if (!res || !online) {
      setIsJoining(false);
      history.replace(PAGES.LIVE_QUIZ_JOIN);
      return;
    } else {
      history.replace(PAGES.LIVE_QUIZ_GAME + "?liveRoomId=" + res);
      setIsJoining(false);
      return;
    }
  };
  return (
    <IonPage className="live-quiz-room-page">
      <div className="livequiz-room-header">
        <div className="livequiz-back-button">
          <BackButton
            onClicked={() => {
              Util.setPathToBackButton(PAGES.HOME, history);
            }}
          />
        </div>
        <div className="main-header-text">
          <p id="header-text-1">{t("Live Challenge")}</p>
          <p id="header-text-2">
            {course?.name +
              " | " +
              // lesson?.chapterTitle +
              " | " +
              lesson?.name}
          </p>
        </div>
        <div></div>
      </div>

      <div className="outcome">
        <p id="outcome-text">{lesson?.outcome}</p>
      </div>

      <div className="students-container">
        <div className="played-students">
          <div className="status-text-container">
            <p className="status-text-1">{t("Already Played")}</p>
          </div>
          <div
            className="student-container-1"
            style={{
              justifyContent:
                prevPlayedStudents.length > 0
                  ? prevPlayedStudents.length > 3
                    ? "space-between"
                    : "space-evenly"
                  : "center",
            }}
          >
            {!!isLoading ? (
              <SkeltonLoading
                isLoading={isLoading}
                header={PAGES.LIVE_QUIZ_JOIN}
              />
            ) : prevPlayedStudents.length > 0 ? (
              prevPlayedStudents
                .sort((a, b) => {
                  const resultA = assignmentResult?.find(
                    (result) => result.student_id === a.id
                  );
                  const resultB = assignmentResult?.find(
                    (result) => result.student_id === b.id
                  );
                  const scoreA = resultA?.score || 0;
                  const scoreB = resultB?.score || 0;
                  return scoreB - scoreA;
                })

                .map((student, index) => (
                  <div key={student.id} className="student-avatar-container">
                    {index < 3 && (
                      <div
                        className={`top-performer-circle color-${index + 1}`}
                      >
                        {index + 1}
                      </div>
                    )}
                    <div className="student-avatar-container">
                      <StudentAvatar
                        student={student}
                        onClicked={() => {}}
                        width={70}
                        namePosition={"below"}
                      />
                      {assignmentResult?.some(
                        (result) => result.student_id === student.id
                      ) && (
                        <p className="student-score">
                          {Math.round(
                            assignmentResult.find(
                              (result) => result.student_id === student.id
                            )?.score || 0
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <p id="container-text">{t("No students have played yet.")}</p>
            )}
          </div>
        </div>
        <div className="not-played-students">
          <div className="status-text-container-2">
            <p className="status-text-2">{t("Not Played")}</p>
          </div>
          <div
            className="student-container-2"
            style={{
              justifyContent:
                notPlayedStudents.length > 0
                  ? notPlayedStudents.length > 3
                    ? "space-between"
                    : "space-evenly"
                  : "center",
            }}
          >
            {!!isLoading ? (
              <SkeltonLoading
                isLoading={isLoading}
                header={PAGES.LIVE_QUIZ_JOIN}
              />
            ) : (
              notPlayedStudents.map((student) => (
                <div key={student.id} className="student-avatar-container">
                  {student.id === Util.getCurrentStudent()?.id && (
                    <div className="green-circle">
                      <FaHeart color="white" />
                    </div>
                  )}
                  <StudentAvatar
                    key={student.id}
                    student={student}
                    onClicked={() => {}}
                    width={70}
                    namePosition={"below"}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="join-button-container">
        {!!isDownloaded ? (
          <IonButton
            size="default"
            color="green"
            className="join-button"
            shape="round"
            id="button-inner"
            disabled={!isDownloaded || isJoining}
            onClick={() => {
              if (!online) {
                presentToast({
                  message: t(`Device is offline. Cannot join live quiz`),
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
              }
              if (!!currentAssignment?.id) {
                joinQuiz(Util.getCurrentStudent()?.id!, currentAssignment.id);
              }
            }}
          >
            {isJoining ? t("Joining...") : t("Join Now")}
          </IonButton>
        ) : (
          <BarLoader
            color="#8fc93c"
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
