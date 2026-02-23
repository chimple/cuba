import { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router";
import { Toast } from "@capacitor/toast";
import { t } from "i18next";
import {
  AssignmentSource,
  COURSES,
  PAGES,
  TableTypes,
} from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { TeacherAssignmentPageType } from "../components/homePage/assignment/TeacherAssignment";

export interface AssignmentLessonItem {
  id: string;
  name: string;
  image?: string | null;
  chapterId: string;
  chapterName: string;
  selected: boolean;
  lesson: TableTypes<"lesson">;
}

export interface AssignmentCourseGroup {
  courseId: string;
  courseName: string;
  courseCode?: string | null;
  sortIndex?: number | null;
  lessons: AssignmentLessonItem[];
}

export const useTeacherLibraryAssignmentsLogic = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [loading, setLoading] = useState<boolean>(true);
  const [groups, setGroups] = useState<AssignmentCourseGroup[]>([]);

  useEffect(() => {
    void init();
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      const currentClass = Util.getCurrentClass();
      const currUser = await auth.getCurrentUser();

      if (!currentClass?.id || !currUser?.id) {
        history.replace(PAGES.HOME_PAGE, { tabValue: 1 });
        return;
      }

      const previousSyncLesson = await api.getUserAssignmentCart(currUser.id);
      if (!previousSyncLesson?.lessons) {
        setGroups([]);
        return;
      }

      const allSyncLesson: Map<string, string> = new Map(
        Object.entries(JSON.parse(previousSyncLesson.lessons))
      );
      const syncLessonData = allSyncLesson.get(currentClass.id);
      const parsedChapterData = syncLessonData ? JSON.parse(syncLessonData) : {};
      const chapterLessonMap: Map<
        string,
        Partial<Record<AssignmentSource, string[]>> | string[]
      > = new Map(Object.entries(parsedChapterData));

      const chapterNameCache = new Map<string, string>();
      const groupedByCourse = new Map<string, AssignmentCourseGroup>();

      for (const [chapterId, sourceMapOrArray] of chapterLessonMap.entries()) {
        const lessonIdSet = new Set<string>();

        if (Array.isArray(sourceMapOrArray)) {
          sourceMapOrArray.forEach((id: string) => lessonIdSet.add(id));
        } else if (typeof sourceMapOrArray === "object" && sourceMapOrArray) {
          (sourceMapOrArray[AssignmentSource.MANUAL] ?? []).forEach((id) =>
            lessonIdSet.add(id)
          );
          (sourceMapOrArray[AssignmentSource.QR_CODE] ?? []).forEach((id) =>
            lessonIdSet.add(id)
          );
        }

        if (!chapterNameCache.has(chapterId)) {
          const chapter = await api.getChapterById(chapterId);
          chapterNameCache.set(chapterId, chapter?.name ?? "");
        }
        const chapterName = chapterNameCache.get(chapterId) ?? "";

        for (const lessonId of lessonIdSet) {
          const lessonData = await api.getLessonFromChapter(chapterId, lessonId);
          const lesson = lessonData.lesson?.[0];
          const course = lessonData.course?.[0];
          if (!lesson?.id || !course?.id) {
            continue;
          }

          if (!groupedByCourse.has(course.id)) {
            groupedByCourse.set(course.id, {
              courseId: course.id,
              courseName: course.name ?? "",
              courseCode: course.code,
              sortIndex: course.sort_index,
              lessons: [],
            });
          }

          const currentGroup = groupedByCourse.get(course.id)!;
          if (currentGroup.lessons.some((l) => l.id === lesson.id)) {
            continue;
          }

          currentGroup.lessons.push({
            id: lesson.id,
            name: lesson.name ?? "",
            image: lesson.image,
            chapterId,
            chapterName,
            selected: true,
            lesson,
          });
        }
      }

      const sortedGroups = Array.from(groupedByCourse.values())
        .sort(
          (a, b) =>
            (a.sortIndex ?? Number.MAX_SAFE_INTEGER) -
            (b.sortIndex ?? Number.MAX_SAFE_INTEGER)
        )
        .map((group) => ({
          ...group,
          lessons: group.lessons.sort((a, b) => a.name.localeCompare(b.name)),
        }));

      setGroups(sortedGroups);
    } catch (error) {
      console.error("Failed to load library assignments:", error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const assignmentCount = useMemo(
    () =>
      groups.reduce(
        (total, group) =>
          total + group.lessons.filter((lesson) => lesson.selected).length,
        0
      ),
    [groups]
  );

  const toggleLesson = (courseId: string, lessonId: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.courseId !== courseId) return group;
        return {
          ...group,
          lessons: group.lessons.map((lesson) =>
            lesson.id === lessonId
              ? { ...lesson, selected: !lesson.selected }
              : lesson
          ),
        };
      })
    );
  };

  const buildAssignmentPayload = () => {
    const manualAssignments: Record<string, any> = {};
    const manualSelectedAssignments: Record<string, any> = { count: 0 };

    groups.forEach((group) => {
      const selectedIds = group.lessons
        .filter((lesson) => lesson.selected)
        .map((lesson) => lesson.id);

      manualSelectedAssignments[group.courseId] = { count: selectedIds };
      manualSelectedAssignments.count += selectedIds.length;

      manualAssignments[group.courseId] = {
        name: group.courseName,
        courseCode: group.courseCode,
        isCollapsed: false,
        sort_index: group.sortIndex,
        lessons: group.lessons.map((lesson) => ({
          ...lesson.lesson,
          selected: lesson.selected,
          chapter_id: lesson.chapterId,
          chapter_name: lesson.chapterName,
        })),
      };
    });

    const selectedAssignments = {
      [TeacherAssignmentPageType.MANUAL]: manualSelectedAssignments,
      [TeacherAssignmentPageType.RECOMMENDED]: { count: 0 },
    };

    return {
      selectedAssignments,
      manualAssignments,
      recommendedAssignments: {},
    };
  };

  const handleNext = async () => {
    if (assignmentCount <= 0) {
      await Toast.show({
        text: t("Please select the Assignment") || "",
        duration: "long",
      });
      return;
    }

    history.replace(PAGES.SHOW_STUDENTS_IN_ASSIGNED_PAGE, buildAssignmentPayload());
  };

  const handleBackButtonClick = () => {
    if (history.length > 1) {
      history.goBack();
      return;
    }
    history.replace(PAGES.HOME_PAGE, { tabValue: 1 });
  };

  const getSelectedCount = (group: AssignmentCourseGroup): number =>
    group.lessons.filter((lesson) => lesson.selected).length;

  const getSubjectTitle = (group: AssignmentCourseGroup): string =>
    group.courseCode === COURSES.ENGLISH
      ? group.courseName
      : t(group.courseName ?? "");

  const getLessonTitle = (
    group: AssignmentCourseGroup,
    lesson: AssignmentLessonItem
  ): string =>
    group.courseCode === COURSES.ENGLISH ? lesson.name : t(lesson.name ?? "");

  const getChapterTitle = (
    group: AssignmentCourseGroup,
    lesson: AssignmentLessonItem
  ): string =>
    group.courseCode === COURSES.ENGLISH
      ? lesson.chapterName
      : t(lesson.chapterName ?? "");

  return {
    loading,
    groups,
    assignmentCount,
    toggleLesson,
    handleNext,
    handleBackButtonClick,
    getSelectedCount,
    getSubjectTitle,
    getLessonTitle,
    getChapterTitle,
  };
};

