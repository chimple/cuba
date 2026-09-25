import { FC, useEffect, useState } from 'react';
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

type RewardsTab = 'lesson_completion_badges' | 'competitions';

const EMPTY_BADGE_PROGRESS = {
  lessons_played_count: 0,
  latest_badge_milestone: 0,
  has_unseen_badge: false,
};

const LeaderboardRewards: FC = () => {
  const [activeTab, setActiveTab] = useState<RewardsTab>(
    'lesson_completion_badges',
  );
  const student = Util.getCurrentStudent();
  const [progress, setProgress] = useState(EMPTY_BADGE_PROGRESS);

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

  const selectTab = (tab: RewardsTab) => {
    setActiveTab(tab);
    if (student?.id) {
      void logBadgeEvent(EVENTS.REWARDS_TAB_CLICKED, student.id, progress, {
        target_tab: tab === 'competitions' ? 'stickers' : tab,
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
          aria-selected={activeTab === 'lesson_completion_badges'}
          className={activeTab === 'lesson_completion_badges' ? 'active' : ''}
          onClick={() => selectTab('lesson_completion_badges')}
        >
          <img src="/assets/icons/Lesson Completion Icon.svg" alt="" />
          {t('Lesson Completion')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'competitions'}
          className={activeTab === 'competitions' ? 'active' : ''}
          onClick={() => selectTab('competitions')}
        >
          <img src="/assets/icons/competition icon.svg" alt="" />
          {t('Competitions')}
        </button>
      </div>
      {activeTab === 'lesson_completion_badges' ? (
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
