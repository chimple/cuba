const HIDDEN_LESSON_ID_PREFIXES = ['live_quiz_math'];
const HIDDEN_LESSON_IDS = ['mz_fc1_0000'];

type LessonIdentifierFields = {
  id?: string | null;
  lesson_id?: string | null;
  docId?: string | null;
  cocos_lesson_id?: string | null;
  lido_lesson_id?: string | null;
};

export const isHiddenLesson = (
  lesson?: LessonIdentifierFields | null,
): boolean => {
  if (!lesson) return false;

  const lessonIds = [
    lesson.id,
    lesson.lesson_id,
    lesson.docId,
    lesson.cocos_lesson_id,
    lesson.lido_lesson_id,
  ];

  return lessonIds.some(
    (lessonId) =>
      typeof lessonId === 'string' &&
      (HIDDEN_LESSON_IDS.includes(lessonId) ||
        HIDDEN_LESSON_ID_PREFIXES.some((prefix) =>
          lessonId.startsWith(prefix),
        )),
  );
};

export const filterHiddenLessons = <T extends LessonIdentifierFields>(
  lessons: T[] | undefined | null,
): T[] => (lessons ?? []).filter((lesson) => !isHiddenLesson(lesson));
