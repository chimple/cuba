import { FC, MouseEvent, useEffect, useState } from "react";
import { useHistory } from "react-router";
import "./TeacherAssignment.css";
import { ServiceConfig } from "../../../../services/ServiceConfig";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SelectIconImage from "../../../../components/displaySubjects/SelectIconImage";
import { PAGES, TableTypes } from "../../../../common/constants";
import { Util } from "../../../../utility/util";
import { t } from "i18next";
import { Toast } from "@capacitor/toast";
import AssignmentNextButton from "./AssignmentNextButton";

export enum TeacherAssignmentPageType {
  MANUAL = "manual",
  RECOMMENDED = "recommended",
}

const TeacherAssignment: FC<{ onLibraryClick: () => void }> = ({
  onLibraryClick,
}) => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;

  const [manualAssignments, setManualAssignments] = useState<any>({});
  const [recommendedAssignments, setRecommendedAssignments] = useState<any>({});

  const [manualCollapsed, setManualCollapsed] = useState(false);
  const [recommendedCollapsed, setRecommendedCollapsed] = useState(true);
  const [selectedLessonsCount, setSelectedLessonsCount] = useState({
    [TeacherAssignmentPageType.MANUAL]: { count: 0 },
    [TeacherAssignmentPageType.RECOMMENDED]: { count: 0 },
  });
  const auth = ServiceConfig.getI().authHandler;

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    let tempLessons: any = {};
    const current_class = await Util.getCurrentClass();
    const currUser = await auth.getCurrentUser();
    if (!current_class || !current_class.id) {
      history.replace(PAGES.DISPLAY_SCHOOLS);
      return;
    }
    const courseList = await api.getCoursesForClassStudent(current_class.id);

    const previous_sync_lesson = currUser?.id
      ? await api.getUserAssignmentCart(currUser?.id)
      : null;
    if (previous_sync_lesson?.lessons) {
      const all_sync_lesson: Map<string, string> = new Map(
        Object.entries(JSON.parse(previous_sync_lesson?.lessons))
      );
      const sync_lesson_data = all_sync_lesson.get(current_class?.id ?? "");
      let sync_lesson: Map<string, string[]> = new Map(
        Object.entries(sync_lesson_data ? JSON.parse(sync_lesson_data) : {})
      );

      for (const [chapter, lesson] of sync_lesson.entries()) {
        for (const lessonId of lesson) {
          const l: {
            lesson: any[];
            course: TableTypes<"course">[];
          } = await api.getLessonFromChapter(chapter, lessonId);

          const courseId = l.course[0].id;

          if (!tempLessons[courseId]) {
            tempLessons[courseId] = {
              name: l.course[0].name,
              lessons: [],
              isCollapsed: false,
              sort_index: l.course[0].sort_index,
            };
          }
          l.lesson[0].selected = true;
          tempLessons[courseId].lessons.push(l.lesson[0]);
        }
        updateSelectedLesson(TeacherAssignmentPageType.MANUAL, tempLessons);
      }
      if (tempLessons && Object.keys(tempLessons).length === 0) {
        setRecommendedCollapsed(false);
      }
      setManualAssignments(tempLessons);
    }
    const lastAssignmentsCourseWise: TableTypes<"assignment">[] | undefined =
      await api.getLastAssignmentsForRecommendations(current_class.id);
    getRecommendedAssignments(courseList, lastAssignmentsCourseWise, tempLessons);
  };

  const getRecommendedAssignments = async (
    courseList: TableTypes<"course">[],
    lastAssignmentsCourseWise: TableTypes<"assignment">[] | undefined,
    tempLessons: any
  ) => {
    let recommendedAssignments: any = {};
    for (const course of courseList) {
      if (!recommendedAssignments[course.id]) {
        recommendedAssignments[course.id] = {
          name: course.name,
          lessons: [],
          sort_index: course.sort_index, // Added sort_index here
        };
      }
      const lastAssignment = lastAssignmentsCourseWise?.find(
        (assignment) => assignment.course_id === course.id
      );

      const courseChapters = await api.getChaptersForCourse(course.id);
      if (!courseChapters || courseChapters.length === 0) {
        console.warn(`No chapters found for course ID: ${course.id}`);
        continue;
      }
      const chapterId = lastAssignment
        ? lastAssignment.chapter_id
        : courseChapters[0]?.id ?? "";
      if (chapterId) {
        const lessonList = await api.getLessonsForChapter(chapterId);
        const lessonIndex = lessonList?.findIndex(
          (lesson) => lesson.id === lastAssignment?.lesson_id
        );
        if (
          lessonList.length > 0 &&
          lessonList.length >= lessonIndex + 1 &&
          lessonList[lessonIndex + 1]
        ) {
          recommendedAssignments[course.id].lessons.push(
            lessonList[lessonIndex + 1]
          );
        } else {
          const allChapters = await api.getChaptersForCourse(course.id);
          const i = allChapters.findIndex((chapter) => chapter.id === chapterId);
          const nextChapter = allChapters[i + 1];

          console.log("Getting first lesson for next chapter");
          const lessonList = await api.getLessonsForChapter(nextChapter.id);
          recommendedAssignments[course.id].lessons.push(lessonList[0]);
        }
      }
    }
    const updatedRecommendedAssignments = { ...recommendedAssignments };
    if (Object.keys(tempLessons).length > 0) {
      Object.keys(updatedRecommendedAssignments).forEach((subjectId) => {
        updatedRecommendedAssignments[subjectId].lessons =
          updatedRecommendedAssignments[subjectId].lessons.map((assignment) => ({
            ...assignment,
            selected: false,
          }));
      });
      setRecommendedAssignments(updatedRecommendedAssignments);
      updateSelectedLesson(
        TeacherAssignmentPageType.RECOMMENDED,
        updatedRecommendedAssignments
      );
    } else {
      const updatedRecommendedAssignments = { ...recommendedAssignments };
      Object.keys(updatedRecommendedAssignments).forEach((subjectId) => {
        updatedRecommendedAssignments[subjectId].lessons =
          updatedRecommendedAssignments[subjectId].lessons.map((assignment) => ({
            ...assignment,
            selected: true,
          }));
      });
      setRecommendedAssignments(updatedRecommendedAssignments);
      console.log("Updated Recommended Assignments:", updatedRecommendedAssignments);
      updateSelectedLesson(
        TeacherAssignmentPageType.RECOMMENDED,
        updatedRecommendedAssignments
      );
    }
  };

  const toggleAssignmentSelection = (
    type: TeacherAssignmentPageType,
    category: any,
    setCategory: any,
    subject: string,
    index: number
  ) => {
    const updatedAssignments = { ...category };
    updatedAssignments[subject].lessons[index].selected =
      !updatedAssignments[subject].lessons[index].selected;

    updateSelectedLesson(type, updatedAssignments);
    setCategory(updatedAssignments);
  };

  const updateSelectedLesson = (type: TeacherAssignmentPageType, updatedAssignments: any) => {
    let tempSelectedCount = { ...selectedLessonsCount };
    tempSelectedCount[type].count = 0;
    Object.keys(updatedAssignments).forEach((subjectId) => {
      let lessonCount = 0;

      updatedAssignments[subjectId].lessons.forEach((assignment: any) => {
        if (assignment.selected) {
          lessonCount++;
          if (!tempSelectedCount[type][subjectId]) {
            tempSelectedCount[type][subjectId] = { count: [] };
          }
          if (!tempSelectedCount[type][subjectId].count.includes(assignment.id)) {
            tempSelectedCount[type][subjectId].count.push(assignment.id);
          }
        } else {
          if (!tempSelectedCount[type][subjectId]) {
            tempSelectedCount[type][subjectId] = { count: [] };
          }
          if (tempSelectedCount[type][subjectId].count.includes(assignment.id)) {
            const i = tempSelectedCount[type][subjectId].count.findIndex(
              (id: any) => id === assignment.id
            );
            if (i > -1) {
              tempSelectedCount[type][subjectId].count.splice(i, 1);
            }
          }
        }
      });

      tempSelectedCount[type].count =
        tempSelectedCount[type].count || 0;
      tempSelectedCount[type].count += lessonCount;
    });

    setSelectedLessonsCount(tempSelectedCount);
  };

  const toggleCollapse = (setCollapsed: any, collapsed: boolean) => {
    setCollapsed(!collapsed);
  };

  const toggleSubjectCollapse = (type: TeacherAssignmentPageType, subject: string) => {
    const newCollapsed =
      type === TeacherAssignmentPageType.MANUAL
        ? { ...manualAssignments }
        : { ...recommendedAssignments };

    newCollapsed[subject].isCollapsed = !newCollapsed[subject].isCollapsed;

    if (type === TeacherAssignmentPageType.MANUAL) {
      setManualAssignments(newCollapsed);
    } else {
      setRecommendedAssignments(newCollapsed);
    }
  };

  const selectAllAssignments = (
    type: TeacherAssignmentPageType,
    category: any,
    setCategory: any
  ) => {
    const allSelected = Object.keys(category).every((subjectId) =>
      category[subjectId].lessons.every((assignment: any) => assignment.selected)
    );
    const updatedAssignments = { ...category };
    Object.keys(updatedAssignments).forEach((subjectId) => {
      updatedAssignments[subjectId].lessons = updatedAssignments[subjectId].lessons.map(
        (assignment: any) => ({
          ...assignment,
          selected: !allSelected,
        })
      );
    });
    updateSelectedLesson(type, updatedAssignments);
    setCategory(updatedAssignments);
  };

  const selectAllAssignmentsInSubject = (
    type: TeacherAssignmentPageType,
    category: any,
    setCategory: any,
    subjectId: string
  ) => {
    const allSelected = category[subjectId].lessons.every(
      (assignment: any) => assignment.selected
    );

    const updatedAssignments = { ...category };
    updatedAssignments[subjectId].lessons = updatedAssignments[subjectId].lessons.map(
      (assignment: any) => ({
        ...assignment,
        selected: !allSelected,
      })
    );

    updateSelectedLesson(type, updatedAssignments);
    setCategory(updatedAssignments);
  };

  const areAllSelected = (category: any) => {
    return Object.keys(category)?.length > 0
      ? Object.keys(category)?.every((subjectId) =>
          category[subjectId]?.lessons?.every(
            (assignment: any) => assignment?.selected
          )
        )
      : false;
  };

  const areAllSelectedInSubject = (category: any, subjectId: string) => {
    return category[subjectId]?.lessons.every(
      (assignment: any) => assignment?.selected
    );
  };
  const renderAssignments = (
    assignments: any,
    category: any,
    setCategory: any,
    type: TeacherAssignmentPageType
  ) => {
    const sortedSubjectKeys = Object.keys(assignments).sort(
      (a, b) =>
        (assignments[a].sort_index ?? Infinity) -
        (assignments[b].sort_index ?? Infinity)
    );
    return sortedSubjectKeys.map((subjectId) => (
      <div key={subjectId} className="render-subject">
        <div
          className="subject-header"
          onClick={() => toggleSubjectCollapse(type, subjectId)}
        >
          <h4>{assignments[subjectId]?.name}</h4>
          {assignments[subjectId].isCollapsed ? (
            <KeyboardArrowDownIcon style={{ marginLeft: "auto" }} />
          ) : (
            <KeyboardArrowUpIcon style={{ marginLeft: "auto" }} />
          )}
          <h4>
            {selectedLessonsCount?.[type]?.[subjectId]?.count?.length ?? 0}/
            {assignments[subjectId]?.lessons?.length ?? 0}
          </h4>
          {!assignments[subjectId].isCollapsed && (
            <div className="select-all-container">
              <input
                className="select-all-container-checkbox"
                type="checkbox"
                checked={areAllSelectedInSubject(assignments, subjectId)}
                onClick={(e) => e.stopPropagation()}
                onChange={() =>
                  selectAllAssignmentsInSubject(
                    type,
                    assignments,
                    setCategory,
                    subjectId
                  )
                }
              />
            </div>
          )}
        </div>
        {!assignments[subjectId].isCollapsed && (
          <div>
            {assignments[subjectId].lessons.map((assignment: any, index: number) => (
              <div key={index} className="assignment-list-item">
                <SelectIconImage
                  defaultSrc={"assets/icons/DefaultIcon.png"}
                  webSrc={assignment?.image}
                  imageWidth="100px"
                  imageHeight="auto"
                />
                <span className="assignment-list-item-name">
                  {assignment?.name}
                </span>
                <input
                  className="assignment-list-item-checkbox"
                  type="checkbox"
                  checked={assignment?.selected}
                  onChange={() =>
                    toggleAssignmentSelection(
                      type,
                      assignments,
                      setCategory,
                      subjectId,
                      index
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="teacher-assignments-page">
      <p id="assignment-page-heading">{t("Assignments")}</p>
      <div className="manual-assignments">
        <div
          className="manual-assignments-header"
          onClick={() => toggleCollapse(setManualCollapsed, manualCollapsed)}
        >
          <p
            className="recommended-assignments-headings"
            style={{ width: !manualCollapsed ? "60%" : "100%" }}
          >
            {t("Manual Assignments")}
          </p>
          <div>
            {manualCollapsed ? (
              <KeyboardArrowDownIcon />
            ) : (
              <div className="select-all-container">
                <h3 className="recommended-assignments-headings">
                  {selectedLessonsCount?.[TeacherAssignmentPageType.MANUAL]?.count ?? 0}/
                  {Object.keys(manualAssignments).reduce((total, subjectId) => {
                    return total + manualAssignments[subjectId].lessons.length;
                  }, 0)}
                </h3>
                <input
                  className="select-all-container-checkbox"
                  type="checkbox"
                  checked={areAllSelected(manualAssignments)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() =>
                    selectAllAssignments(
                      TeacherAssignmentPageType.MANUAL,
                      manualAssignments,
                      setManualAssignments
                    )
                  }
                />
                <label className="recommended-assignments-headings">
                  {t("Select All")}
                </label>
              </div>
            )}
          </div>
        </div>
        <hr className="styled-line" />
        {!manualCollapsed &&
          (manualAssignments && Object.keys(manualAssignments).length > 0 ? (
            renderAssignments(
              manualAssignments,
              manualAssignments,
              setManualAssignments,
              TeacherAssignmentPageType.MANUAL
            )
          ) : (
            <p>
              {t("You have not chosen any assignments. Please go to ")}
              <span
                id="manual-assignments-library-text"
                onClick={() => onLibraryClick()}
              >
                {t("Library")}
              </span>
              {t(" to choose and assign.")}
            </p>
          ))}
      </div>

      <div className="recommended-assignments">
        <div
          className="recommended-assignments-header"
          onClick={() =>
            toggleCollapse(setRecommendedCollapsed, recommendedCollapsed)
          }
        >
          <p
            className="recommended-assignments-headings"
            style={{ width: !recommendedCollapsed ? "60%" : "100%" }}
          >
            {t("Recommended Assignments")}
          </p>
          <div>
            {recommendedCollapsed ? (
              <KeyboardArrowDownIcon />
            ) : (
              <div className="select-all-container">
                <h3 className="recommended-assignments-headings">
                  {selectedLessonsCount?.[TeacherAssignmentPageType.RECOMMENDED]?.count ?? 0}/
                  {Object.keys(recommendedAssignments).reduce((total, subjectId) => {
                    return total + recommendedAssignments[subjectId].lessons.length;
                  }, 0)}
                </h3>
                <input
                  className="select-all-container-checkbox"
                  type="checkbox"
                  checked={areAllSelected(recommendedAssignments)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() =>
                    selectAllAssignments(
                      TeacherAssignmentPageType.RECOMMENDED,
                      recommendedAssignments,
                      setRecommendedAssignments
                    )
                  }
                />
                <label className="recommended-assignments-headings">
                  {t("Select All")}
                </label>
              </div>
            )}
          </div>
        </div>
        <hr className="styled-line" />
        {!recommendedCollapsed &&
          renderAssignments(
            recommendedAssignments,
            recommendedAssignments,
            setRecommendedAssignments,
            TeacherAssignmentPageType.RECOMMENDED
          )}
      </div>

      <AssignmentNextButton
        assignmentCount={
          selectedLessonsCount[TeacherAssignmentPageType.MANUAL].count +
          selectedLessonsCount[TeacherAssignmentPageType.RECOMMENDED].count
        }
        onClickCallBack={async () => {
          if (
            selectedLessonsCount[TeacherAssignmentPageType.MANUAL].count +
              selectedLessonsCount[TeacherAssignmentPageType.RECOMMENDED]
                .count >
            0
          ) {
            history.replace(PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE, {
              selectedAssignments: selectedLessonsCount,
              manualAssignments: manualAssignments,
              recommendedAssignments: recommendedAssignments,
            });
          } else {
            await Toast.show({
              text: t("Please select the Assignment") || "",
              duration: "long",
            });
          }
        }}
      />
    </div>
  );
};

export default TeacherAssignment;
