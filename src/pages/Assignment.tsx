import { IonButton, IonPage } from "@ionic/react";
import JoinClass from "../components/assignment/JoinClass";
import "./Assignment.css";
import { useCallback, useEffect, useState } from "react";
import {
  ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
  DOWNLOADED_LESSON_ID,
  DOWNLOAD_BUTTON_LOADING_STATUS,
  HOMEHEADERLIST,
  LIVE_QUIZ,
  PAGES,
  TABLES,
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

// Extend props to accept a callback for new assignments.
interface AssignmentPageProps {
  onNewAssignment?: (assignment: TableTypes<"assignment">) => void;
}

const AssignmentPage: React.FC<AssignmentPageProps> = ({ onNewAssignment }) => {
  const [loading, setLoading] = useState(true);
  const [isLinked, setIsLinked] = useState(true);
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const [lessons, setLessons] = useState<TableTypes<"lesson">[]>([]);
  const [lessonChapterMap, setLessonChapterMap] = useState<{
    [lessonId: string]: TableTypes<"chapter">;
  }>({});
  const [schoolName, setSchoolName] = useState<string>("");
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<"result">;
  }>({});
  const [downloadButtonLoading, setDownloadButtonLoading] = useState(false);
  const [isInputFocus, setIsInputFocus] = useState(false);
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [showDownloadHomeworkButton, setShowDownloadHomeworkButton] =
    useState(true);
  const [assignments, setAssignments] = useState<TableTypes<"assignment">[]>(
    []
  );
  const [assignmentLessonCourseMap, setAssignmentLessonCourseMap] = useState<{
    [lessonId: string]: { course_id: string };
  }>({});

  const init = async (fromCache = true) => {
    setLoading(true);
    await api.syncDB();

    const student = Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }

    const studentResult = await api.getStudentResultInMap(student.id);
    if (studentResult) setLessonResultMap(studentResult);

    const linked = await api.isStudentLinked(student.id, fromCache);
    if (!linked) {
      setIsLinked(false);
      setLoading(false);
      return;
    }

    const linkedData = await api.getStudentClassesAndSchools(student.id);
    if (!linkedData?.classes.length) {
      setIsLinked(false);
      setLoading(false);
      return;
    }

    const cls = linkedData.classes[0];
    setCurrentClass(cls);
    setSchoolName(
      linkedData.schools.find((s) => s.id === cls.school_id)?.name || ""
    );

    const all = await api.getPendingAssignments(cls.id, student.id);
    const pending = all.filter((a) => a.type !== LIVE_QUIZ);
    setAssignments(pending);

    setIsLinked(true);
    setLoading(false);
  };

  // check downloaded lessons
  const checkAllHomeworkDownloaded = async () => {
    if (lessons.length === 0) {
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
    setDownloadButtonLoading(
      JSON.parse(
        localStorage.getItem(DOWNLOAD_BUTTON_LOADING_STATUS) || "false"
      )
    );
    window.removeEventListener(
      ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
      checkAllHomeworkDownloaded
    );
  };

  // initial effect
  useEffect(() => {
    document
      .querySelector("body")
      ?.style.setProperty(
        "background-image",
        "url(/pathwayAssets/pathwayBackground.svg)"
      );
    setDownloadButtonLoading(
      JSON.parse(localStorage.getItem(DOWNLOAD_BUTTON_LOADING_STATUS) || "false")
    );
    init();
  }, [api, history]);

  // fetch lessons when assignments arrive
  useEffect(() => {
    if (!assignments.length) return;
    (async () => {
      const lessonList = await Promise.all(
        assignments.map((a) => api.getLesson(a.lesson_id))
      );
      const filtered = lessonList.filter(
        (l): l is TableTypes<"lesson"> => !!l
      );
      setLessons((prev) => {
        const prevIds = new Set(prev.map((l) => l.id));
        const newL = filtered.filter((l) => !prevIds.has(l.id));
        return newL.length || prev.length !== filtered.length
          ? [...newL, ...prev]
          : prev;
      });
    })();
  }, [assignments, api]);

  // real-time listeners
  useEffect(() => {
    const student = Util.getCurrentStudent();
    if (!currentClass || !student) return;

    const handleNew = async (newA?: TableTypes<"assignment">) => {
      if (!newA || newA.type === LIVE_QUIZ) return;

      setAssignments((prev) =>
        prev.some((a) => a.id === newA.id) ? prev : [...prev, newA]
      );
      onNewAssignment?.(newA);

      if (newA.chapter_id) {
        const chap = await api.getChapterById(newA.chapter_id);
        if (chap)
          setLessonChapterMap((m) => ({ ...m, [newA.lesson_id]: chap }));
      }
      if (newA.course_id) {
        setAssignmentLessonCourseMap((m) => ({
          ...m,
          [newA.lesson_id]: { course_id: newA.course_id! },
        }));
      }

      const lesson = await api.getLesson(newA.lesson_id);
      if (lesson)
        setLessons((prev) =>
          prev.some((l) => l.id === lesson.id) ? prev : [...prev, lesson]
        );
    };

    api.assignmentListner(currentClass.id, handleNew);
    api.assignmentUserListner(student.id, async (au) => {
      if (!au) return;
      const a = await api.getAssignmentById(au.assignment_id);
      if (a) handleNew(a);
    });
    return () => api.removeAssignmentChannel();
  }, [api, currentClass, onNewAssignment]);

  // download button & check
  useEffect(() => {
    checkAllHomeworkDownloaded();
    window.addEventListener(
      ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
      checkAllHomeworkDownloaded
    );
    return () => {
      window.removeEventListener(
        ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
        checkAllHomeworkDownloaded
      );
    };
  }, [lessons]);

  async function downloadAllHomeWork(lessons: TableTypes<"lesson">[]) {
    setDownloadButtonLoading(true);
    localStorage.setItem(DOWNLOAD_BUTTON_LOADING_STATUS, JSON.stringify(true));
    const allLessonIds = lessons.map((lesson) => lesson.cocos_lesson_id);
    try {
      const storedLessonIds = Util.getStoredLessonIds();
      const filteredLessonIds: string[] = allLessonIds.filter(
        (id): id is string => id !== null && !storedLessonIds.includes(id)
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

  // keyboard listeners
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const showSub = Keyboard.addListener(
      "keyboardWillShow",
      () => setIsInputFocus(true)
    );
    const hideSub = Keyboard.addListener(
      "keyboardWillHide",
      () => setIsInputFocus(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener("keyboardWillShow", () => {
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
                  {assignments.length > 0 ? (
                    <LessonSlider
                      key={assignments.length}
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
                      lessonCourseMap={assignmentLessonCourseMap}
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