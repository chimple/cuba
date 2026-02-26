import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useLocation } from "react-router";
import { IonIcon } from "@ionic/react";
import { checkmarkCircle, ellipseOutline } from "ionicons/icons";
import { t } from "i18next";
import "./QRAssignments.css";
import { ServiceConfig } from "../../../../services/ServiceConfig";
import { Util } from "../../../../utility/util";
import { PAGES } from "../../../../common/constants";
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
};

const QRAssignments: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{
    chapterId: string;
    courseId: string;
  }>();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<LessonUI[]>([]);
  const [showAssigned, setShowAssigned] = useState(true);
  const [toggleCourseName, setToggleCourseName] = useState("");
  const chapterId = location.state?.chapterId;

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
      const lessonList = await api.getLessonsForChapter(chapterId);
      if (!lessonList?.length) return;
      // 2️⃣ Fetch assigned lesson IDs
      const assignedLessonIdsArr =
        await api.getAssignedLessonIdsByCourseAndChapter(
          currentClass.id,
          location.state.courseId,
          chapterId,
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
        <div className="qrAssignments-assignments-page">
          <Header
            isBackButton={true}
            onBackButtonClick={() => history.goBack()}
            showSideMenu={false}
            customText="QR Assignments"
            showSearchIcon={false}
          />
          {/* Toggle row */}
          <div
            className="qrAssignments-toggle-row"
            onClick={() => setShowAssigned(!showAssigned)}
          >
            <img
              src={
                showAssigned
                  ? "/assets/hideassigned.png"
                  : "/assets/showassigned.png"
              }
              className="qrAssignments-toggle-icon"
              alt=""
            />
            <span className="qrAssignments-toggle-text">
              {showAssigned ? t("Hide Assigned") : t("Show Assigned")}
            </span>
          </div>
          {/* Subject + Count row */}
          <div className="qrAssignments-subject-count-row">
            <span className="qrAssignments-subject-name">
              {toggleCourseName}
            </span>
            <span className="qrAssignments-count-inline">
              {selectedCount}/{lessons.length}
            </span>
          </div>
          {/* Lesson List */}
          <div className="qrAssignments-lesson-list">
            {lessons
              .filter((l) => showAssigned || !l.isAssigned)
              .map((lesson) => (
                <div key={lesson.id} className="qrAssignments-lesson-row">
                  <div className="qrAssignments-lesson-image-wrapper">
                    <SelectIconImage
                      defaultSrc="assets/icons/DefaultIcon.png"
                      webSrc={lesson.image}
                      imageWidth="80px"
                      imageHeight="80px"
                    />
                    {lesson.isAssigned && (
                      <img
                        src="assets/hideassigned.png"
                        className="qrAssignments-assigned-badge"
                        alt="assigned"
                      />
                    )}
                  </div>
                  <span className="qrAssignments-lesson-name">
                    {t(lesson.name)}
                  </span>
                  <IonIcon
                    icon={lesson.isSelected ? checkmarkCircle : ellipseOutline}
                    className={`qrAssignments-icon ${lesson.isSelected ? "selected" : ""}`}
                    onClick={() => toggleLesson(lesson.id)}
                  />
                </div>
              ))}
          </div>
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
                selectedAssignments,
                manualAssignments: {
                  [location.state.courseId]: {
                    lessons: lessons.filter((l) =>
                      selectedLessonIds.includes(l.id),
                    ),
                  },
                },
                recommendedAssignments: {},
              });
            }}
          />
        </div>
      )}
    </>
  );
};
export default QRAssignments;
