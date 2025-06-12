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
  assignmentCount: any
}

const AssignmentPage: React.FC<AssignmentPageProps> = ({ onNewAssignment, assignmentCount }) => {
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

  const loadPendingAssignments = useCallback(
    async (
      classId: string,
      studentId: string,
      getPendingAssignments: (classId: string, studentId: string) => Promise<TableTypes<"assignment">[]>
    ) => {
      try {
        const pending = await getPendingAssignments(classId, studentId);
        setAssignments(pending);
        assignmentCount(pending.length);
      } catch (error) {
        console.error("Failed to load pending assignments:", error);
      }
    },
    []
  );

  useEffect(() => {
    const initialLoadingState = JSON.parse(
      localStorage.getItem(DOWNLOAD_BUTTON_LOADING_STATUS) || "false"
    );
    setDownloadButtonLoading(initialLoadingState);
    const body = document.querySelector("body");
    body?.style.setProperty(
      "background-image",
      "url(/pathwayAssets/pathwayBackground.svg)"
    );
    init(false);
  }, []);

  useEffect(() => {
    checkAllHomeworkDownloaded();
  }, [lessons]);

  // --- When assignments update, fetch associated lessons ---
  useEffect(() => {
    if (assignments.length > 0) {
      const fetchLessons = async () => {
        const lessonPromises = assignments.map(async (assignment) => {
          return await api.getLesson(assignment.lesson_id);
        });
        const lessonList = await Promise.all(lessonPromises);
        const filteredLessons = lessonList.filter(
          (lesson): lesson is TableTypes<"lesson"> => lesson !== undefined
        );
        setLessons((prevLessons) => {
          const prevIds = new Set(prevLessons.map((l) => l.id));
          const newLessons = filteredLessons.filter((l) => !prevIds.has(l.id));
          if (
            newLessons.length > 0 ||
            prevLessons.length !== filteredLessons.length
          ) {
            return [...newLessons, ...prevLessons];
          }
          return prevLessons;
        });
      };
      fetchLessons();
    }
  }, [assignments]);

  const handleNewAssignmentS = useCallback(
  async (newAssignment: TableTypes<"assignment">) => {
    const now = new Date();
    if (newAssignment.ends_at && new Date(newAssignment.ends_at) <= now) {
      return; 
    }
    setAssignments((prev) => {
      if (prev.some((a) => a.id === newAssignment.id)) {
        return prev;
      }
      onNewAssignment?.(newAssignment);
      return [...prev, newAssignment];
    });

    if (newAssignment.chapter_id) {
      const chapter = await api.getChapterById(newAssignment.chapter_id);
      if (chapter) {
        setLessonChapterMap((prev) => ({
          ...prev,
          [newAssignment.lesson_id]: chapter,
        }));
      }
    }

    setAssignmentLessonCourseMap((prev) => {
      if (newAssignment.course_id) {
        return {
          ...prev,
          [newAssignment.lesson_id]: { course_id: newAssignment.course_id },
        };
      }
      return prev;
    });

    const lesson = await api.getLesson(newAssignment.lesson_id);
    if (lesson) {
      setLessons((prev) => {
        if (prev.some((l) => l.id === lesson.id)) {
          return prev;
        }
        return [...prev, lesson];
      });
    }
  },
  [api, onNewAssignment]
);

useEffect(() => {
  const student = Util.getCurrentStudent();
  if (!currentClass || !student) return;

  api.assignmentListner(
    currentClass.id,
    (newA) => {
      if (!newA || newA.type === LIVE_QUIZ) return;
      handleNewAssignmentS(newA);
    }
  );

  api.assignmentUserListner(
    student.id,
    async (au) => {
      if (!au) return;
      const a = await api.getAssignmentById(au.assignment_id);
      if (a) handleNewAssignmentS(a);
    }
  );

  return () => {
    api.removeAssignmentChannel();
  };
}, [currentClass, handleNewAssignmentS]);

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

  window.addEventListener(
    ALL_LESSON_DOWNLOAD_SUCCESS_EVENT,
    checkAllHomeworkDownloaded
  );

  const init = useCallback(
  async (fromCache: boolean = true) => {
    setLoading(true);

    const student = Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }

    const linkedData = await api.getStudentClassesAndSchools(student.id);
    if (!linkedData?.classes.length) {
      setIsLinked(false);
      setLoading(false);
      return;
    }
    const classDoc = linkedData.classes[0];
    setCurrentClass(classDoc);
    setSchoolName(
      linkedData.schools.find((s) => s.id === classDoc.school_id)?.name || ""
    );

    const classId = classDoc.id;
    const studentId = student.id;

    await loadPendingAssignments(
      classId,
      studentId,
      api.getPendingAssignments.bind(api)
    );

    api
      // pass [TABLES.Assignment] as refreshTables so "assignment" gets re-pulled
      .syncDB(Object.values(TABLES), [TABLES.Assignment])
      .then(async (ok) => {
        if (ok) {
          await loadPendingAssignments(
            classId,
            studentId,
            api.getPendingAssignments.bind(api)
          );
        }
      })
      .catch((err) =>
        console.error("🚀 init → syncDB failed:", err)
      );

    setLoading(false);
    setIsLinked(true);
  },
  [api, history, loadPendingAssignments]
);

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
