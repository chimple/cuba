export const BADGE_MILESTONE_STEP = 50;
export const LAST_BADGE_MILESTONE = 3000;
export const PENDING_BADGE_MILESTONE_KEY = 'pending_badge_milestone';

export type BadgeProgress = {
  lessons_played_count: number;
  latest_badge_milestone: number;
};

export const getBadgeMilestone = (lessonCount: number): number | null => {
  if (
    !Number.isInteger(lessonCount) ||
    lessonCount <= 0 ||
    lessonCount > LAST_BADGE_MILESTONE ||
    lessonCount % BADGE_MILESTONE_STEP !== 0
  ) {
    return null;
  }
  return lessonCount;
};

export const nextBadgeProgress = (
  progress?: Partial<BadgeProgress> | null,
): { progress: BadgeProgress; milestoneReached: number | null } => {
  const lessonsPlayed = Math.max(0, progress?.lessons_played_count ?? 0) + 1;
  const milestoneReached = getBadgeMilestone(lessonsPlayed);
  return {
    progress: {
      lessons_played_count: lessonsPlayed,
      latest_badge_milestone:
        milestoneReached ?? progress?.latest_badge_milestone ?? 0,
    },
    milestoneReached,
  };
};
