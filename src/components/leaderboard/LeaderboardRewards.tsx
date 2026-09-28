import { FC, useEffect, useRef, useState } from 'react';
import { EVENTS } from '../../common/constants';
import { t } from 'i18next';
import './LeaderboardRewards.css';
import LessonCompletionRewards from './LessonCompletionRewards';
import LeaderboardBadges from './LeaderboardBadges';
import LeaderboardBonus from './LeaderboardBonus';
import LeaderboardSticker from './LeaderboardSticker';
import { logBadgeEvent } from '../../common/Badges/badgeAnalytics';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import logger from '../../utility/logger';
import { REWARDS_TABS } from '../../common/constants/rewardsPathway';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { clearBadgeProgress } from '../../redux/slices/badgeProgress/badgeProgressSlice';

type RewardsTab = (typeof REWARDS_TABS)[keyof typeof REWARDS_TABS];

const EMPTY_BADGE_PROGRESS = {
  lessons_played_count: 0,
  latest_badge_milestone: 0,
  has_unseen_badge: false,
};

const LeaderboardRewards: FC = () => {
  // Lesson completion is the default tab and the badge navigation target.
  const [activeTab, setActiveTab] = useState<RewardsTab>(
    REWARDS_TABS.LESSON_COMPLETION,
  );
  const student = Util.getCurrentStudent();
  const dispatch = useAppDispatch();
  const hasUnseenBadge = useAppSelector(
    (state) =>
      state.badgeProgress?.studentId === student?.id &&
      state.badgeProgress?.hasUnseenBadge === true,
  );
  const [progress, setProgress] = useState(EMPTY_BADGE_PROGRESS);
  const clearingBadgeStudentIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!student?.id) return;
    let mounted = true;
    void ServiceConfig.getI()
      .apiHandler.getUserBadgeProgress(student.id)
      .then((result) => {
        if (!mounted) return;
        const nextProgress = result
          ? {
              lessons_played_count: result.lessons_played_count,
              latest_badge_milestone: result.latest_badge_milestone,
              has_unseen_badge: Boolean(result.has_unseen_badge),
            }
          : EMPTY_BADGE_PROGRESS;
        setProgress(nextProgress);
        void logBadgeEvent(
          EVENTS.REWARDS_PAGE_VIEWED,
          student.id,
          nextProgress,
        );
      })
      .catch((error) => {
        if (!mounted) return;
        logger.error('Failed to load badge progress:', error);
        setProgress(EMPTY_BADGE_PROGRESS);
        void logBadgeEvent(
          EVENTS.REWARDS_PAGE_VIEWED,
          student.id,
          EMPTY_BADGE_PROGRESS,
        );
      });
    return () => {
      mounted = false;
    };
  }, [student?.id]);

  useEffect(() => {
    if (!student?.id || activeTab !== REWARDS_TABS.LESSON_COMPLETION) return;
    const clearUnseenBadge = async () => {
      if (
        !hasUnseenBadge ||
        clearingBadgeStudentIdsRef.current.has(student.id)
      ) {
        return;
      }
      // Prevent progress refreshes from issuing duplicate clear requests.
      clearingBadgeStudentIdsRef.current.add(student.id);
      try {
        await ServiceConfig.getI().apiHandler.markUserBadgeSeen(student.id);
        const clearedProgress = { ...progress, has_unseen_badge: false };
        setProgress(clearedProgress);
        dispatch(clearBadgeProgress(student.id));
        void logBadgeEvent(EVENTS.UNSEEN_BADGE_CLEARED, student.id, progress, {
          cleared_milestone: progress.latest_badge_milestone,
        });
      } catch (error) {
        logger.error('Failed to clear unseen badge:', error);
      } finally {
        clearingBadgeStudentIdsRef.current.delete(student.id);
      }
    };
    void clearUnseenBadge();
  }, [activeTab, dispatch, hasUnseenBadge, progress, student?.id]);

  const selectTab = (tab: RewardsTab) => {
    setActiveTab(tab);
    if (student?.id) {
      void logBadgeEvent(EVENTS.REWARDS_TAB_CLICKED, student.id, progress, {
        target_tab:
          tab === REWARDS_TABS.COMPETITIONS
            ? 'stickers'
            : 'lesson_completion_badges',
      });
    }
  };

  return (
    <div className="leaderboard-rewards-container">
      <div
        className="rewards-tab-switcher"
        role="tablist"
        aria-label="Reward types"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === REWARDS_TABS.LESSON_COMPLETION}
          className={
            activeTab === REWARDS_TABS.LESSON_COMPLETION ? 'active' : ''
          }
          onClick={() => selectTab(REWARDS_TABS.LESSON_COMPLETION)}
        >
          <img src="/assets/icons/Lesson Completion Icon.svg" alt="" />
          {t('Lesson Completion')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === REWARDS_TABS.COMPETITIONS}
          className={activeTab === REWARDS_TABS.COMPETITIONS ? 'active' : ''}
          onClick={() => selectTab(REWARDS_TABS.COMPETITIONS)}
        >
          <img src="/assets/icons/competition icon.svg" alt="" />
          {t('Competitions')}
        </button>
      </div>
      {activeTab === REWARDS_TABS.LESSON_COMPLETION ? (
        <LessonCompletionRewards studentId={student?.id} progress={progress} />
      ) : (
        <div className="competition-rewards-content">
          <LeaderboardSticker />
          <LeaderboardBadges />
          <LeaderboardBonus />
        </div>
      )}
    </div>
  );
};

export default LeaderboardRewards;
