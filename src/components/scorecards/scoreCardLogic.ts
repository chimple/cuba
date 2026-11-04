import {
  DAILY_REWARD_ROW_ID,
  SOURCE,
} from '../../common/constants';
import type { TableTypes } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import { SqliteApi } from '../../services/api/SqliteApi';
import { Util } from '../../utility/util';
import type {
  PathwayGoalAssignment,
  ScoreCardProgressContext,
  ScoreCardProgressRowData,
} from './scoreCardTypes';
import {
  buildDailyRewardRow,
  hasDailyRewardEarnedToday,
  shouldAnimateDailyRewardRow,
} from './scoreCardDailyReward';
import { buildStickerRow } from './scoreCardStickerProgress';
import { buildCampaignRow } from './scoreCardCampaignProgress';
import { buildBadgeRow } from './scoreCardBadgeProgress';
import type { BuildScoreCardProgressRowsParams } from './scoreCardTypes';

export type { ScoreCardProgressRowData } from './ScoreCardProgressRows';
export type { ScoreCardLogicApi } from './scoreCardTypes';

export const resolveScoreCardStudent = async (): Promise<{
  student: TableTypes<'user'> | undefined;
  studentId: string | undefined;
}> => {
  const currentUser = await ServiceConfig.getI()?.authHandler?.getCurrentUser();
  const student = Util.getCurrentStudent() ?? currentUser;
  return { student, studentId: student?.id ?? currentUser?.id };
};

export const makeGoalLookupKey = (
  context?: ScoreCardProgressContext,
): string => JSON.stringify(context ?? {});

export const isPathwayResult = (source?: string): boolean =>
  (source?.includes('learning_pathway') ?? false) ||
  source === SOURCE.INITIAL_ASSESSMENT;

const resolvePathwayAssignments = async (
  assignments?: PathwayGoalAssignment[],
): Promise<PathwayGoalAssignment[] | undefined> => {
  if (!assignments?.length) return assignments;

  const needsLocalDetails = assignments.some(
    (assignment) =>
      assignment.assignmentId &&
      assignment.source == null &&
      assignment.campaignId == null,
  );
  if (!needsLocalDetails) return assignments;

  try {
    const assignmentIds = Array.from(
      new Set(
        assignments
          .map((assignment) => assignment.assignmentId)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const localAssignments = await SqliteApi.getI().getAssignmentsByIds(
      assignmentIds,
    );
    const assignmentsById = new Map(
      localAssignments.map((assignment) => [assignment.id, assignment]),
    );

    return assignments.map((assignment) => {
      const localAssignment = assignment.assignmentId
        ? assignmentsById.get(assignment.assignmentId)
        : undefined;
      return {
        ...assignment,
        source: assignment.source ?? localAssignment?.source,
        campaignId: assignment.campaignId ?? localAssignment?.campaign_id,
        lessonId: assignment.lessonId ?? localAssignment?.lesson_id,
      };
    });
  } catch {
    return assignments;
  }
};

export const applyGoalOverrides = (
  goals: ScoreCardProgressRowData[],
  nonPathwayOverride: boolean,
): ScoreCardProgressRowData[] =>
  nonPathwayOverride
    ? goals.filter((goal) => goal.id === DAILY_REWARD_ROW_ID)
    : goals;

export const buildScoreCardProgressRows = async ({
  api,
  student,
  studentId,
  completedCourseId,
  completedLessonId,
  completedAssignmentId,
  completedHomeworkIndex,
  animateDailyReward = false,
  showDailyReward = true,
  showStickerProgress = true,
  showNewPathwayGoals = false,
  countCompletedLessonTowardStickerProgress = true,
  allowZeroStickerProgress = false,
  stickerProgressCurrentOverride,
  pathwayAssignments,
  badgeProgressSnapshot,
  badgeMilestoneReached,
}: BuildScoreCardProgressRowsParams): Promise<ScoreCardProgressRowData[]> => {
  const resolvedPathwayAssignments =
    await resolvePathwayAssignments(pathwayAssignments);
  const stickerRow = await buildStickerRow({
    api,
    student,
    studentId,
    completedCourseId,
    completedLessonId,
    completedAssignmentId,
    completedHomeworkIndex,
    showStickerProgress,
    countCompletedLessonTowardStickerProgress,
    allowZeroStickerProgress,
    stickerProgressCurrentOverride,
    pathwayAssignments: resolvedPathwayAssignments,
  });

  const shouldAnimateDailyReward =
    showDailyReward &&
    shouldAnimateDailyRewardRow(student, studentId, animateDailyReward);
  const dailyRewardEarned = hasDailyRewardEarnedToday(student);
  const dailyRewardRow = showDailyReward
    ? buildDailyRewardRow(dailyRewardEarned, shouldAnimateDailyReward)
    : null;
  const [campaignRow, badgeRow] = showNewPathwayGoals
    ? await Promise.all([
        buildCampaignRow(
          studentId,
          completedCourseId,
          resolvedPathwayAssignments
            ? resolvedPathwayAssignments
            .map((assignment) => assignment.assignmentId)
            .filter((id): id is string => Boolean(id))
            : [],
        ),
        buildBadgeRow(
          api,
          studentId,
          completedLessonId,
          badgeProgressSnapshot,
          badgeMilestoneReached,
        ),
      ])
    : [null, null];

  // Keep the Figma row slots stable when a daily, sticker, campaign, or badge goal is inactive.
  return [dailyRewardRow, stickerRow, campaignRow, badgeRow].filter(
    (row): row is ScoreCardProgressRowData => Boolean(row),
  );
};
