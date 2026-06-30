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

const getSessionStorageItem = <T,>(key: string): T | null => {
  const cachedValue = sessionStorage.getItem(key);
  if (!cachedValue) return null;

  try {
    return JSON.parse(cachedValue) as T;
  } catch {
    return null;
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
    const cachedLesson = getSessionStorageItem<TableTypes<'lesson'> | null>(
      cacheKey,
    );
    if (cachedLesson) return cachedLesson;

    const lesson = await api.getLesson(lessonId);
    sessionStorage.setItem(cacheKey, JSON.stringify(lesson ?? null));
    return lesson;
  };

  const getCachedChapter = async (chapterId: string) => {
    const cacheKey = `chapter_${chapterId}`;
    const cachedChapter = getSessionStorageItem<TableTypes<'chapter'> | null>(
      cacheKey,
    );
    if (cachedChapter) return cachedChapter;

    const chapter = await api.getChapterById(chapterId);
    sessionStorage.setItem(cacheKey, JSON.stringify(chapter ?? null));
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

      const [lesson, chapter] = await Promise.all([
        getCachedLesson(pathItem.lesson_id),
        pathItem.chapter_id ? getCachedChapter(pathItem.chapter_id) : null,
      ]);

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
