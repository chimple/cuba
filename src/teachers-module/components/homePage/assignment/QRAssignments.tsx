import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useLocation } from "react-router";
import { IonIcon } from "@ionic/react";
import { checkmarkCircle, ellipseOutline } from "ionicons/icons";
import { t } from "i18next";
import "./QRAssignments.css";
import { ServiceConfig } from "../../../../services/ServiceConfig";
import { Util } from "../../../../utility/util";
import { AssignmentSource, PAGES } from "../../../../common/constants";
import Header from "../../homePage/Header";
import SelectIconImage from "../../../../components/displaySubjects/SelectIconImage";
import Loading from "../../../../components/Loading";
import { TeacherAssignmentPageType } from "./TeacherAssignment";
import AssigmentCount from "../../library/AssignmentCount";

type LessonUI = {
  id: string;
  name: string;
  image?: string;
  order: number;
  isAssigned: boolean;
  isSelected: boolean;
  chapterName: string;
};

const QRAssignments: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{
    chapterId: string;
    courseId: string;
    fromPage?: string;
  }>();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<LessonUI[]>([]);
  const [showAssigned, setShowAssigned] = useState(true);
  const [toggleCourseName, setToggleCourseName] = useState("");
  const chapterId = location.state?.chapterId;
  const ID_PREFIX = "qrAssignments";

  useEffect(() => {
    if (!chapterId) {
      history.replace(PAGES.HOME_PAGE);
      return;
    }
    init();
  }, []);

  const init = async () => {
    try {
      setLoading(true);
      const currentUser = await auth.getCurrentUser();
      const currentClass = await Util.getCurrentClass();
      if (!currentUser || !currentClass) return;
      // 1️⃣ Fetch lessons
      const [lessonList, chapter] = await Promise.all([
        api.getLessonsForChapter(chapterId),
        api.getChapterById(chapterId),
      ]);
      const chapterName = chapter?.name ?? "";
      if (!lessonList?.length) return;
      // 2️⃣ Fetch assigned lesson IDs
      const lessonIds = lessonList.map((l: any) => l.lesson_id ?? l.id);
      const assignedLessonIdsArr =
        await api.getAssignmentInfoForLessonsPerClass(
          currentClass.id,
          lessonIds,
        );

      const assignedLessonIds = new Set<string>(assignedLessonIdsArr);
      // 3️⃣ Auto-select next 5 unassigned
      const unassignedLessons = lessonList.filter((l: any) => {
        const lessonId = l.lesson_id ?? l.id;
        return !assignedLessonIds.has(lessonId);
      });
      const autoSelectIds = unassignedLessons
        .slice(0, 5)
        .map((l: any) => l.lesson_id ?? l.id);
      // 4️⃣ Build UI state
      const uiLessons: LessonUI[] = lessonList.map(
        (lesson: any, index: number) => {
          const lessonId = lesson.lesson_id ?? lesson.id;
          const isAssigned = assignedLessonIds.has(lessonId);
          return {
            id: lessonId,
            name: lesson.name,
            image: lesson.image,
            order: index,
            isAssigned,
            isSelected: !isAssigned && autoSelectIds.includes(lessonId),
            chapterName: chapterName,
          };
        },
      );
      setLessons(uiLessons);
      // 5️⃣ Subject name
      const course = await api.getCourse(location.state.courseId);
      setToggleCourseName(course?.name ?? "");
    } catch (e) {
      console.error("QR Assignments init failed", e);
    } finally {
      setLoading(false);
    }
  };
  const toggleLesson = (lessonId: string) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId ? { ...l, isSelected: !l.isSelected } : l,
      ),
    );
  };
  const selectedCount = useMemo(
    () => lessons.filter((l) => l.isSelected).length,
    [lessons],
  );

  return (
    <>
      {loading ? (
        <Loading isLoading />
      ) : (
        <div
          id={`${ID_PREFIX}-page`}
          className="qrAssignments-assignments-page"
        >
          <Header
            isBackButton={true}
            onBackButtonClick={() => {
              if (location.state?.fromPage === PAGES.HOME_PAGE) {
                history.replace(PAGES.HOME_PAGE, { tabValue: 2 });
                return;
              }
              history.goBack();
            }}
            showSideMenu={false}
            customText="QR Assignments"
            showSearchIcon={false}
          />

          {/* Toggle row */}
          <div
            id={`${ID_PREFIX}-toggle-row`}
            className="qrAssignments-toggle-row"
            onClick={() => setShowAssigned(!showAssigned)}
          >
            <img
              id={`${ID_PREFIX}-toggle-icon`}
              src={
                showAssigned
                  ? "/assets/hideassigned.png"
                  : "/assets/showassigned.png"
              }
              className="qrAssignments-toggle-icon"
              alt=""
            />
            <span
              id={`${ID_PREFIX}-toggle-text`}
              className="qrAssignments-toggle-text"
            >
              {showAssigned ? t("Hide Assigned") : t("Show Assigned")}
            </span>
          </div>

          {/* Subject + Count row */}
          <div
            id={`${ID_PREFIX}-subject-count-row`}
            className="qrAssignments-subject-count-row"
          >
            <span
              id={`${ID_PREFIX}-subject-name`}
              className="qrAssignments-subject-name"
            >
              {toggleCourseName}
            </span>

            <span
              id={`${ID_PREFIX}-count`}
              className="qrAssignments-count-inline"
            >
              {selectedCount}/{lessons.length}
            </span>
          </div>

          {/* Lesson List */}
          <div
            id={`${ID_PREFIX}-lesson-list`}
            className="qrAssignments-lesson-list"
          >
            {lessons
              .filter((l) => showAssigned || !l.isAssigned)
              .map((lesson) => (
                <div
                  key={lesson.id}
                  id={`${ID_PREFIX}-lesson-row-${lesson.id}`}
                  className="qrAssignments-lesson-row"
                >
                  <div
                    id={`${ID_PREFIX}-lesson-image-wrapper-${lesson.id}`}
                    className="qrAssignments-lesson-image-wrapper"
                  >
                    <SelectIconImage
                      defaultSrc="assets/icons/DefaultIcon.png"
                      webSrc={lesson.image}
                      imageWidth="80px"
                      imageHeight="80px"
                    />

                    {lesson.isAssigned && (
                      <img
                        id={`${ID_PREFIX}-assigned-badge-${lesson.id}`}
                        src="assets/hideassigned.png"
                        className="qrAssignments-assigned-badge"
                        alt="assigned"
                      />
                    )}
                  </div>

                  <div
                    id={`${ID_PREFIX}-lesson-copy-${lesson.id}`}
                    className="qrAssignments-lesson-copy"
                  >
                    <div
                      id={`${ID_PREFIX}-lesson-title-${lesson.id}`}
                      className="qrAssignments-lesson-title"
                    >
                      {t(lesson.name)}
                    </div>

                    <div
                      id={`${ID_PREFIX}-lesson-subtitle-${lesson.id}`}
                      className="qrAssignments-lesson-subtitle"
                    >
                      {t(lesson.chapterName ?? "")}
                    </div>
                  </div>
                  {/* 
                  {lesson.isSelected ? (
                    <span
                      id={`${ID_PREFIX}-lesson-toggle-${lesson.id}`}
                      className="qrAssignments-toggle-circle is-selected"
                      onClick={() => toggleLesson(lesson.id)}
                    >
                      <img
                        src="assets/tick.png"
                        alt=""
                        className="qrAssignments-toggle-check"
                      />
                    </span>
                  ) : (
                    <span
                      id={`${ID_PREFIX}-lesson-toggle-${lesson.id}`}
                      className="qrAssignments-toggle-circle is-unselected"
                      onClick={() => toggleLesson(lesson.id)}
                    />
                  )} */}
                  <button
                    type="button"
                    id={`${ID_PREFIX}-lesson-toggle-${lesson.id}`}
                    className={`qrAssignments-toggle-circle ${
                      lesson.isSelected ? "is-selected" : "is-unselected"
                    }`}
                    onClick={() => toggleLesson(lesson.id)}
                    aria-pressed={lesson.isSelected}
                    aria-label={
                      t(
                        lesson.isSelected ? "Deselect lesson" : "Select lesson",
                      ) +
                      " " +
                      t(lesson.name)
                    }
                  >
                    {lesson.isSelected && (
                      <img
                        src="assets/tick.png"
                        alt=""
                        className="qrAssignments-toggle-check"
                      />
                    )}
                  </button>
                </div>
              ))}
          </div>

          <div id={`${ID_PREFIX}-assignment-count`}>
            <AssigmentCount
              assignments={selectedCount}
              onClick={() => {
                if (selectedCount === 0) return;

                const selectedLessonIds = lessons
                  .filter((l) => l.isSelected)
                  .map((l) => l.id);

                const selectedAssignments = {
                  [TeacherAssignmentPageType.MANUAL]: {
                    [location.state.courseId]: {
                      count: selectedLessonIds,
                    },
                  },
                };

                history.push(PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE, {
                  fromPage: PAGES.QR_ASSIGNMENTS,
                  selectedAssignments,
                  manualAssignments: {
                    [location.state.courseId]: {
                      lessons: lessons
                        .filter((l) => selectedLessonIds.includes(l.id))
                        .map((l) => ({
                          ...l,
                          source: AssignmentSource.QR_CODE,
                        })),
                    },
                  },
                  recommendedAssignments: {},
                  qrAssignmentNavigationState: {
                    chapterId: location.state.chapterId,
                    courseId: location.state.courseId,
                    fromPage: location.state.fromPage,
                  },
                });
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
export default QRAssignments;
