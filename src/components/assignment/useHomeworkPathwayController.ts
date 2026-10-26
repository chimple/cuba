import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ServiceConfig } from '../../services/ServiceConfig';
import {
  EVENTS,
  HOMEWORK_PATHWAY_DROPDOWN,
  HOMEWORK_PATHWAY,
  STICKER_BOOK_CELEBRATION_POPUP_ENABLED,
  STICKER_BOOK_COMPLETION_POPUP,
  TableTypes,
  LIVE_QUIZ,
} from '../../common/constants';
import { Util } from '../../utility/util';
import { useGbContext } from '../../growthbook/Growthbook';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import logger from '../../utility/logger';
import {
  clearPendingHomeworkStickerFlow,
  clearPendingHomeworkStickerPreviewState,
  clearPendingFinalHomeworkStickerFlow,
  hasPendingHomeworkStickerFlow,
  hasPendingHomeworkStickerSession,
  setPendingFinalHomeworkStickerFlow,
} from '../../utility/homeworkStickerFlow';
import {
  areStringArraysEqual,
  filterPlayableHomeworkItems,
  fetchLessonsById,
  hasHomeworkPathChanged,
  HomeworkPath,
  HomeworkPathwayAssignment,
  HomeworkPathwayItem,
  mergeHomeworkPathWithPendingAssignments,
} from './homeworkPathwayHelpers';
import { loadHomeworkPathway } from './HomeworkPathway.loader';

const HOMEWORK_REWARD_COMPLETED_INDEX_KEY = 'homework_reward_completed_index';
const PENDING_HOMEWORK_REWARD_TRANSITION_KEY =
  'pending_homework_reward_transition';

interface HomeworkPathwayProps {
  onPlayMoreHomework?: () => void; // ✅ NEW
  refreshToken?: number;
}

interface HomeworkPathwayProps {
  onPlayMoreHomework?: () => void;
  refreshToken?: number;
}

export const useHomeworkPathwayController = ({
  onPlayMoreHomework,
  refreshToken,
}: HomeworkPathwayProps) => {
  const api = ServiceConfig.getI().apiHandler;
  const [loading, setLoading] = useState<boolean>(true);
  const [boxDetails, setBoxDetails] = useState<{
    cName: string;
    lName: string;
    courseCode?: string;
  } | null>(null);

  const [from, setFrom] = useState<number>(0);
  const [to, setTo] = useState<number>(0);
  const currentStudent = Util.getCurrentStudent();
  const { setGbUpdated } = useGbContext();

  // ✅ New state variables for dropdown logic
  const [isDropdownDisabled, setIsDropdownDisabled] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showDisabledDropdownModal, setShowDisabledDropdownModal] =
    useState<boolean>(false);
  const isDropdownAlwaysEnabled = useFeatureIsOn(HOMEWORK_PATHWAY_DROPDOWN);
  const isStickerBookCelebrationPopupOn = useFeatureIsOn(
    STICKER_BOOK_CELEBRATION_POPUP_ENABLED,
  );
  const isStickerBookCompletionPopupOn = useFeatureIsOn(
    STICKER_BOOK_COMPLETION_POPUP,
  );
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isHomeworkComplete, setIsHomeworkComplete] = useState(false);
  const activeSubjectRef = useRef<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isStickerBookCelebrationPopupOn) return;

    clearPendingHomeworkStickerPreviewState();
    if (!isStickerBookCompletionPopupOn) {
      clearPendingHomeworkStickerFlow();
    }
  }, [isStickerBookCelebrationPopupOn, isStickerBookCompletionPopupOn]);

  useEffect(() => {
    if (!currentStudent?.id) {
      setLoading(false);
      return;
    }
    updateStarCount(currentStudent);
    fetchHomeworkPathway(
      currentStudent,
      selectedSubject || activeSubjectRef.current || undefined,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStudent?.id, isDropdownAlwaysEnabled, refreshToken]);

  const updateStarCount = async (currentStudent: TableTypes<'user'>) => {
    if (!currentStudent?.id) return;

    const studentId = currentStudent.id;
    const dbStars = currentStudent.stars || 0;

    // ⭐ Local-first: read from localStorage (STARS_COUNT/LATEST_STARS) via Util,
    // fallback to DB value if nothing stored.
    const localStars = Util.getLocalStarsForStudent(studentId, dbStars);

    // Decide animation range
    let fromVal = localStars;
    let toVal = localStars;

    if (localStars < dbStars) {
      // DB has more stars (e.g. user played on another device) → animate up to DB
      fromVal = localStars;
      toVal = dbStars;

      // Sync local storage to DB value so future reads start at correct value
      Util.setLocalStarsForStudent(studentId, dbStars);
    } else if (localStars > dbStars) {
      // Local is ahead of the DB (offline play / UI already bumped)
      // For UI we animate from DB → local (if you want that effect)
      fromVal = dbStars;
      toVal = localStars;
    }

    setFrom(fromVal);
    setTo(toVal);

    // Best-effort: if local is ahead, push to backend when online.
    // This keeps DB in sync but UI never waits on it.
    try {
      if (
        typeof navigator === 'undefined' ||
        (navigator && navigator.onLine && localStars > dbStars)
      ) {
        await api.updateStudentStars(studentId, localStars);
      }
    } catch (err) {
      logger.error('[Stars sync] Failed to sync stars with backend', err);
    }
  };

  const onSubjectChange = async (subjectId: string) => {
    if (subjectId === selectedSubject) {
      return;
    }
    const currentStudent = Util.getCurrentStudent();
    localStorage.removeItem(HOMEWORK_PATHWAY);
    setIsDropdownDisabled(false);
    activeSubjectRef.current = subjectId;
    if (currentStudent) {
      await fetchHomeworkPathway(currentStudent, subjectId);
    }
    setSelectedSubject(subjectId);
  };

  const buildTemporaryStickerHomeworkPath = async (
    currClassId: string,
    preferredCourseId?: string,
  ): Promise<HomeworkPath | null> => {
    try {
      const classCourses = await api.getCoursesForClassStudent(currClassId);
      const selectedCourse =
        classCourses.find((course) => course.id === preferredCourseId) ||
        classCourses[0];

      if (!selectedCourse?.id) return null;

      const placeholderLessons = Array.from({ length: 5 }, (_, index) => ({
        assignment_id: `sticker-placeholder-${index + 1}`,
        lesson_id: `sticker-placeholder-${index + 1}`,
        chapter_id: '',
        course_id: selectedCourse.id,
        lesson: {
          id: `sticker-placeholder-${index + 1}`,
          name: selectedCourse.name || 'Homework',
          image: 'assets/icons/NextNodeIcon.svg',
          plugin_type: 'lido',
        } as TableTypes<'lesson'>,
      }));

      return {
        path_id: uuidv4(),
        lessons: placeholderLessons,
        currentIndex: placeholderLessons.length,
        pendingAssignmentIds: [],
        isPlaceholderSnapshot: true,
      };
    } catch (error) {
      logger.error(
        '[HomeworkPathway] Failed to build temporary sticker homework path',
        error,
      );
      return null;
    }
  };

  /**
   * Makes sure each saved node includes the lesson metadata needed by the UI.
   */
  const normalizeAssignment = async (
    assignment: HomeworkPathwayAssignment,
  ): Promise<HomeworkPathwayItem | null> => {
    // Reuse lesson data from the payload when available to avoid extra fetches.
    const lesson =
      assignment.lesson ??
      (assignment.lesson_id ? await api.getLesson(assignment.lesson_id) : null);
    if (!lesson?.id) {
      logger.warn(
        '[HomeworkPathway] Skipping stale assignment because lesson metadata is unavailable',
        {
          assignmentId: assignment.assignment_id ?? assignment.id ?? null,
          lessonId: assignment.lesson_id ?? null,
        },
      );
      return null;
    }

    const lessonPathMetadata = lesson as {
      chapter_id?: string | null;
      course_id?: string | null;
    } | null;

    const lessonId = assignment.lesson_id ?? lesson.id ?? null;
    const chapterId =
      assignment.chapter_id ?? lessonPathMetadata?.chapter_id ?? null;
    const courseId =
      assignment.course_id ?? lessonPathMetadata?.course_id ?? null;

    if (!lessonId || !chapterId || !courseId) {
      logger.warn(
        '[HomeworkPathway] Skipping assignment because required pathway metadata is missing',
        {
          assignmentId: assignment.assignment_id ?? assignment.id ?? null,
          lessonId,
          chapterId,
          courseId,
        },
      );
      return null;
    }

    return {
      assignment_id: assignment.assignment_id ?? assignment.id ?? null,
      lesson_id: lessonId,
      // Preserve assignment ids first, but fall back to lesson metadata when the API omits them.
      chapter_id: chapterId,
      // Preserve assignment ids first, but fall back to lesson metadata when the API omits them.
      course_id: courseId,
      lesson,
      raw_assignment: assignment,
    };
  };

  const syncBoxDetailsFromPath = async (
    path: HomeworkPath,
    subjectId?: string,
  ) => {
    if (!path.lessons || path.lessons.length === 0) {
      return;
    }

    const idx = path.isPlaceholderSnapshot
      ? 0
      : Math.min(Math.max(path.currentIndex ?? 0, 0), path.lessons.length - 1);
    const currentObj = path.lessons[idx];

    if (!currentObj) return;

    const lessonName = currentObj.lesson?.name || 'Lesson';
    let chapterName = 'Chapter';
    let courseCode: string | undefined;

    try {
      if (currentObj.chapter_id) {
        const chapter = await api.getChapterById(currentObj.chapter_id);
        chapterName = chapter?.name || chapterName;
      }
      const resolvedSubjectId = subjectId ?? currentObj.course_id ?? null;
      if (resolvedSubjectId) {
        const course = await api.getCourse(resolvedSubjectId);
        courseCode = course?.code ?? undefined;
      }
    } catch (error) {
      logger.error('Failed fetching chapter details', error);
    }

    setBoxDetails({
      cName: chapterName,
      lName: lessonName,
      courseCode,
    });
  };

  const fetchHomeworkPathway = (
    student: TableTypes<'user'>,
    subjectId?: string,
  ): Promise<void> =>
    loadHomeworkPathway(
      {
        activeSubjectRef,
        api,
        buildAndSaveInitialHomeworkPath,
        buildTemporaryStickerHomeworkPath,
        isDropdownAlwaysEnabled,
        normalizeAssignment,
        saveHomeworkPath,
        selectedSubject,
        setBoxDetails,
        setCurrentIndex,
        setIsDropdownDisabled,
        setIsHomeworkComplete,
        setLoading,
        setRefreshKey,
        setSelectedSubject,
        syncBoxDetailsFromPath,
      },
      student,
      subjectId,
    );
  /**
   * SUBJECT-SPECIFIC path builder, used when dropdown subject is chosen.
   */
  const buildAndSaveInitialHomeworkPath = async (
    student: TableTypes<'user'>,
    pendingAssignments: HomeworkPathwayAssignment[],
    subjectId?: string,
  ) => {
    if (!pendingAssignments || pendingAssignments.length === 0) {
      const emptyPath: HomeworkPath = {
        path_id: uuidv4(),
        lessons: [],
        currentIndex: 0,
        pendingAssignmentIds: [],
      };
      await saveHomeworkPath(student, emptyPath);
      return emptyPath;
    }

    const pendingBySubject: Record<string, HomeworkPathwayAssignment[]> = {};

    for (const assignment of pendingAssignments) {
      if (!assignment.lesson_id) continue;
      const lesson =
        assignment.lesson ??
        (assignment.lesson_id
          ? await api.getLesson(assignment.lesson_id)
          : null);
      if (lesson && lesson.subject_id) {
        pendingBySubject[lesson.subject_id] = (
          pendingBySubject[lesson.subject_id] || []
        ).concat(assignment);
      }
    }

    let maxPending = 0;
    let subjectsWithMaxPending: string[] = [];
    Object.keys(pendingBySubject).forEach((subject) => {
      const length = pendingBySubject[subject].length;
      if (length > maxPending) {
        maxPending = length;
        subjectsWithMaxPending = [subject];
      } else if (length === maxPending) {
        subjectsWithMaxPending.push(subject);
      }
    });

    const bestSubject = subjectsWithMaxPending[0];
    const assignmentsForSubject = pendingBySubject[bestSubject] || [];

    assignmentsForSubject.sort((a, b) => {
      const isAManual = a.source === 'manual';
      const isBManual = b.source === 'manual';

      if (isAManual && !isBManual) return -1;
      if (!isAManual && isBManual) return 1;
      return 0;
    });

    // Select top 5 after sorting
    const selectedAssignments = assignmentsForSubject.slice(0, 5);

    const lessonsWithDetails = await Promise.all(
      selectedAssignments.map(async (assignment) => {
        // use normalizeAssignment which ensures lesson is present
        return await normalizeAssignment(assignment);
      }),
    );
    const playableLessons = filterPlayableHomeworkItems(lessonsWithDetails);

    const newHomeworkPath: HomeworkPath = {
      path_id: uuidv4(),
      lessons: playableLessons,
      currentIndex: 0,
      pendingAssignmentIds: playableLessons
        .map((lesson) => lesson.assignment_id)
        .filter((id): id is string => !!id)
        .map(String),
    };

    await saveHomeworkPath(student, newHomeworkPath);
    // ▶️ Log HOMEWORK_PATHWAY_CHANGED for the newly created path
    if (subjectId) setSelectedSubject(subjectId);
    try {
      const changedEvent = {
        user_id: student.id,
        new_path_id: newHomeworkPath.path_id,
        subject_id: subjectId ?? null,
        new_course_id: newHomeworkPath.lessons?.[0]?.course_id ?? null,
        new_lesson_id: newHomeworkPath.lessons?.[0]?.lesson_id ?? null,
        assignment_id: newHomeworkPath.lessons?.[0]?.assignment_id ?? null,
        total_lessons_in_path: newHomeworkPath.lessons?.length ?? 0,
        lesson_ids: newHomeworkPath.lessons.map(
          (lesson) => lesson.lesson_id ?? null,
        ),
        assignment_ids: newHomeworkPath.lessons.map(
          (lesson) => lesson.assignment_id ?? null,
        ),
        changed_at: new Date().toISOString(),
        reason: subjectId ? 'subject_changed' : 'default_pathway',
      };
      Util.logEvent(EVENTS.HOMEWORK_PATHWAY_COURSE_CHANGED, changedEvent);
    } catch (err) {
      logger.error(
        '[HomeworkPathway] Failed to log HOMEWORK_PATHWAY_CHANGED event',
        err,
      );
    }

    return newHomeworkPath;
  };

  const saveHomeworkPath = async (
    student: TableTypes<'user'>,
    path: HomeworkPath,
  ) => {
    localStorage.setItem(HOMEWORK_PATHWAY, JSON.stringify(path));

    if (!path.lessons || path.lessons.length < 5) {
      return;
    }

    const assignmentIds = (path.lessons || []).map(
      (lesson) => lesson.assignment_id ?? null,
    );

    // Build compact list of up to 5 assignment ids with explicit keys (assignment_id_1 .. 5)
    const assignmentSlots: Record<string, string | null> = {};
    for (let i = 0; i < 5; i++) {
      assignmentSlots[`assignment_id_${i + 1}`] = assignmentIds[i] ?? null;
    }

    const eventData = {
      user_id: student.id,
      path_id: path.path_id,
      current_course_id: path.lessons?.[0]?.course_id ?? null,
      current_lesson_id: path.lessons?.[0]?.lesson_id ?? null,
      current_chapter_id: path.lessons?.[0]?.chapter_id ?? null,
      total_lessons_in_path: path.lessons?.length ?? 0,
      lesson_ids: path.lessons?.map((lesson) => lesson.lesson_id ?? null) ?? [],
      assignment_ids: assignmentIds,
      created_at: new Date().toISOString(),
      ...assignmentSlots,
    };

    Util.logEvent(EVENTS.HOMEWORK_PATHWAY_CREATED, eventData);
  };

  // ✅ New handler for clicking the disabled dropdown wrapper
  const handleDropdownWrapperClick = () => {
    if (isDropdownDisabled) {
      setShowDisabledDropdownModal(true);
    }
  };

  const handleFinalHomeworkStickerComplete = () => {
    clearPendingFinalHomeworkStickerFlow();
    localStorage.removeItem(HOMEWORK_PATHWAY);
    setIsHomeworkComplete(true);
    setRefreshKey((prev) => prev + 1);
  };

  const handleHomeworkComplete = async () => {
    const student = Util.getCurrentStudent();
    if (!student) return;
    if (!isStickerBookCelebrationPopupOn) {
      clearPendingHomeworkStickerPreviewState();
      if (!isStickerBookCompletionPopupOn) {
        clearPendingHomeworkStickerFlow();
      }
    }

    const resolveHomeworkCompletionState = async () => {
      await fetchHomeworkPathway(student);

      const refreshedPathStr = localStorage.getItem(HOMEWORK_PATHWAY);
      if (!refreshedPathStr) {
        setIsHomeworkComplete(!hasPendingHomeworkStickerFlow());
        return;
      }

      try {
        const refreshedPath = JSON.parse(refreshedPathStr) as HomeworkPath;
        const hasLessons =
          Array.isArray(refreshedPath.lessons) &&
          refreshedPath.lessons.length > 0;

        setIsHomeworkComplete(!hasLessons && !hasPendingHomeworkStickerFlow());
      } catch (error) {
        logger.error(
          'Failed to resolve refreshed homework completion state',
          error,
        );
        setIsHomeworkComplete(!hasPendingHomeworkStickerFlow());
      }
    };

    const pathStr = localStorage.getItem(HOMEWORK_PATHWAY);
    if (pathStr) {
      try {
        const path = JSON.parse(pathStr) as HomeworkPath;
        const newIndex = (path.currentIndex || 0) + 1;

        if (newIndex >= path.lessons.length) {
          const hasPendingStickerFlow =
            (isStickerBookCelebrationPopupOn ||
              isStickerBookCompletionPopupOn) &&
            hasPendingHomeworkStickerSession();

          if (hasPendingStickerFlow) {
            path.currentIndex = newIndex;
            await saveHomeworkPath(student, path);
            setCurrentIndex(newIndex);
            if (!isDropdownAlwaysEnabled) {
              setIsDropdownDisabled(newIndex > 0);
            }
            await syncBoxDetailsFromPath(path, selectedSubject || undefined);
            setRefreshKey((prev) => prev + 1);
          } else {
            localStorage.removeItem(HOMEWORK_PATHWAY);
            await resolveHomeworkCompletionState();
          }
        } else {
          path.currentIndex = newIndex;
          await saveHomeworkPath(student, path);
          setCurrentIndex(newIndex);
          if (!isDropdownAlwaysEnabled) {
            setIsDropdownDisabled(newIndex > 0);
          }
          await syncBoxDetailsFromPath(path, selectedSubject || undefined);
          setRefreshKey((prev) => prev + 1);
        }
      } catch (e) {
        logger.error('Failed to update homework progress', e);
        await resolveHomeworkCompletionState();
      }
    } else {
      await resolveHomeworkCompletionState();
    }
  };

  return {
    activeSubjectRef,
    boxDetails,
    fetchHomeworkPathway,
    handleDropdownWrapperClick,
    handleFinalHomeworkStickerComplete,
    handleHomeworkComplete,
    isDropdownDisabled,
    isHomeworkComplete,
    loading,
    onPlayMoreHomework,
    onSubjectChange,
    refreshKey,
    selectedSubject,
    setIsHomeworkComplete,
    setShowDisabledDropdownModal,
    showDisabledDropdownModal,
  };
};
