import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  BuildScoreCardProgressRowsParams,
  ScoreCardProgressContext,
  ScoreCardProgressRowData,
} from '../components/scorecards/scoreCardTypes';
import {
  applyGoalOverrides,
  buildScoreCardProgressRows,
  isPathwayResult,
  makeGoalLookupKey,
  resolveScoreCardStudent,
} from '../components/scorecards/scoreCardLogic';
import { EVENTS } from '../common/constants';
import type { TableTypes } from '../common/constants';
import { PENDING_BADGE_MILESTONE_KEY } from '../common/Badges/badgeProgress';
import { logBadgeEvent } from '../common/Badges/badgeAnalytics';
import type { BadgeAnalyticsProgress } from '../common/Badges/badgeAnalytics';
import { setBadgeProgress } from '../redux/slices/badgeProgress/badgeProgressSlice';
import { store } from '../redux/store';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import logger from '../utility/logger';
import { hasDailyRewardEarnedToday } from '../components/scorecards/scoreCardDailyReward';

const EMPTY_GOALS: ScoreCardProgressRowData[] = [];

type UsePostLessonGoalsOptions = {
  shouldLoad: boolean;
  progressRows?: ScoreCardProgressRowData[];
  progressContext?: ScoreCardProgressContext;
};
export const usePostLessonGoals = ({
  shouldLoad,
  progressRows,
  progressContext,
}: UsePostLessonGoalsOptions) => {
  // Apply source rules before the badge counter or any goal data is written.
  const [loadedGoals, setLoadedGoals] =
    useState<ScoreCardProgressRowData[]>(EMPTY_GOALS);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const loadedKeyRef = useRef<string | null>(null);
  const badgeCompletionKeyRef = useRef<string | null>(null);
  const isLegacyScoreCard = progressContext?.source === undefined;
  const nonPathwayOverride =
    !isLegacyScoreCard && !isPathwayResult(progressContext?.source);
  const hasProvidedGoals = Boolean(progressRows?.length);
  const lookupKey = `${Util.getCurrentStudent()?.id ?? ''}|${makeGoalLookupKey(progressContext)}`;
  const completedCourseId = progressContext?.completedCourseId;
  const completedLessonId = progressContext?.completedLessonId;
  const completedHomeworkIndex = progressContext?.completedHomeworkIndex;
  const animateDailyReward = progressContext?.animateDailyReward;
  const showDailyRewardGoal = progressContext?.showDailyReward;
  const showStickerProgress = progressContext?.showStickerProgress;
  const countStickerProgress =
    progressContext?.countCompletedLessonTowardStickerProgress;
  const allowZeroStickerProgress = progressContext?.allowZeroStickerProgress;
  const stickerProgressCurrentOverride =
    progressContext?.stickerProgressCurrentOverride;
  const pathwayAssignments = progressContext?.pathwayAssignments;
  const completedAssignmentId = progressContext?.completedAssignmentId;
  const shouldLoadGoals = shouldLoad && !hasProvidedGoals;

  useEffect(() => {
    let isCancelled = false;

    const loadGoals = async (): Promise<void> => {
      if (!shouldLoadGoals || loadedKeyRef.current === lookupKey) return;

      setIsLoadingRows(true);
      try {
        const { student, studentId } = await resolveScoreCardStudent();
        const api = ServiceConfig.getI()?.apiHandler;
        if (!api) return;

        const showPathwayGoals =
          !nonPathwayOverride && showStickerProgress !== false;
        const showNewPathwayGoals =
          showPathwayGoals && !isLegacyScoreCard;
        const dailyRewardEarned = hasDailyRewardEarnedToday(student);
        const showDailyReward =
          dailyRewardEarned ||
          (showDailyRewardGoal === true &&
            (await Util.shouldGiveDailyReward()));

        let badgeProgressSnapshot:
          | TableTypes<'user_badge_progress'>
          | undefined;
        let badgeMilestoneReached: number | null = null;
        if (studentId && completedLessonId && showNewPathwayGoals) {
          const completionKey = `${studentId}:${completedLessonId}:${completedAssignmentId ?? completedHomeworkIndex ?? ''}`;
          try {
            if (badgeCompletionKeyRef.current !== completionKey) {
              badgeCompletionKeyRef.current = completionKey;
              const result = await api.recordBadgeLessonCompletion(studentId);
              badgeProgressSnapshot = result.progress;
              badgeMilestoneReached = result.milestoneReached;
              store.dispatch(
                setBadgeProgress({
                  studentId,
                  hasUnseenBadge: Boolean(result.progress.has_unseen_badge),
                }),
              );
              if (result.milestoneReached !== null) {
                const badgeProgress = result.progress as BadgeAnalyticsProgress;
                void logBadgeEvent(
                  EVENTS.BADGE_MILESTONE_REACHED,
                  studentId,
                  badgeProgress,
                  { milestone_awarded: result.milestoneReached },
                );
                sessionStorage.setItem(
                  PENDING_BADGE_MILESTONE_KEY,
                  JSON.stringify({
                    milestone: result.milestoneReached,
                    studentId,
                    progress: badgeProgress,
                  }),
                );
              }
            } else {
              badgeProgressSnapshot = await api.getUserBadgeProgress(studentId);
            }
          } catch (error) {
            logger.warn('Badge progress update skipped:', error);
          }
        }

        const params: BuildScoreCardProgressRowsParams = {
          api,
          student,
          studentId,
          completedCourseId,
          completedLessonId,
          completedAssignmentId,
          completedHomeworkIndex,
          animateDailyReward,
          showDailyReward,
          showStickerProgress: showPathwayGoals,
          showNewPathwayGoals,
          countCompletedLessonTowardStickerProgress: countStickerProgress,
          allowZeroStickerProgress,
          stickerProgressCurrentOverride,
          pathwayAssignments,
          badgeProgressSnapshot,
          badgeMilestoneReached,
        };
        const goals = await buildScoreCardProgressRows(params);
        if (!isCancelled) setLoadedGoals(goals);
      } catch {
        // Keep the scorecard actionable if a reward source is unavailable.
      } finally {
        if (!isCancelled) {
          loadedKeyRef.current = lookupKey;
          setIsLoadingRows(false);
        }
      }
    };

    void loadGoals();
    return () => {
      isCancelled = true;
    };
  }, [
    lookupKey,
    nonPathwayOverride,
    isLegacyScoreCard,
    completedCourseId,
    completedLessonId,
    completedHomeworkIndex,
    animateDailyReward,
    showDailyRewardGoal,
    showStickerProgress,
    countStickerProgress,
    allowZeroStickerProgress,
    stickerProgressCurrentOverride,
    pathwayAssignments,
    completedAssignmentId,
    shouldLoadGoals,
  ]);

  const sourceGoals = hasProvidedGoals
    ? (progressRows ?? EMPTY_GOALS)
    : loadedGoals;
  const goals = useMemo(
    () =>
      applyGoalOverrides(
        sourceGoals,
        nonPathwayOverride,
      ),
    [sourceGoals, nonPathwayOverride],
  );

  return {
    goals,
    isLoadingRows,
    isPending: shouldLoadGoals && loadedKeyRef.current !== lookupKey,
    nonPathwayOverride,
  };
};
