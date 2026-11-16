import { FC, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { EVENTS } from '../../common/constants';
import { t } from 'i18next';
import './LeaderboardRewards.css';
import LessonCompletionRewards from './LessonCompletionRewards';
import CompetitionRewardCards from './CompetitionRewardCards';
import type { CompetitionReward } from './CompetitionRewardCards';
import { logBadgeEvent } from '../../common/Badges/badgeAnalytics';
import { ServiceConfig } from '../../services/ServiceConfig';
import { SqliteApi } from '../../services/api/SqliteApi';
import { Util } from '../../utility/util';
import logger from '../../utility/logger';
import { REWARDS_TABS } from '../../common/constants/rewardsPathway';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { clearBadgeProgress } from '../../redux/slices/badgeProgress/badgeProgressSlice';
import {
  clearUnseenCertificate,
  setCampaignRewardsState,
} from '../../redux/slices/campaignRewards/campaignRewardsSlice';
import { TRACKABLE_IDS, getTrackableProps } from '../../analytics/trackable';

type RewardsTab = (typeof REWARDS_TABS)[keyof typeof REWARDS_TABS];
const EMPTY_BADGE_PROGRESS = {
  lessons_played_count: 0,
  latest_badge_milestone: 0,
  has_unseen_badge: false,
};
const getRewardsTabFromSearch = (search: string): RewardsTab =>
  new URLSearchParams(search).get('rewards') === REWARDS_TABS.COMPETITIONS
    ? REWARDS_TABS.COMPETITIONS
    : REWARDS_TABS.LESSON_COMPLETION;

const LeaderboardRewards: FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<RewardsTab>(() =>
    getRewardsTabFromSearch(location.search),
  );
  const student = Util.getCurrentStudent();
  const dispatch = useAppDispatch();
  const hasUnseenCertificate = useAppSelector(
    (state) =>
      state.campaignRewards?.studentId === student?.id &&
      state.campaignRewards?.hasUnseenCertificate === true,
  );
  const [unseenCertificateCampaignId, setUnseenCertificateCampaignId] =
    useState<string | undefined>();
  const hasUnseenBadge = useAppSelector(
    (state) =>
      state.badgeProgress?.studentId === student?.id &&
      state.badgeProgress?.hasUnseenBadge === true,
  );
  const [progress, setProgress] = useState(EMPTY_BADGE_PROGRESS);
  const [competitionRewards, setCompetitionRewards] = useState<
    CompetitionReward[]
  >([]);
  const [isProgressLoading, setIsProgressLoading] = useState(
    Boolean(student?.id),
  );
  const clearingBadgeStudentIdsRef = useRef(new Set<string>());
  const clearingCertificateStudentIdsRef = useRef(new Set<string>());
  useEffect(() => {
    setActiveTab(getRewardsTabFromSearch(location.search));
  }, [location.search]);

  useEffect(() => {
    if (!student?.id) return;
    const api = ServiceConfig.getI().apiHandler;
    if (!api.getCampaignCertificateIndicator) return;
    void api
      .getCampaignCertificateIndicator(student.id)
      .then((indicator) => {
        setUnseenCertificateCampaignId(indicator.campaignId);
        dispatch(
          setCampaignRewardsState({
            studentId: student.id,
            hasUnseenCertificate: indicator.hasUnseenCertificate,
          }),
        );
      })
      .catch((error) =>
        logger.error('Failed to load unseen campaign certificate:', error),
      );
  }, [dispatch, student?.id]);

  useEffect(() => {
    if (!student?.id) {
      setIsProgressLoading(false);
      return;
    }
    setIsProgressLoading(true);
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
      })
      .finally(() => {
        if (mounted) setIsProgressLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [student?.id]);

  useEffect(() => {
    if (
      !student?.id ||
      isProgressLoading ||
      activeTab !== REWARDS_TABS.LESSON_COMPLETION
    ) {
      return;
    }
    const clearUnseenBadge = async () => {
      if (
        !hasUnseenBadge ||
        clearingBadgeStudentIdsRef.current.has(student.id)
      ) {
        return;
      }
      clearingBadgeStudentIdsRef.current.add(student.id);
      try {
        await ServiceConfig.getI().apiHandler.markUserBadgeSeen(student.id);
        setProgress((currentProgress) => ({
          ...currentProgress,
          has_unseen_badge: false,
        }));
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
  }, [
    activeTab,
    dispatch,
    hasUnseenBadge,
    isProgressLoading,
    progress,
    student?.id,
  ]);

  useEffect(() => {
    if (!student?.id || activeTab !== REWARDS_TABS.COMPETITIONS) return;

    let mounted = true;
    setCompetitionRewards([]);
    const loadRewards = async () => {
      const api = SqliteApi.getI();
      try {
        await api.syncCampaignRewards(student.id);
      } catch (error) {
        logger.error(
          'Failed to sync competition rewards; using local cache:',
          error,
        );
      }
      try {
        const rewards = await api.getCachedCampaignRewards(student.id);
        if (!mounted) return;
        setCompetitionRewards(rewards as CompetitionReward[]);
        void logBadgeEvent(EVENTS.REWARDS_TAB_CLICKED, student.id, progress, {
          target_tab: 'competitions',
          number_of_competitions: rewards.length,
        });
      } catch (error) {
        if (mounted) setCompetitionRewards([]);
        logger.error('Failed to load competition rewards:', error);
      }
    };
    void loadRewards();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, student?.id]);

  useEffect(() => {
    if (
      !student?.id ||
      !hasUnseenCertificate ||
      activeTab !== REWARDS_TABS.COMPETITIONS ||
      clearingCertificateStudentIdsRef.current.has(student.id)
    ) {
      return;
    }
    const api = ServiceConfig.getI().apiHandler;
    if (!api.markCampaignCertificatesSeen) return;
    clearingCertificateStudentIdsRef.current.add(student.id);
    void api
      .markCampaignCertificatesSeen(student.id)
      .then(() => {
        dispatch(clearUnseenCertificate(student.id));
        void Util.logEvent(EVENTS.UNSEEN_CERTIFICATE_CLEARED, {
          student_id: student.id,
          language: student.language_id ?? 'en',
          cleared_campaign_id: unseenCertificateCampaignId ?? '',
        });
      })
      .catch((error) =>
        logger.error('Failed to clear unseen campaign certificate:', error),
      )
      .finally(() => {
        clearingCertificateStudentIdsRef.current.delete(student.id);
      });
  }, [
    activeTab,
    dispatch,
    hasUnseenCertificate,
    student?.id,
    student?.language_id,
    unseenCertificateCampaignId,
  ]);

  const selectTab = (tab: RewardsTab) => {
    setActiveTab(tab);
    if (student?.id && tab !== REWARDS_TABS.COMPETITIONS) {
      void logBadgeEvent(EVENTS.REWARDS_TAB_CLICKED, student.id, progress, {
        target_tab: 'lesson_completion_badges',
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
          {...getTrackableProps(TRACKABLE_IDS.REWARDS_TAB_ACHIEVEMENTS)}
        >
          <img src="/assets/icons/Lesson Completion Icon.svg" alt="" />
          {t('Achievements')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === REWARDS_TABS.COMPETITIONS}
          className={activeTab === REWARDS_TABS.COMPETITIONS ? 'active' : ''}
          onClick={() => selectTab(REWARDS_TABS.COMPETITIONS)}
          {...getTrackableProps(TRACKABLE_IDS.REWARDS_TAB_COMPETITIONS)}
        >
          <img src="/assets/icons/competition icon.svg" alt="" />
          {t('Competitions')}
        </button>
      </div>
      {activeTab === REWARDS_TABS.LESSON_COMPLETION && isProgressLoading ? (
        <div
          className="lesson-completion-rewards-loading"
          data-testid="lesson-rewards-loading"
          aria-busy="true"
        />
      ) : activeTab === REWARDS_TABS.LESSON_COMPLETION ? (
        <LessonCompletionRewards studentId={student?.id} progress={progress} />
      ) : (
        <CompetitionRewardCards rewards={competitionRewards} />
      )}
    </div>
  );
};

export default LeaderboardRewards;
