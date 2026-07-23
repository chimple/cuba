import type { Dispatch, RefObject, SetStateAction } from 'react';
import { Toast } from '@capacitor/toast';
import { v4 as uuidv4 } from 'uuid';
import type { TFunction } from 'i18next';
import {
  ASSIGNMENT_TYPE,
  AssignmentSource,
  TableTypes,
} from '../../../../common/constants';
import {
  getStreakTargetRect,
  triggerStreakRewardPulse,
} from '../../../../common/streakRewardBridge';
import { ServiceConfig } from '../../../../services/ServiceConfig';
import { Util } from '../../../../utility/util';
import logger from '../../../../utility/logger';
import { TeacherAssignmentPageType } from './TeacherAssignment';
import type {
  AssignmentLookup,
  GroupWiseStudents,
  RewardAnimationState,
  SelectedAssignments,
} from '../../../hooks/useCreateSelectedAssignment';

type ServiceConfigInstance = ReturnType<typeof ServiceConfig.getI>;

interface CreateAssignmentsForStudentsDependencies {
  FIRST_ASSIGNMENT_REWARD: number;
  SUBSEQUENT_ASSIGNMENT_REWARD: number;
  REWARD_INDICATOR_DELAY_MS: number;
  REWARD_FLIGHT_DURATION_MS: number;
  FLAME_PULSE_DURATION_MS: number;
  STREAK_LANDING_LEFT_OFFSET_PX: number;
  REWARD_INDICATOR_EDGE_PADDING_PX: number;
  allSelected: boolean;
  api: ServiceConfigInstance['apiHandler'];
  assignButtonRef: RefObject<HTMLButtonElement | null>;
  auth: ServiceConfigInstance['authHandler'];
  endDate: string;
  getSelectedStudentList: (studentsMap: GroupWiseStudents) => string[];
  groupWiseStudents: GroupWiseStudents;
  isAssigning: boolean;
  manualAssignments: AssignmentLookup;
  recommendedAssignments: AssignmentLookup;
  rewardIndicatorRef: RefObject<HTMLDivElement | null>;
  selectedAssignments: SelectedAssignments;
  setAssignmentBatchId: (batchId: string) => void;
  setIsAssigning: (isAssigning: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setRewardAnimation: Dispatch<SetStateAction<RewardAnimationState>>;
  setShowConfirm: (showConfirm: boolean) => void;
  startDate: string;
  t: TFunction;
}

export const createAssignmentsForStudentsWithDependencies = async ({
  FIRST_ASSIGNMENT_REWARD,
  SUBSEQUENT_ASSIGNMENT_REWARD,
  REWARD_INDICATOR_DELAY_MS,
  REWARD_FLIGHT_DURATION_MS,
  FLAME_PULSE_DURATION_MS,
  STREAK_LANDING_LEFT_OFFSET_PX,
  REWARD_INDICATOR_EDGE_PADDING_PX,
  allSelected,
  api,
  assignButtonRef,
  auth,
  endDate,
  getSelectedStudentList,
  groupWiseStudents,
  isAssigning,
  manualAssignments,
  recommendedAssignments,
  rewardIndicatorRef,
  selectedAssignments,
  setAssignmentBatchId,
  setIsAssigning,
  setIsLoading,
  setRewardAnimation,
  setShowConfirm,
  startDate,
  t,
}: CreateAssignmentsForStudentsDependencies) => {

    if (isAssigning) {
      return;
    }
    const studentList = getSelectedStudentList(groupWiseStudents);
    if (studentList.length <= 0) {
      await Toast.show({
        text: t('Please select the Students') || '',
        duration: 'long',
      });
      return;
    }
    setIsAssigning(true);

    const batchId = uuidv4();
    setAssignmentBatchId(batchId);

    const pause = (ms: number) =>
      new Promise((resolve) => window.setTimeout(resolve, ms));

    const getRewardForAssignment = async (
      classId: string,
      schoolId: string,
    ): Promise<{
      rewardValue: number;
      streakIncrement: number;
    }> => {
      try {
        const currentUser = await auth.getCurrentUser();
        const userId = currentUser?.id;

        if (!userId) {
          return {
            rewardValue: SUBSEQUENT_ASSIGNMENT_REWARD,
            streakIncrement: 0,
          };
        }

        const today = new Date();
        const mondayOffset = (today.getDay() + 6) % 7;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - mondayOffset);
        weekStart.setHours(0, 0, 0, 0);

        const { batchGroups: weekBatchRows } =
          await api.getAssignmentDateRangeDataForClassAndSchool(
            userId,
            weekStart.toISOString(),
            today.toISOString(),
          );
        const currentStreak =
          (await api.getCoinAndStreakCount(userId, classId, schoolId))
            ?.streak ?? 0;

        const isFirstAssignmentOrWeek = weekBatchRows.length <= 0;
        const shouldIncrementStreak =
          isFirstAssignmentOrWeek || currentStreak <= 0;

        return {
          rewardValue: isFirstAssignmentOrWeek
            ? FIRST_ASSIGNMENT_REWARD
            : SUBSEQUENT_ASSIGNMENT_REWARD,
          streakIncrement: shouldIncrementStreak ? 1 : 0,
        };
      } catch (error) {
        logger.error('Error calculating weekly assignment reward:', error);
        return {
          rewardValue: SUBSEQUENT_ASSIGNMENT_REWARD,
          streakIncrement: 0,
        };
      }
    };

    const animateStreakFlame = async () => {
      const didTriggerPulse = triggerStreakRewardPulse();
      if (!didTriggerPulse) {
        return;
      }

      await pause(FLAME_PULSE_DURATION_MS);
    };

    const animateRewardToStreak = async (rewardValue: number) => {
      const assignButton = assignButtonRef.current;
      if (!assignButton) {
        return;
      }

      const assignRect = assignButton.getBoundingClientRect();
      const startX = assignRect.left + assignRect.width / 2 - 22;
      const startY = assignRect.top - 14;

      setRewardAnimation({
        visible: true,
        label: `+${rewardValue}`,
        x: startX,
        y: startY,
        deltaX: 0,
        deltaY: 0,
        isFlying: false,
      });

      await pause(REWARD_INDICATOR_DELAY_MS);

      const streakRect = getStreakTargetRect();
      if (!streakRect) {
        await pause(450);
        setRewardAnimation((prev) => ({ ...prev, visible: false }));
        return;
      }

      const rewardRect = rewardIndicatorRef.current?.getBoundingClientRect();
      const viewportWidth = Math.min(
        window.innerWidth,
        window.visualViewport?.width ?? window.innerWidth,
        document.documentElement.clientWidth || window.innerWidth,
      );
      const targetX = Math.max(
        REWARD_INDICATOR_EDGE_PADDING_PX,
        Math.min(
          streakRect.left +
            streakRect.width / 2 -
            STREAK_LANDING_LEFT_OFFSET_PX,
          viewportWidth -
            (rewardRect?.width ?? 66) -
            REWARD_INDICATOR_EDGE_PADDING_PX,
        ),
      );
      const deltaX = targetX - startX;
      const deltaY = streakRect.top + streakRect.height / 2 - startY;

      setRewardAnimation((prev) => ({
        ...prev,
        deltaX,
        deltaY,
        isFlying: true,
      }));

      await pause(REWARD_FLIGHT_DURATION_MS);
      setRewardAnimation((prev) => ({ ...prev, visible: false }));
      await animateStreakFlame();
    };

    // Step 1: Update assignment cart immediately to remove assigned lessons from UI
    (async () => {
      try {
        const current_class = await Util.getCurrentClass();
        const currUser = await auth.getCurrentUser();

        // Guard clases for missing data
        if (!currUser || !current_class) {
          logger.error('Current user or class not round');
          setIsLoading(false);
          return;
        }
        const previous_sync_lesson = currUser?.id
          ? await api.getUserAssignmentCart(currUser?.id)
          : null;
        const all_sync_lesson: Map<string, string> = new Map(
          previous_sync_lesson?.lessons
            ? Object.entries(JSON.parse(previous_sync_lesson.lessons))
            : [],
        );
        const sync_lesson_data = all_sync_lesson.get(current_class?.id ?? '');
        let sync_lesson: Map<string, Record<string, string[]>> = new Map(
          sync_lesson_data ? Object.entries(JSON.parse(sync_lesson_data)) : [],
        );

        // Remove lessons from sync_lesson in memory immediately
        for (const type of Object.keys(selectedAssignments)) {
          for (const subjectId of Object.keys(selectedAssignments[type])) {
            const subjectData = selectedAssignments[type][subjectId];
            if (
              !subjectData ||
              subjectId === 'count' ||
              !Array.isArray(subjectData.count)
            ) {
              continue;
            }

            for (const lessonId of subjectData.count) {
              for (const [chapterId, sourceMap] of sync_lesson.entries()) {
                Object.keys(sourceMap).forEach((key) => {
                  if (sourceMap[key]?.includes(lessonId)) {
                    sourceMap[key] = sourceMap[key].filter(
                      (id) => id !== lessonId,
                    );
                  }
                });
                sync_lesson.set(chapterId, sourceMap);
              }
            }
          }
        }

        // Update assignment cart immediately (async)
        const _selectedLesson = JSON.stringify(Object.fromEntries(sync_lesson));
        all_sync_lesson.set(current_class?.id ?? '', _selectedLesson);
        const _totalSelectedLesson = JSON.stringify(
          Object.fromEntries(all_sync_lesson),
        );
        api.createOrUpdateAssignmentCart(currUser?.id, _totalSelectedLesson);
      } catch (error) {
        logger.error('Error updating assignment cart:', error);
      }
    })();

    // Step 2: Run actual assignment creation in background
    (async () => {
      try {
        const current_class = await Util.getCurrentClass();
        const currUser = await auth.getCurrentUser();
        if (!currUser || !current_class) return;

        const classTeachers =
          (await api.getTeachersForClass(current_class.id)) ?? [];
        const isTeacherAssigner = classTeachers.some(
          (teacher) => teacher.id === currUser.id,
        );
        let rewardValue = SUBSEQUENT_ASSIGNMENT_REWARD;
        let streakIncrement = 0;
        if (isTeacherAssigner) {
          // Calculate reward berore creating this batch, so the current
          // assignment is not included in "this week's" existing count.
          const reward = await getRewardForAssignment(
            current_class.id,
            current_class.school_id,
          );
          rewardValue = reward.rewardValue;
          streakIncrement = reward.streakIncrement;
        }

        const previous_sync_lesson = currUser?.id
          ? await api.getUserAssignmentCart(currUser?.id)
          : null;
        const all_sync_lesson: Map<string, string> = new Map(
          previous_sync_lesson?.lessons
            ? Object.entries(JSON.parse(previous_sync_lesson.lessons))
            : [],
        );
        const sync_lesson_data = all_sync_lesson.get(current_class?.id ?? '');
        let sync_lesson: Map<string, Record<string, string[]>> = new Map(
          sync_lesson_data ? Object.entries(JSON.parse(sync_lesson_data)) : [],
        );

        // ✅ Build reverse lookup: lessonId → chapterId
        const lessonToChapterMap = new Map<string, string>();
        for (const [chapterId, sourceMap] of sync_lesson.entries()) {
          for (const lessonIds of Object.values(sourceMap)) {
            for (const lessonId of lessonIds) {
              lessonToChapterMap.set(lessonId, chapterId);
            }
          }
        }

        // Iterate through assignment types (manual/recommended)
        for (const type of Object.keys(selectedAssignments)) {
          for (const subjectId of Object.keys(selectedAssignments[type])) {
            const subjectData = selectedAssignments[type][subjectId];

            if (
              !subjectData ||
              subjectId === 'count' ||
              !Array.isArray(subjectData.count)
            ) {
              continue;
            }

            const tempLessons =
              type === TeacherAssignmentPageType.MANUAL
                ? (manualAssignments[subjectId]?.lessons ?? [])
                : (recommendedAssignments[subjectId]?.lessons ?? []);

            if (!tempLessons.length) {
              logger.warn(`No lessons found for subjectId ${subjectId}`);
              continue;
            }
            // Process lessons asynchronously in parallel
            const lessonIds = subjectData.count;
            await Promise.all(
              lessonIds.map(async (lessonId: string, idx: number) => {
                const tempLes = tempLessons.find(
                  (les: TableTypes<'lesson'> & { source?: string | null }) =>
                    les.id === lessonId,
                );
                if (!tempLes) {
                  logger.warn(`Lesson not found for lessonId: ${lessonId}`);
                  return;
                }

                const tempChapterId =
                  tempLes?.source === AssignmentSource.RECOMMENDED
                    ? await api.getChapterByLesson(tempLes.id, current_class.id)
                    : (lessonToChapterMap.get(lessonId) ??
                      (await api.getChapterByLesson(
                        tempLes.id,
                        current_class.id,
                      )));
                if (!tempChapterId) {
                  logger.warn(`Chapter not found for lessonId: ${lessonId}`);
                  return;
                }
                // ✨ MODIFICATION: Create a staggered timestamp for ordering
                const createdAt = new Date(
                  Date.now() - idx * 100,
                ).toISOString();

                // 🌟 Determine Source (manual, qr_code, recommended)
                let source: string | null = null;

                const chapterSourceMap =
                  sync_lesson.get(tempChapterId as string) ?? {};

                if (
                  chapterSourceMap[AssignmentSource.MANUAL]?.includes(lessonId)
                ) {
                  source = AssignmentSource.MANUAL;
                } else if (
                  chapterSourceMap[AssignmentSource.QR_CODE]?.includes(lessonId)
                ) {
                  source = AssignmentSource.QR_CODE;
                } else if (tempLes?.source === AssignmentSource.QR_CODE) {
                  source = AssignmentSource.QR_CODE;
                } else if (tempLes?.source === AssignmentSource.RECOMMENDED) {
                  source = AssignmentSource.RECOMMENDED;
                } else if (type === TeacherAssignmentPageType.MANUAL) {
                  source = AssignmentSource.MANUAL;
                }
                await api.createAssignment(
                  studentList,
                  currUser.id,
                  startDate,
                  endDate,
                  allSelected,
                  current_class.id,
                  current_class.school_id,
                  lessonId,
                  tempChapterId.toString(),
                  subjectId,
                  tempLes.plugin_type === ASSIGNMENT_TYPE.LIVEQUIZ
                    ? ASSIGNMENT_TYPE.LIVEQUIZ
                    : ASSIGNMENT_TYPE.ASSIGNMENT,
                  batchId,
                  source,
                  createdAt,
                );

                // ❌ Remove lesson from sync_lesson under correct source
                if (source && chapterSourceMap[source]) {
                  chapterSourceMap[source] = chapterSourceMap[source].filter(
                    (id) => id !== lessonId,
                  );
                  sync_lesson.set(tempChapterId as string, chapterSourceMap);
                }
              }),
            );
          }
        }
        // Remove any keys other than manual and qr_code from each chapter's source map
        for (const [chapterId, sourceMap] of sync_lesson.entries()) {
          Object.keys(sourceMap).forEach((key) => {
            if (
              key !== AssignmentSource.MANUAL &&
              key !== AssignmentSource.QR_CODE
            ) {
              delete sourceMap[key];
            }
          });
          sync_lesson.set(chapterId, sourceMap);
        }
        const _selectedLesson = JSON.stringify(Object.fromEntries(sync_lesson));
        all_sync_lesson.set(current_class?.id ?? '', _selectedLesson);
        const _totalSelectedLesson = JSON.stringify(
          Object.fromEntries(all_sync_lesson),
        );

        await api.createOrUpdateAssignmentCart(
          currUser?.id,
          _totalSelectedLesson,
        );

        if (isTeacherAssigner) {
          try {
            await api.updateCoins(
              currUser.id,
              current_class.school_id,
              current_class.id,
              rewardValue,
              streakIncrement,
            );
          } catch (coinError) {
            logger.error(
              'Error updating coins after assignment creation:',
              coinError,
            );
          }
          await animateRewardToStreak(rewardValue);
        }
        setShowConfirm(true);
      } catch (error) {
        logger.error('Error creating assignments in background:', error);
        await Toast.show({
          text: t('Something Went wrong') || '',
          duration: 'long',
        });
      } finally {
        setIsAssigning(false);
      }
    })();
};
