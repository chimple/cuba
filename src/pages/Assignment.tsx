import { IonPage } from "@ionic/react";
import JoinClass from "../components/assignment/JoinClass";
import "./Assignment.css";
import { useEffect, useState } from "react";
import BackButton from "../components/common/BackButton";
import {
  ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
  DOWNLOADED_LESSON_ID,
  DOWNLOAD_BUTTON_LOADING_STATUS,
  HOMEHEADERLIST,
  LIVE_QUIZ,
  PAGES,
  TYPE,
} from "../common/constants";
import { useHistory } from "react-router";
import Loading from "../components/Loading";
import Class from "../models/class";
import Assignment from "../models/assignment";
import Lesson from "../models/lesson";
import LessonSlider from "../components/LessonSlider";
import { ServiceConfig } from "../services/ServiceConfig";
import { t } from "i18next";
import StudentNameBox from "../components/editStudent/StudentNameBox";
import { Util } from "../utility/util";
import { Keyboard } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";
import { StudentLessonResult } from "../common/courseConstants";
import SkeltonLoading from "../components/SkeltonLoading";
import { TfiDownload } from "react-icons/tfi";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";

const AssignmentPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isLinked, setIsLinked] = useState(true);
  const [currentClass, setCurrentClass] = useState<Class>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [schoolName, setSchoolName] = useState<string>();
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: StudentLessonResult;
  }>();
  const [downloadButtonLoading, setDownloadButtonLoading] = useState(false);
  const [isInputFocus, setIsInputFocus] = useState(false);
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [showDownloadHomeworkButton, setShowDownloadHomeworkButton] =
    useState(true);

  useEffect(() => {
    const initialLoadingState =
      localStorage.getItem(DOWNLOAD_BUTTON_LOADING_STATUS) === "true"
        ? true
        : false;
    setDownloadButtonLoading(initialLoadingState);
    checkAllHomeworkDownloaded();
    init();
  }, []);

  useEffect(() => {
    checkAllHomeworkDownloaded();
  }, [lessons]);

  const checkAllHomeworkDownloaded = async () => {
    if (!lessons || lessons.length === 0) {
      setShowDownloadHomeworkButton(false);
      return;
    }

    const downloadedLessonIds = JSON.parse(
      localStorage.getItem(DOWNLOADED_LESSON_ID) || "[]"
    );

    const allLessonIdPresent = lessons.every((lesson) =>
      downloadedLessonIds.includes(lesson.id)
    );

    setShowDownloadHomeworkButton(!allLessonIdPresent);
  };

  async function downloadAllHomeWork(lessons) {
    setDownloadButtonLoading(true);
    localStorage.setItem(DOWNLOAD_BUTTON_LOADING_STATUS, JSON.stringify(true));
    const allLessonIds = lessons.map((lesson) => lesson.id);
    try {
      const storedLessonIds = Util.getStoredLessonIds();
      const filteredLessonIds = allLessonIds.filter(
        (id) => !storedLessonIds.includes(id)
      );

      await Util.downloadZipBundle(filteredLessonIds);

      localStorage.setItem(
        DOWNLOAD_BUTTON_LOADING_STATUS,
        JSON.stringify(false)
      );
      setDownloadButtonLoading(false);
      checkAllHomeworkDownloaded();
    } catch (error) {
      console.error("Error downloading homework:", error);
      localStorage.setItem(
        DOWNLOAD_BUTTON_LOADING_STATUS,
        JSON.stringify(false)
      );
      setDownloadButtonLoading(false);
    }
  }
  window.addEventListener(
    ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
    checkAllHomeworkDownloaded
  );

  const init = async (fromCache: boolean = true) => {
    setLoading(true);

    const student = await Util.getCurrentStudent();
    if (!student) {
      // history.replace(PAGES.DISPLAY_STUDENT);
      history.replace(PAGES.SELECT_MODE);
      return;
    }

    const studentResult = await api.getStudentResult(student.docId);
    if (!!studentResult) {
      console.log("tempResultLessonMap = res;", studentResult.lessons);
      setLessonResultMap(studentResult.lessons);
    }

    const linked = await api.isStudentLinked(student.docId, fromCache);
    if (!linked) {
      setIsLinked(false);
      setLoading(false);
      return;
    }

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
          const assignments = await api.getPendingAssignments(
            _class,
            student.docId
          );
          const filteredAssignments = assignments.filter((assignment) => {
            //filtering the assignments without live quiz
            return !(TYPE in assignment) || assignment.type !== LIVE_QUIZ;
          });
          allAssignments.push(...filteredAssignments);
        })
      );
      const _lessons: Lesson[] = [];
      await Promise.all(
        allAssignments.map(async (_assignment) => {
          const res = await api.getLesson(
            _assignment.lesson.id,
            undefined,
            true,
            _assignment
          );
          if (!!res) {
            res.assignment = _assignment;
            _lessons.push(res);
          }
        })
      );

      setLessons(_lessons);

      setCurrentClass(classDoc);

      if (classDoc && classDoc.school && classDoc.school.id) {
        const schoolId = classDoc.school.id;
        const res = await api.getSchoolById(schoolId);

        setSchoolName(res?.name);
      }
      setLoading(false);
      setIsLinked(true);
    } else {
      setIsLinked(false);
      setLoading(false);
      return;
    }
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener("keyboardWillShow", (info) => {
        setIsInputFocus(true);
      });
      Keyboard.addListener("keyboardWillHide", () => {
        setIsInputFocus(false);
      });
    }
  }, []);
  return !loading ? (
    <div>
      <div className={`assignment-main${isLinked ? "" : "-join-class"}`}>
        {/* <div id="assignment-back-button" style={{display:"none"}}>
          <BackButton
            onClicked={() => {
              history.replace(PAGES.HOME);
            }}
          />
        </div> */}

        <div
          className={
            "header " + isInputFocus && !isLinked ? "scroll-header" : ""
          }
        >
          <div className="assignment-header">
            <div className="right-button"></div>
            <div className="dowload-homework-button-container">
              <div className="school-class-header">
                <div className="classname-header">{schoolName}</div>
                <div className="classname-header">
                  {currentClass?.name ? currentClass?.name : ""}
                </div>
              </div>
            </div>
            {isLinked && showDownloadHomeworkButton && lessons.length > 0 ? (
              <div
                className="dowload-homework-button"
                onClick={() => {
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

                    setLoading(false);
                    return;
                  } else downloadAllHomeWork(lessons);
                }}
              >
                <div className="download-homework-label">
                  {t("Download all")}
                </div>
                <div className="dowload-homework-icon-container">
                  <TfiDownload className="dowload-homework-icon" />
                </div>
              </div>
            ) : (
              <div className="right-button"></div>
            )}
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
                      lessonsScoreMap={lessonResultMap || {}}
                      startIndex={0}
                      showSubjectName={true}
                      showChapterName={true}
                      downloadButtonLoading={downloadButtonLoading}
                      showDate={true}
                      onDownloadOrDelete={checkAllHomeworkDownloaded}
                    />
                  ) : (
                    <div className="pending-assignment">
                      {t("You don't have any pending assignments.")}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="assignment-loading">
      <SkeltonLoading isLoading={loading} header={HOMEHEADERLIST.ASSIGNMENT} />
    </div>
  );
};
export default AssignmentPage;
