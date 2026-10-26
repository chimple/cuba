import { EVENTS, CURRENT_STUDENT } from '../constants';
import { store } from '../../redux/store';
import { schoolUtil } from '../../utility/schoolUtil';
import { Util } from '../../utility/util';

export type BadgeAnalyticsProgress = {
  lessons_played_count: number;
  latest_badge_milestone: number;
  has_unseen_badge?: boolean;
};

export type BadgeAnalyticsExtra = Record<string, string | number | boolean>;

export const buildBadgeAnalyticsContext = (
  studentId: string,
  progress: BadgeAnalyticsProgress,
) => {
  // Keep badge events traceable across child profile, logged-in account, and class context.
  const state = store.getState();
  const currentClass = schoolUtil.getCurrentClass();
  const currentSchool = schoolUtil.getCurrentSchool();
  const currentStudentLanguage = (() => {
    try {
      const student = JSON.parse(
        localStorage.getItem(CURRENT_STUDENT) ?? '{}',
      ) as { language?: string; language_code?: string };
      return (
        student.language_code ??
        student.language ??
        localStorage.getItem('language') ??
        'en'
      );
    } catch {
      return localStorage.getItem('language') ?? 'en';
    }
  })();

  return {
    student_id: studentId,
    auth_user_id: state.auth.authUser?.id ?? state.auth.user?.id ?? null,
    school_id: currentSchool?.id ?? null,
    class_id: currentClass?.id ?? null,
    profile_language: currentStudentLanguage,
    lessons_played_count: progress.lessons_played_count,
    latest_badge_milestone: progress.latest_badge_milestone,
    total_badges_earned: progress.latest_badge_milestone / 50,
    has_unseen_badge: progress.has_unseen_badge ?? false,
  };
};

export const logBadgeEvent = async (
  event: EVENTS,
  studentId: string,
  progress: BadgeAnalyticsProgress,
  extra: BadgeAnalyticsExtra = {},
) => {
  await Util.logEvent(event, {
    ...buildBadgeAnalyticsContext(studentId, progress),
    ...extra,
  });
};
