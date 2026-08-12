import { v4 as uuidv4 } from 'uuid';
import { EVENTS, HOMEWORK_PATHWAY, LIVE_QUIZ } from '../../common/constants';
import { Util } from '../../utility/util';
import logger from '../../utility/logger';
import {
  areStringArraysEqual,
  filterPlayableHomeworkItems,
  fetchLessonsById,
  hasHomeworkPathChanged,
  HomeworkPath,
  HomeworkPathwayAssignment,
  mergeHomeworkPathWithPendingAssignments,
} from './homeworkPathwayHelpers';
import {
  clearPendingFinalHomeworkStickerFlow,
  hasPendingHomeworkStickerFlow,
  setPendingFinalHomeworkStickerFlow,
} from '../../utility/homeworkStickerFlow';

const HOMEWORK_REWARD_COMPLETED_INDEX_KEY = 'homework_reward_completed_index';
const PENDING_HOMEWORK_REWARD_TRANSITION_KEY =
  'pending_homework_reward_transition';

export const loadHomeworkPathway = async (
  ctx: any,
  student: any,
  subjectId?: string,
): Promise<void> => {
  const {
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
  } = ctx;
  setLoading(true);
  const syncPendingFinalHomeworkFlow = (
    shouldKeepPendingFinalHomeworkFlow: boolean,
  ) => {
    if (shouldKeepPendingFinalHomeworkFlow) {
      setPendingFinalHomeworkStickerFlow(student.id);
      return;
    }

    clearPendingFinalHomeworkStickerFlow();
  };
  const rewardCompletedIndexRaw = sessionStorage.getItem(
    HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
  );
  const rewardCompletedIndex =
    rewardCompletedIndexRaw !== null && /^-?\d+$/.test(rewardCompletedIndexRaw);
  const rawPendingRewardTransition = sessionStorage.getItem(
    PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
  );
  const pendingRewardTransition = (() => {
    if (!rawPendingRewardTransition) return null;
    try {
      const parsed = JSON.parse(rawPendingRewardTransition) as {
        completedIndex?: number;
        pathSnapshot?: string;
      };
      if (
        typeof parsed.completedIndex !== 'number' ||
        !Number.isFinite(parsed.completedIndex)
      )
        return null;
      if (typeof parsed.pathSnapshot !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  })();
  const hasPendingRewardTransition =
    rewardCompletedIndex &&
    pendingRewardTransition !== null &&
    Number(rewardCompletedIndexRaw) === pendingRewardTransition.completedIndex;

  // 0️⃣ Read existing path from localStorage (if any)
  const existingPathStr = localStorage.getItem(HOMEWORK_PATHWAY);
  let existingPath: HomeworkPath | null = null;

  if (existingPathStr) {
    try {
      const parsed = JSON.parse(existingPathStr) as HomeworkPath;

      const hasLessons =
        Array.isArray(parsed.lessons) && parsed.lessons.length > 0;
      const notFinished =
        typeof parsed.currentIndex === 'number' &&
        parsed.currentIndex < parsed.lessons.length;
      const isPlaceholderSnapshot = parsed.isPlaceholderSnapshot === true;
      const shouldKeepCompletedSnapshot =
        hasLessons && !notFinished && hasPendingHomeworkStickerFlow();
      const shouldKeepPlaceholderSnapshot =
        hasLessons && isPlaceholderSnapshot && hasPendingHomeworkStickerFlow();

      if (
        hasLessons &&
        ((notFinished && !isPlaceholderSnapshot) ||
          hasPendingRewardTransition ||
          shouldKeepCompletedSnapshot ||
          shouldKeepPlaceholderSnapshot)
      ) {
        existingPath = parsed;
      } else {
        localStorage.removeItem(HOMEWORK_PATHWAY);
      }
    } catch (err) {
      logger.error('Invalid HOMEWORK_PATHWAY in localStorage:', err);
      localStorage.removeItem(HOMEWORK_PATHWAY);
    }
  }

  let pathData: HomeworkPath | null = null;
  const existingPathIsCompletedSnapshot = Boolean(
    existingPath?.lessons?.length &&
    typeof existingPath.currentIndex === 'number' &&
    existingPath.currentIndex >= existingPath.lessons.length,
  );
  const shouldKeepCompletedSnapshot =
    existingPathIsCompletedSnapshot && hasPendingHomeworkStickerFlow();
  const storedPathSubjectId =
    existingPath?.lessons?.[0]?.course_id != null
      ? String(existingPath.lessons[0].course_id)
      : undefined;
  const effectiveSubjectId =
    subjectId ?? storedPathSubjectId ?? activeSubjectRef.current ?? undefined;
  try {
    const currClass = Util.getCurrentClass();
    if (!currClass?.id) {
      clearPendingFinalHomeworkStickerFlow();
      setLoading(false);
      return;
    }

    let allPendingAssignments: HomeworkPathwayAssignment[] = [];
    let pendingAssignmentsFetched = false;
    try {
      const all = await api.getPendingAssignments(currClass.id, student.id);
      const pendingHomeworkAssignments = all.filter(
        (a: any) => a.type !== LIVE_QUIZ,
      );
      const lessonById = await fetchLessonsById(
        pendingHomeworkAssignments.map(
          (assignment: any) => assignment.lesson_id,
        ),
        api.getLessonsBylessonIds.bind(api),
      );
      allPendingAssignments = pendingHomeworkAssignments.reduce(
        (
          assignments: HomeworkPathwayAssignment[],
          assignment: HomeworkPathwayAssignment,
        ) => {
          const lesson = assignment.lesson_id
            ? lessonById.get(assignment.lesson_id)
            : null;
          if (!lesson) {
            logger.warn(
              '[HomeworkPathway] Skipping stale pending homework assignment with missing lesson metadata',
              {
                assignmentId: assignment.id ?? null,
                lessonId: assignment.lesson_id ?? null,
              },
            );
            return assignments;
          }

          assignments.push({
            ...assignment,
            lesson,
            subject_id: lesson.subject_id,
          });
          return assignments;
        },
        [] as HomeworkPathwayAssignment[],
      );
      pendingAssignmentsFetched = true;
    } catch (error) {
      logger.error('Failed to load pending assignments:', error);
    }

    const pendingAssignmentsForCurrentView = effectiveSubjectId
      ? allPendingAssignments.filter(
          (assignment) =>
            String(assignment.course_id) === String(effectiveSubjectId),
        )
      : allPendingAssignments;

    const currentPendingAssignmentIds = pendingAssignmentsForCurrentView
      .map((assignment) => assignment.id)
      .filter((id): id is string => !!id)
      .map(String);

    if (pendingAssignmentsFetched) {
      syncPendingFinalHomeworkFlow(
        allPendingAssignments.length === 0 && hasPendingHomeworkStickerFlow(),
      );
    }
    const cachedPendingAssignmentIds = Array.isArray(
      existingPath?.pendingAssignmentIds,
    )
      ? (existingPath?.pendingAssignmentIds ?? [])
          .filter((id): id is string => !!id)
          .map(String)
      : null;
    const hasCachedPendingAssignmentIds = cachedPendingAssignmentIds !== null;
    const existingPathCurrentIndex =
      existingPath?.currentIndex != null
        ? Math.min(
            Math.max(existingPath.currentIndex, 0),
            existingPath.lessons.length,
          )
        : 0;
    const isExistingPathInProgress =
      Boolean(existingPath) &&
      !existingPath?.isPlaceholderSnapshot &&
      existingPathCurrentIndex > 0 &&
      existingPathCurrentIndex < (existingPath?.lessons.length ?? 0);
    const canAppendAssignmentsToExistingPath =
      Boolean(existingPath) &&
      isExistingPathInProgress &&
      storedPathSubjectId != null &&
      effectiveSubjectId != null &&
      String(storedPathSubjectId) === String(effectiveSubjectId);
    const canReuseExistingPath =
      existingPath &&
      (hasPendingRewardTransition ||
        (pendingAssignmentsFetched &&
          (!hasCachedPendingAssignmentIds ||
            areStringArraysEqual(
              cachedPendingAssignmentIds,
              currentPendingAssignmentIds,
            ))));
    // 1️⃣ If we could not refresh pending assignments, fall back to cache.
    if (!pendingAssignmentsFetched && existingPath) {
      pathData = existingPath;
    } else if (
      existingPath &&
      !hasCachedPendingAssignmentIds &&
      !effectiveSubjectId
    ) {
      const migratedPath: HomeworkPath = {
        ...existingPath,
        pendingAssignmentIds: currentPendingAssignmentIds,
      };
      await saveHomeworkPath(student, migratedPath);
      pathData = migratedPath;
    } else if (
      existingPath &&
      pendingAssignmentsFetched &&
      canAppendAssignmentsToExistingPath
    ) {
      // Rebuild only the active tail so fresh homework can start at `currentIndex`.
      const mergedPath = await mergeHomeworkPathWithPendingAssignments(
        existingPath,
        pendingAssignmentsForCurrentView,
        currentPendingAssignmentIds,
        normalizeAssignment,
      );

      if (hasHomeworkPathChanged(existingPath, mergedPath)) {
        await saveHomeworkPath(student, mergedPath);
      }
      pathData = mergedPath;
    } else if (canReuseExistingPath) {
      // 1️⃣ If cached path still matches the current pending assignments, reuse it.
      pathData = existingPath;
    } else {
      // 2️⃣ Need (re)build from assignments (first time / subject change)
      // 2a. Subject filter, if any
      if (effectiveSubjectId) {
        allPendingAssignments = pendingAssignmentsForCurrentView;

        if (!allPendingAssignments.length) {
          const shouldPreserveExistingPathForRewardFlow =
            Boolean(existingPath) &&
            (shouldKeepCompletedSnapshot ||
              hasPendingRewardTransition ||
              hasPendingHomeworkStickerFlow());

          if (shouldPreserveExistingPathForRewardFlow && existingPath) {
            pathData = existingPath;
          } else if (hasPendingHomeworkStickerFlow()) {
            const placeholderPath = await buildTemporaryStickerHomeworkPath(
              currClass.id,
              subjectId,
            );

            if (placeholderPath) {
              await saveHomeworkPath(student, placeholderPath);
              pathData = placeholderPath;
            }
          } else {
            setSelectedSubject(null);
            activeSubjectRef.current = null;
            localStorage.removeItem(HOMEWORK_PATHWAY);
            await loadHomeworkPathway(ctx, student);
            return;
          }
        }
      }

      // 3️⃣ If pathData still not set, build it
      if (!pathData) {
        if (!subjectId) {
          if (!allPendingAssignments.length) {
            if (hasPendingHomeworkStickerFlow()) {
              const placeholderPath = await buildTemporaryStickerHomeworkPath(
                currClass.id,
                subjectId,
              );

              if (placeholderPath) {
                await saveHomeworkPath(student, placeholderPath);
                pathData = placeholderPath;
              } else if (existingPath?.lessons?.length) {
                const preservedCompletedPath: HomeworkPath = {
                  ...existingPath,
                };
                await saveHomeworkPath(student, preservedCompletedPath);
                pathData = preservedCompletedPath;
              } else {
                const emptyPath: HomeworkPath = {
                  path_id: uuidv4(),
                  lessons: [],
                  currentIndex: 0,
                  pendingAssignmentIds: currentPendingAssignmentIds,
                };
                await saveHomeworkPath(student, emptyPath);
                pathData = emptyPath;
              }
            } else {
              const emptyPath: HomeworkPath = {
                path_id: uuidv4(),
                lessons: [],
                currentIndex: 0,
                pendingAssignmentIds: currentPendingAssignmentIds,
              };
              await saveHomeworkPath(student, emptyPath);
              pathData = emptyPath;
            }
          } else {
            const assignmentsWithSubject: HomeworkPathwayAssignment[] = [];
            const pendingBySubject: Record<
              string,
              HomeworkPathwayAssignment[]
            > = {};

            for (const assignment of allPendingAssignments) {
              const lesson =
                assignment.lesson ??
                (assignment.lesson_id
                  ? await api.getLesson(assignment.lesson_id)
                  : null);
              if (!lesson || !lesson.subject_id) continue;

              const enriched = {
                ...assignment,
                lesson,
                subject_id: lesson.subject_id,
              };

              assignmentsWithSubject.push(enriched);

              if (!pendingBySubject[lesson.subject_id]) {
                pendingBySubject[lesson.subject_id] = [];
              }
              pendingBySubject[lesson.subject_id].push(enriched);
            }

            if (!assignmentsWithSubject.length) {
              const emptyPath: HomeworkPath = {
                path_id: uuidv4(),
                lessons: [],
                currentIndex: 0,
              };
              await saveHomeworkPath(student, emptyPath);
              pathData = emptyPath;
            } else {
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

              let completedCountBySubject: { [key: string]: number } = {};

              if (subjectsWithMaxPending.length > 1) {
                const completedCounts =
                  await api.getCompletedAssignmentsCountForSubjects(
                    student.id,
                    subjectsWithMaxPending,
                  );
                completedCountBySubject = Array.isArray(completedCounts)
                  ? completedCounts.reduce(
                      (acc, { subject_id, completed_count }) => {
                        acc[subject_id] = completed_count;
                        return acc;
                      },
                      {} as { [key: string]: number },
                    )
                  : {};
              }

              const selectedAssignments = Util.pickFiveHomeworkLessons(
                assignmentsWithSubject,
                completedCountBySubject,
              );

              const lessonsWithDetails = await Promise.all(
                selectedAssignments.map(async (assignment) => {
                  return await normalizeAssignment(assignment);
                }),
              );
              const playableLessons =
                filterPlayableHomeworkItems(lessonsWithDetails);

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
              try {
                const changedEvent = {
                  user_id: student.id,
                  new_path_id: newHomeworkPath.path_id,
                  new_course_id:
                    newHomeworkPath.lessons?.[0]?.course_id || null,
                  new_lesson_id:
                    newHomeworkPath.lessons?.[0]?.lesson_id || null,
                  new_chapter_id:
                    newHomeworkPath.lessons?.[0]?.chapter_id || null,
                  total_lessons_in_path: newHomeworkPath.lessons?.length || 0,
                  changed_at: new Date().toISOString(),
                  reason: subjectId
                    ? 'subject_changed'
                    : 'path_completed_rebuild',
                  subject_id: subjectId || null,
                };
                Util.logEvent(
                  EVENTS.HOMEWORK_PATHWAY_COURSE_CHANGED,
                  changedEvent,
                );
              } catch (err) {
                logger.error(
                  '[HomeworkPathway] Failed to log HOMEWORK_PATHWAY_CHANGED event',
                  err,
                );
              }

              pathData = newHomeworkPath;
            }
          }
        } else {
          // ⭐ SUBJECT-SPECIFIC path when dropdown is used
          pathData = await buildAndSaveInitialHomeworkPath(
            student,
            allPendingAssignments,
            effectiveSubjectId,
          );
        }
      }
    }

    // ---- From here on, we just use pathData (from cache OR built) ----
    if (!pathData) {
      clearPendingFinalHomeworkStickerFlow();
      setLoading(false);
      return;
    }

    if (
      (!pathData.lessons || pathData.lessons.length === 0) &&
      currentPendingAssignmentIds.length > 0 &&
      !hasPendingRewardTransition &&
      !hasPendingHomeworkStickerFlow()
    ) {
      if (effectiveSubjectId) {
        setSelectedSubject(null);
        activeSubjectRef.current = null;
        localStorage.removeItem(HOMEWORK_PATHWAY);
        await loadHomeworkPathway(ctx, student);
        return;
      }

      localStorage.removeItem(HOMEWORK_PATHWAY);
      setCurrentIndex(0);
      setBoxDetails(null);
      setIsHomeworkComplete(true);
      setLoading(false);
      return;
    }

    // 4️⃣ Set dropdown default subject when no filter
    if (pathData.lessons && pathData.lessons.length > 0) {
      const firstCourseId = String(pathData.lessons[0].course_id);
      activeSubjectRef.current = firstCourseId;
      if (!subjectId || selectedSubject == null) {
        setSelectedSubject(firstCourseId);
      }
    }

    // 5️⃣ Effective current index
    const effectiveCurrentIndex = pathData.currentIndex || 0;
    setCurrentIndex(effectiveCurrentIndex);

    if (isDropdownAlwaysEnabled) {
      setIsDropdownDisabled(false);
    } else {
      setIsDropdownDisabled(effectiveCurrentIndex > 0);
    }

    // 6️⃣ Award stars if path complete
    if (
      pathData.lessons &&
      pathData.lessons.length > 0 &&
      pathData.currentIndex >= pathData.lessons.length &&
      !hasPendingRewardTransition &&
      !hasPendingHomeworkStickerFlow()
    ) {
      localStorage.removeItem(HOMEWORK_PATHWAY);
    }

    // 7️⃣ Update chapter & lesson box info
    await syncBoxDetailsFromPath(pathData, subjectId);

    // 8️⃣ Notify structure to re-render
    setRefreshKey((prev: number) => prev + 1);
  } catch (error) {
    logger.error('Error in fetchHomeworkPathway:', error);
  } finally {
    setLoading(false);
  }
};
