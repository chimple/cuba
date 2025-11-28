import { IonButton, IonPage } from "@ionic/react";
import JoinClass from "../components/assignment/JoinClass";
import "./Assignment.css";
import { useCallback, useEffect, useState, useRef } from "react";
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
import LearningPathway from "../components/LearningPathway";
import HomeworkPathway from "../components/assignment/HomeworkPathway";
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import HomeworkCompleteModal from "../components/assignment/HomeworkCompleteModal";

// Extend props to accept a callback for new assignments.
interface AssignmentPageProps {
  assignmentCount: any;
  onPlayMoreHomework?: () => void;
}

const AssignmentPage: React.FC<AssignmentPageProps> = ({
  assignmentCount,
  onPlayMoreHomework, // ✅ grab it from props
}) => {
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
  const [showHomeworkCompleteModal, setShowHomeworkCompleteModal] =
    useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const isHomeworkPathwayOn = useFeatureIsOn("homework-learning-pathway");

  const updateLessonChapterAndCourseMaps = useCallback(
    async (assignments: TableTypes<"assignment">[]) => {
      // Update lessonChapterMap
      const chapterIds = Array.from(
        new Set(
          assignments
            .map((assignment) => assignment.chapter_id)
            .filter((id): id is string => !!id) // Filter out any null or undefined ids
        )
      );

      const chapters = await api.getChaptersByIds(chapterIds);

      const chapterIdMap = chapters.reduce((acc, chapter) => {
        acc[chapter.id] = chapter;
        return acc;
      }, {} as { [id: string]: TableTypes<"chapter"> });

      // Build the final lessonChapterMap by iterating through assignments
      const chapterMap: { [lessonId: string]: TableTypes<"chapter"> } = {};
      assignments.forEach((assignment) => {
        if (assignment.lesson_id && assignment.chapter_id) {
          const chapter = chapterIdMap[assignment.chapter_id];
          if (chapter) {
            chapterMap[assignment.lesson_id] = chapter;
          }
        }
      });
      setLessonChapterMap(chapterMap);

      // Update assignmentLessonCourseMap
      const lessonCourseMap: { [lessonId: string]: { course_id: string } } = {};
      assignments.forEach((assignment) => {
        if (assignment.lesson_id && assignment.course_id) {
          lessonCourseMap[assignment.lesson_id] = {
            course_id: assignment.course_id,
          };
        }
      });
      setAssignmentLessonCourseMap(lessonCourseMap);
    },
    [api]
  );

  const init = useCallback(
    async (fromCache: boolean = true, fullRefresh: boolean = true) => {
      if (fullRefresh) setLoading(true);

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
      // Fetch assignments
      let allAssignments: TableTypes<"assignment">[] = [];
      try {
        const all = await api.getPendingAssignments(classId, studentId);
        const allAssignments = all.filter((a) => a.type !== LIVE_QUIZ);
        // Update only if length or content has changed
        const assignmentIds = assignments.map((a) => a.id);
        const newAssignments = allAssignments.filter(
          (a) => !assignmentIds.includes(a.id)
        );
        const updatedAssignments = fullRefresh
          ? allAssignments
          : [...assignments, ...newAssignments];

        setAssignments(updatedAssignments);
        assignmentCount(updatedAssignments.length);


        await updateLessonChapterAndCourseMaps(updatedAssignments);

        const lessonPromises = newAssignments.map(async (assignment) => {
          return await api.getLesson(assignment.lesson_id);
        });
        const lessonList = await Promise.all(lessonPromises);
        const filteredLessons = lessonList.filter(
          (lesson): lesson is TableTypes<"lesson"> => lesson !== undefined
        );
        const mergedLessons = fullRefresh
          ? filteredLessons
          : [...lessons, ...filteredLessons];
        setLessons(mergedLessons);
      } catch (error) {
        console.error("Failed to load pending assignments:", error);
        if (fullRefresh) {
          setAssignments([]);
          assignmentCount(0);
          setLessonChapterMap({});
          setAssignmentLessonCourseMap({});
        }
      }
      setLoading(false);
      setIsLinked(true);
    },
    [api, history, assignmentCount, updateLessonChapterAndCourseMaps]
  );

  // --- Debounced handler for assignment updates ---
  const handleAssignmentUpdate = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      if (isMounted.current) {
        init();
      }
    }, 1000);
  }, [init]);

  useEffect(() => {
  // Only decide banner visibility AFTER loading is finished
  if (!loading) {
    setShowHomeworkCompleteModal(assignments.length === 0);
  }
}, [loading, assignments.length]);


  // --- Listener setup ---
  useEffect(() => {
    isMounted.current = true;
    const student = Util.getCurrentStudent();
    if (!currentClass || !student) return;

    api.assignmentListner(currentClass.id, async (payload) => {
      if (payload && payload.type !== LIVE_QUIZ) {
        await updateLessonChapterAndCourseMaps([...assignments, payload]);
        handleAssignmentUpdate();
      }
    });

    api.assignmentUserListner(student.id, async (assignmentUser) => {
      if (assignmentUser) {
        const assignment = await api.getAssignmentById(
          assignmentUser.assignment_id
        );
        if (isMounted.current && assignment && assignment.type !== LIVE_QUIZ) {
          await updateLessonChapterAndCourseMaps([...assignments, assignment]);
          handleAssignmentUpdate();
        }
      }
    });

    return () => {
      isMounted.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      api.removeAssignmentChannel();
    };
  }, [
    currentClass,
    api,
    handleAssignmentUpdate,
    assignments,
    updateLessonChapterAndCourseMaps,
  ]);

  useEffect(() => {
    Util.loadBackgroundImage();
    init(false, true);

    api
      .syncDB(Object.values(TABLES))
      .then(() => {
        init(false, false);
      })
      .catch((error) => {
        console.error("Error syncing assignments:", error);
      });
  }, []);

  useEffect(() => {
    checkAllHomeworkDownloaded();
  }, [lessons]);

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
          {isHomeworkPathwayOn && (
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
                        buttons: [{ text: "Dismiss", role: "cancel" }],
                      });
                      setLoading(false);
                      return;
                    }
                    downloadAllHomeWork(lessons);
                  }}
                >
                  <div className="download-homework-label">
                    {downloadButtonLoading
                      ? t("Downloading...")
                      : t("Download all")}
                  </div>

                  {!downloadButtonLoading && (
                    <div className="dowload-homework-icon-container">
                      <TfiDownload className="dowload-homework-icon" />
                    </div>
                  )}
                </IonButton>
              ) : (
                <div className="right-button"></div>
              )}
            </div>
          )}

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
                    // 3. Conditionally render based on the feature flag
                    // If the feature is ON, show the original slider
                    isHomeworkPathwayOn ? (
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
                      // If the feature is OFF, show the new pathway
                      <HomeworkPathway
                        onPlayMoreHomework={onPlayMoreHomework}
                      />
                    )
                  ) : (
                    <div className="pending-assignment">
                      {showHomeworkCompleteModal && (
                        <HomeworkCompleteModal
                          text={t(
                            "Yay!! You have completed all the Homework!!"
                          )}
                          borderImageSrc="/pathwayAssets/homeworkCelebration.svg"
                          onClose={() => setShowHomeworkCompleteModal(false)}
                          onPlayMore={() => {
                            setShowHomeworkCompleteModal(false);
                            if (onPlayMoreHomework) {
                              onPlayMoreHomework();
                            }
                          }}
                        />
                      )}
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
