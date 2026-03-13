import { AssignmentSource, TableTypes } from "../../common/constants";

type ChapterSelectionValue =
  | Partial<Record<AssignmentSource, string[]>>
  | string[];

const hasSelectedLessons = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  const selectionMap = value as Partial<Record<AssignmentSource, string[]>>;
  const manual = Array.isArray(selectionMap[AssignmentSource.MANUAL])
    ? selectionMap[AssignmentSource.MANUAL]
    : [];
  const qr = Array.isArray(selectionMap[AssignmentSource.QR_CODE])
    ? selectionMap[AssignmentSource.QR_CODE]
    : [];

  return manual.length + qr.length > 0;
};

export const getCartChapterIdsForCourse = (
  lessonsJson: string | null | undefined,
  classId: string | null | undefined,
  validChapterIds: Set<string>
): Set<string> => {
  if (!lessonsJson || !classId || validChapterIds.size === 0) {
    return new Set();
  }

  try {
    const allClassData = JSON.parse(lessonsJson) as Record<string, unknown>;
    const classData = allClassData?.[classId];
    if (!classData) return new Set();

    const chapterMap =
      typeof classData === "string"
        ? (JSON.parse(classData) as Record<string, ChapterSelectionValue>)
        : (classData as Record<string, ChapterSelectionValue>);

    const selectedChapterIds = new Set<string>();

    Object.entries(chapterMap ?? {}).forEach(([chapterId, value]) => {
      if (!validChapterIds.has(chapterId)) return;
      if (hasSelectedLessons(value)) {
        selectedChapterIds.add(chapterId);
      }
    });

    return selectedChapterIds;
  } catch (error) {
    console.error("Failed to parse assignment cart for chapter targeting:", error);
    return new Set();
  }
};

export const resolveNextChapterId = (
  currentChapterId: string,
  chapterOrder: string[]
): string | undefined => {
  const chapterIndex = chapterOrder.findIndex((id) => id === currentChapterId);
  if (chapterIndex < 0) return;
  if (chapterIndex === chapterOrder.length - 1) return currentChapterId;
  return chapterOrder[chapterIndex + 1];
};

export const isEndOfChapter = (
  lastAssignment: TableTypes<"assignment">,
  lessonsInChapter: TableTypes<"lesson">[]
): boolean => {
  if (!lessonsInChapter.length || !lastAssignment.lesson_id) return false;
  const lastLessonId = lessonsInChapter[lessonsInChapter.length - 1]?.id;
  return Boolean(lastLessonId && lastAssignment.lesson_id === lastLessonId);
};

// Covers: valid route chapterId; last assignment within chapter; last assignment at chapter end -> next chapter (or same final chapter); cart with one/multiple chapters (last assignment still wins); cart-only fallback -> first cart chapter by order; ultimate fallback -> first chapter.
export const resolveInitialChapterId = ({
  routeChapterId,
  chapterOrder,
  lessonsByChapter,
  lastAssignmentForCourse,
  cartChapterIds,
}: {
  routeChapterId?: string;
  chapterOrder: string[];
  lessonsByChapter: Map<string, TableTypes<"lesson">[]>;
  lastAssignmentForCourse?: TableTypes<"assignment">;
  cartChapterIds: Set<string>;
}): string | undefined => {
  if (!chapterOrder.length) return;

  if (routeChapterId && chapterOrder.includes(routeChapterId)) {
    return routeChapterId;
  }

  const lastChapterId = lastAssignmentForCourse?.chapter_id ?? "";
  if (lastChapterId && chapterOrder.includes(lastChapterId) && lastAssignmentForCourse) {
    const lessonsInLastChapter = lessonsByChapter.get(lastChapterId) ?? [];
    const assignmentLessonId = lastAssignmentForCourse.lesson_id;
    const lessonExists = lessonsInLastChapter.some(
      (lesson) => lesson.id === assignmentLessonId
    );

    if (lessonExists) {
      if (isEndOfChapter(lastAssignmentForCourse, lessonsInLastChapter)) {
        return resolveNextChapterId(lastChapterId, chapterOrder) ?? lastChapterId;
      }
      return lastChapterId;
    }
  }

  if (cartChapterIds.size > 0) {
    const firstCartChapter = chapterOrder.find((chapterId) =>
      cartChapterIds.has(chapterId)
    );
    if (firstCartChapter) return firstCartChapter;
  }

  return chapterOrder[0];
};
