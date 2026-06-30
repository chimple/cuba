import React, { useEffect, useState } from 'react';
import './chpaterLessonBox.css';
import { Util } from '../../utility/util';
import { ServiceConfig } from '../../services/ServiceConfig';
import { COURSE_CHANGED, COURSES, TableTypes } from '../../common/constants';
import { useTranslation } from 'react-i18next';
import { LessonNode } from '../../hooks/useLearningPath';
import logger from '../../utility/logger';

interface ChapterLessonBoxProps {
  containerStyle?: React.CSSProperties;
  chapterName?: string;
  lessonName?: string;
  courseCode?: string;
}

const getSessionStorageItem = <T,>(
  key: string,
): { found: boolean; value: T | null } => {
  try {
    const cachedValue = sessionStorage.getItem(key);
    if (cachedValue === null) {
      return { found: false, value: null };
    }

    return {
      found: true,
      value: JSON.parse(cachedValue) as T,
    };
  } catch {
    return { found: false, value: null };
  }
};

const setSessionStorageItem = (key: string, value: unknown): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.warn('Unable to persist chapter lesson cache', { key, error });
  }
};

const ChapterLessonBox: React.FC<ChapterLessonBoxProps> = ({
  containerStyle,
  chapterName,
  lessonName,
  courseCode,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const [currentChapterName, setCurrentChapterName] = useState<string>('');
  const { t } = useTranslation();
  const getCachedLesson = async (lessonId: string) => {
    const cacheKey = `lesson_${lessonId}`;
    const cachedLesson = getSessionStorageItem<TableTypes<'lesson'>>(cacheKey);
    if (cachedLesson.found) return cachedLesson.value;

    const lesson = await api.getLesson(lessonId);
    setSessionStorageItem(cacheKey, lesson ?? null);
    return lesson;
  };

  const getCachedChapter = async (chapterId: string) => {
    const cacheKey = `chapter_${chapterId}`;
    const cachedChapter =
      getSessionStorageItem<TableTypes<'chapter'>>(cacheKey);
    if (cachedChapter.found) return cachedChapter.value;

    const chapter = await api.getChapterById(chapterId);
    setSessionStorageItem(cacheKey, chapter ?? null);
    return chapter;
  };

  const getRenderedChapterLessonText = (
    rawChapterName: string | null,
    rawLessonName: string | null,
    resolvedCourseCode: string | null,
  ) => {
    const isEnglishSubject =
      resolvedCourseCode === COURSES.ENGLISH ||
      resolvedCourseCode === COURSES.MATHS;
    const translatedChapterName = rawChapterName
      ? isEnglishSubject
        ? rawChapterName
        : t(rawChapterName)
      : null;
    const translatedLessonName = rawLessonName
      ? isEnglishSubject
        ? rawLessonName
        : t(rawLessonName)
      : null;

    if (translatedChapterName) {
      return `${translatedChapterName} : ${translatedLessonName ?? ''}`;
    }

    return isEnglishSubject ? (rawLessonName ?? '') : t(rawLessonName ?? '');
  };

  useEffect(() => {
    // SCENARIO 1: Props are provided (Homework Page)
    if (chapterName && lessonName) {
      const renderedText = getRenderedChapterLessonText(
        chapterName,
        lessonName,
        courseCode ?? null,
      );

      setCurrentChapterName(renderedText);
      return; // Stop here, don't do the API fetch
    }
    const updateChapter = async () => {
      const currentStudent = Util.getCurrentStudent();
      if (!currentStudent || !currentStudent.learning_path) return;

      const pathToParse = Util.getLatestLearningPathByUpdatedAt(currentStudent);
      let learningPath = pathToParse ? JSON.parse(pathToParse) : null;
      const currentCourseIndex = learningPath?.courses.currentCourseIndex;
      const course = learningPath?.courses.courseList[currentCourseIndex];

      const pathItem =
        course?.path?.find((p: LessonNode) => p.isPlayed === false) ??
        (course?.path?.length ? course.path[course.path.length - 1] : null);
      if (!pathItem?.lesson_id) {
        setCurrentChapterName('');
        return;
      }

      let lesson: TableTypes<'lesson'> | undefined | null = null;
      let chapter: TableTypes<'chapter'> | undefined | null = null;

      try {
        lesson = await getCachedLesson(pathItem.lesson_id);
        chapter = pathItem.chapter_id
          ? await getCachedChapter(pathItem.chapter_id)
          : null;
      } catch (error) {
        logger.error('Error fetching lesson or chapter details:', error);
      }

      const rawChapterName = chapter?.name ?? null;
      const rawLessonName = lesson?.name ?? null;
      const resolvedCourseCode =
        courseCode ?? course?.course_code ?? course?.code ?? null;
      const renderedText = getRenderedChapterLessonText(
        rawChapterName,
        rawLessonName,
        resolvedCourseCode,
      );

      setCurrentChapterName(renderedText);
    };

    // Fetch the initial chapter on component mount
    (async () => {
      await updateChapter();
    })();

    // Listen for course changes
    const syncHandleCourseChange = (event: Event) => {
      updateChapter().catch((err) =>
        logger.error('Error handling course change:', err),
      );
    };

    window.addEventListener(COURSE_CHANGED, syncHandleCourseChange);

    return () => {
      window.removeEventListener(COURSE_CHANGED, syncHandleCourseChange);
    };
  }, [chapterName, lessonName, courseCode, t]);

  return (
    <div
      className="chapter-lesson-box"
      style={{
        ...containerStyle,
      }}
    >
      <div className="chapter-lesson-text">{currentChapterName}</div>
    </div>
  );
};

export default ChapterLessonBox;
