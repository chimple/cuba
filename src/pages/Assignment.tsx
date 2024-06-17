import { IonButton, IonPage } from "@ionic/react";
import JoinClass from "../components/assignment/JoinClass";
import "./Assignment.css";
import { useEffect, useState } from "react";
import {
  ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
  DOWNLOADED_LESSON_ID,
  DOWNLOAD_BUTTON_LOADING_STATUS,
  HOMEHEADERLIST,
  LIVE_QUIZ,
  PAGES,
  TYPE,
  TableTypes,
} from "../common/constants";
import { useHistory } from "react-router";
import LessonSlider from "../components/LessonSlider";
import { ServiceConfig } from "../services/ServiceConfig";
import { t } from "i18next";
import { Util } from "../utility/util";
import { Keyboard } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";
import SkeltonLoading from "../components/SkeltonLoading";
import { TfiDownload } from "react-icons/tfi";
import { useOnlineOfflineErrorMessageHandler } from "../common/onlineOfflineErrorMessageHandler";

const AssignmentPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isLinked, setIsLinked] = useState(true);
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const [lessons, setLessons] = useState<TableTypes<"lesson">[]>([]);
  const [lessonChapterMap, setLessonChapterMap] = useState<{
    [lessonId: string]: TableTypes<"chapter">;
  }>({});
  const [schoolName, setSchoolName] = useState<string>();
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<"result">;
  }>();
  const [downloadButtonLoading, setDownloadButtonLoading] = useState(false);
  const [isInputFocus, setIsInputFocus] = useState(false);
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [showDownloadHomeworkButton, setShowDownloadHomeworkButton] =
    useState(true);
  const [assignments, setAssignments] = useState<TableTypes<"assignment">[]>(
    []
  );

  useEffect(() => {
    const initialLoadingState = JSON.parse(
      localStorage.getItem(DOWNLOAD_BUTTON_LOADING_STATUS) || "false"
    );
    setDownloadButtonLoading(initialLoadingState);
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
      downloadedLessonIds.includes(lesson.cocos_lesson_id)
    );

    setShowDownloadHomeworkButton(!allLessonIdPresent);
    const initialLoadingState = JSON.parse(
      localStorage.getItem(DOWNLOAD_BUTTON_LOADING_STATUS) || "false"
    );
    setDownloadButtonLoading(initialLoadingState);

    window.removeEventListener(
      ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
      checkAllHomeworkDownloaded
    );
  };

  async function downloadAllHomeWork(lessons) {
    setDownloadButtonLoading(true);
    localStorage.setItem(DOWNLOAD_BUTTON_LOADING_STATUS, JSON.stringify(true));
    const allLessonIds = lessons.map((lesson) => lesson.cocos_lesson_id);
    try {
      const storedLessonIds = Util.getStoredLessonIds();
      const filteredLessonIds: string[] = allLessonIds.filter(
        (id) => !storedLessonIds.includes(id)
      );
      const uniqueFilteredLessonIds = [...new Set(filteredLessonIds)];
      await Util.downloadZipBundle(uniqueFilteredLessonIds);

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

    const student = Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }
    const studentResult = await api.getStudentResultInMap(student.id);
    if (!!studentResult) {
      setLessonResultMap(studentResult);
    }

    const linked = await api.isStudentLinked(student.id, fromCache);
    console.log("🚀 ~ init ~ linked:", linked);
    if (!linked) {
      setIsLinked(false);
      setLoading(false);
      return;
    }
    const linkedData = await api.getStudentClassesAndSchools(student.id);
    if (!!linkedData && linkedData.classes.length > 0) {
      // const classId = linkedData.classes[0];
      // const classDoc = await api.getClassById(classId.id);
      const classDoc = linkedData.classes[0];

      const allAssignments: TableTypes<"assignment">[] = [];
      await Promise.all(
        linkedData.classes.map(async (_class) => {
          const assignments = await api.getPendingAssignments(
            _class.id,
            student.id
          );
          const filteredAssignments = assignments.filter((assignment) => {
            //filtering the assignments without live quiz
            return !(TYPE in assignment) || assignment.type !== LIVE_QUIZ;
          });
          allAssignments.push(...filteredAssignments);
        })
      );
      const _lessons: TableTypes<"lesson">[] = [];
      const _lessonChapterMap: { [lessonId: string]: TableTypes<"chapter"> } =
        {};
      await Promise.all(
        allAssignments.map(async (_assignment) => {
          const res = await api.getLesson(_assignment.lesson_id);
          if (!!_assignment.chapter_id) {
            const chapter = await api.getChapterById(_assignment.chapter_id);
            if (!!res && !!chapter) {
              _lessonChapterMap[res.id] = chapter;
            }
          }
          if (!!res) {
            _lessons.push(res);
          }
        })
      );

      setLessonChapterMap(_lessonChapterMap);
      setLessons(_lessons);
      setAssignments(allAssignments);
      setCurrentClass(classDoc);

      if (classDoc && classDoc.id && classDoc.school_id) {
        const schoolId = classDoc.school_id;
        const res = linkedData.schools.find((val) => val.id === schoolId);
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
            {isLinked &&
            showDownloadHomeworkButton &&
            lessons.length > 0 &&
            Capacitor.isNativePlatform() ? (
              <IonButton
                size="small"
                color="white"
                shape="round"
                disabled={downloadButtonLoading}
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
                  {downloadButtonLoading
                    ? t("Downloading...")
                    : t("Download all")}
                </div>
                {!downloadButtonLoading ? (
                  <div className="dowload-homework-icon-container">
                    <TfiDownload className="dowload-homework-icon" />
                  </div>
                ) : null}
              </IonButton>
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
                      assignments={assignments}
                      downloadButtonLoading={downloadButtonLoading}
                      showDate={true}
                      onDownloadOrDelete={checkAllHomeworkDownloaded}
                      lessonChapterMap={lessonChapterMap}
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
