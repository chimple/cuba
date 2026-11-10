import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EVENTS } from '../../common/constants';
import { Util } from '../../utility/util';
import { buildCampaignAnalyticsContext } from '../campaignCertificate/campaignCertificateAnalytics';
import CompetitionCertificateModal, {
  toCompetitionCertificateRank,
} from './CompetitionCertificateModal';
import CompetitionRewardInfoModal from './CompetitionRewardInfoModal';
import './CompetitionRewardCards.css';

export type CompetitionReward = {
  campaign_id: string;
  student_id?: string | null;
  campaign_name?: string | null;
  objective?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  lessons_completed_count?: number | string | null;
  lessons_target_count?: number | string | null;
  homework_lessons_completed_count?: number | string | null;
  homework_lessons_target_count?: number | string | null;
  homepage_lessons_completed_count?: number | string | null;
  homepage_lessons_target_count?: number | string | null;
  completion_percentage?: number | string | null;
  rank_achieved?: number | string | null;
  status?: string | null;
  updated_at?: string | null;
};

type CompetitionRewardCardsProps = {
  rewards: CompetitionReward[];
};

const toNumber = (value: number | string | null | undefined) =>
  Number(value ?? 0);

const isOngoingReward = (reward: CompetitionReward) => {
  // The campaign timeline is authoritative. An in-progress status must not
  // keep an expired campaign in the ongoing section after its end date.
  if (reward.end_date) {
    const end = new Date(reward.end_date).getTime();
    if (Number.isFinite(end)) return end >= Date.now();
  }
  return reward.status === 'in_progress';
};

const isCompletedReward = (reward: CompetitionReward) =>
  !isOngoingReward(reward);

const hasCompletedLessons = (reward: CompetitionReward) =>
  toNumber(
    reward.lessons_completed_count ??
      reward.homework_lessons_completed_count ??
      reward.homepage_lessons_completed_count,
  ) > 0;

// Every ended campaign has a certificate. Ranked campaigns use their rank
// artwork; campaigns without a rank use the participation artwork.
const canShareCertificate = (reward: CompetitionReward) =>
  !isOngoingReward(reward);

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
};

const getArtwork = (reward: CompetitionReward) => {
  if (isOngoingReward(reward)) {
    return '/assets/campaignCompetition/Campaign progress t.svg';
  }
  const rank = toNumber(reward.rank_achieved);
  if (reward.status === 'won' && rank === 1) {
    return '/assets/campaignCompetition/Campaign rank1 t2.svg';
  }
  if (reward.status === 'won' && rank === 2) {
    return '/assets/campaignCompetition/Campaign rank2 t2.svg';
  }
  if (reward.status === 'won' && rank === 3) {
    return '/assets/campaignCompetition/Campaign rank3 t.svg';
  }
  return '/assets/campaignCompetition/Campaign participation t.svg';
};

const getCardClass = (reward: CompetitionReward) => {
  if (isOngoingReward(reward)) return 'competition-reward-card ongoing';
  const rank = toNumber(reward.rank_achieved);
  return `competition-reward-card completed rank-${rank || 3}`;
};

const getCompletionMessage = (
  reward: CompetitionReward,
  translate: (key: string) => string,
) => {
  const rank = toNumber(reward.rank_achieved);
  if (rank === 1) return translate('competition_rank_first');
  if (rank === 2) return translate('competition_rank_second');
  if (rank === 3) return translate('competition_rank_third');
  return translate('competition_great_job');
};

const CompetitionRewardCards: FC<CompetitionRewardCardsProps> = ({
  rewards,
}) => {
  const { t } = useTranslation();
  const [selectedReward, setSelectedReward] =
    useState<CompetitionReward | null>(null);
  const [selectedCertificate, setSelectedCertificate] =
    useState<CompetitionReward | null>(null);
  const student = Util.getCurrentStudent();
  const ongoingRewards = rewards.filter(isOngoingReward);
  const completedRewards = rewards.filter(
    (reward) => isCompletedReward(reward) && hasCompletedLessons(reward),
  );

  const renderCard = (reward: CompetitionReward) => (
    <article className={getCardClass(reward)} key={reward.campaign_id}>
      <h2>{reward.campaign_name}</h2>
      <p className="competition-reward-date">
        {reward.start_date && reward.end_date
          ? `${formatDate(reward.start_date)} - ${formatDate(reward.end_date)}`
          : ''}
      </p>
      {isOngoingReward(reward) && (
        <p className="competition-reward-description">
          {t('competition_ongoing')}
        </p>
      )}
      {!isOngoingReward(reward) && (
        <p className="competition-reward-completion-message">
          {getCompletionMessage(reward, t)}
        </p>
      )}
      <img
        className="competition-reward-artwork"
        src={getArtwork(reward)}
        alt=""
      />
      <div className="competition-reward-footer">
        {!isOngoingReward(reward) && (
          <button
            type="button"
            className="competition-reward-action-button"
            aria-label="Competition information"
            onClick={() => {
              void Util.logEvent(EVENTS.COMPETITION_INFO_CLICKED, {
                ...buildCampaignAnalyticsContext(reward.student_id ?? ''),
                campaign_id: reward.campaign_id,
                campaign_status: isOngoingReward(reward)
                  ? 'ongoing'
                  : 'completed',
              });
              setSelectedReward(reward);
            }}
          >
            <img
              src="/assets/icons/info button icon.svg"
              alt=""
              aria-hidden="true"
            />
          </button>
        )}
        {canShareCertificate(reward) ? (
          <button
            type="button"
            className="competition-reward-action-button share"
            aria-label="Share competition reward"
            onClick={() => setSelectedCertificate(reward)}
          >
            <img
              src="/assets/icons/share button icon.svg"
              alt=""
              aria-hidden="true"
            />
          </button>
        ) : (
          <button
            type="button"
            className="competition-reward-action-button"
            aria-label="Competition information"
            onClick={() => {
              void Util.logEvent(EVENTS.COMPETITION_INFO_CLICKED, {
                ...buildCampaignAnalyticsContext(reward.student_id ?? ''),
                campaign_id: reward.campaign_id,
                campaign_status: isOngoingReward(reward)
                  ? 'ongoing'
                  : 'completed',
              });
              setSelectedReward(reward);
            }}
          >
            <img
              src="/assets/icons/info button icon.svg"
              alt=""
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </article>
  );

  return (
    <div className="competition-rewards-page">
      {ongoingRewards.length > 0 && (
        <section aria-labelledby="ongoing-competitions-title">
          <h1
            id="ongoing-competitions-title"
            className="competition-section-title"
          >
            Ongoing Competitions
          </h1>
          <div className="competition-ongoing-list">
            {ongoingRewards.map(renderCard)}
          </div>
        </section>
      )}
      {completedRewards.length > 0 && (
        <section aria-labelledby="completed-competitions-title">
          <h1
            id="completed-competitions-title"
            className="competition-section-title"
          >
            Completed Competitions
          </h1>
          <div className="competition-completed-grid">
            {completedRewards.map(renderCard)}
          </div>
        </section>
      )}
      {selectedReward && (
        <CompetitionRewardInfoModal
          reward={selectedReward}
          onClose={() => setSelectedReward(null)}
        />
      )}
      {selectedCertificate && (
        <CompetitionCertificateModal
          certificate={{
            campaignId: selectedCertificate.campaign_id,
            campaignName: selectedCertificate.campaign_name ?? '',
            studentName: student?.name ?? '',
            studentId: selectedCertificate.student_id ?? undefined,
            rank: toCompetitionCertificateRank(
              selectedCertificate.rank_achieved,
              selectedCertificate.status,
              selectedCertificate.end_date,
            ),
            awardedAt:
              selectedCertificate.updated_at ?? new Date().toISOString(),
            languageCode: localStorage.getItem('language') ?? 'en',
            isNewlyEarned: false,
          }}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
};

export default CompetitionRewardCards;
