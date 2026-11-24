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
  target_value?: number | string | null;
  start_date?: string | null;
  end_date?: string | null;
  lessons_completed_count?: number | string | null;
  lessons_target_count?: number | string | null;
  homework_lessons_completed_count?: number | string | null;
  homework_lessons_target_count?: number | string | null;
  homepage_lessons_completed_count?: number | string | null;
  homepage_lessons_target_count?: number | string | null;
  completion_percentage?: number | string | null;
  certificate_available?: number | boolean | null;
  rank_achieved?: number | string | null;
  status?: string | null;
  updated_at?: string | null;
};

type CompetitionRewardCardsProps = {
  rewards: CompetitionReward[];
};

const toNumber = (value: number | string | null | undefined) =>
  Number(value ?? 0);

const getLocalDateKey = (value = new Date()): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isOngoingReward = (reward: CompetitionReward) => {
  if (reward.end_date) {
    return reward.end_date.slice(0, 10) >= getLocalDateKey();
  }
  return reward.status === 'in_progress';
};

const hasCompletedLessons = (reward: CompetitionReward) =>
  toNumber(
    reward.lessons_completed_count ??
      reward.homework_lessons_completed_count ??
      reward.homepage_lessons_completed_count,
  ) > 0;

const isParticipationReward = (reward: CompetitionReward) =>
  !isOngoingReward(reward) &&
  hasCompletedLessons(reward) &&
  Boolean(Number(reward.certificate_available ?? 0)) &&
  toCompetitionCertificateRank(reward.rank_achieved) === null;

type CompetitionCertificateType = 1 | 2 | 3 | 'participation';

const getCertificateType = (
  reward: CompetitionReward | null | undefined,
): CompetitionCertificateType | null => {
  if (!reward) return null;
  return (
    toCompetitionCertificateRank(reward.rank_achieved) ??
    (isParticipationReward(reward) ? 'participation' : null)
  );
};

const isCompletedReward = (reward: CompetitionReward) =>
  !isOngoingReward(reward) &&
  hasCompletedLessons(reward) &&
  (toCompetitionCertificateRank(reward.rank_achieved) !== null ||
    isParticipationReward(reward));

const canShareCertificate = (reward: CompetitionReward) =>
  !isOngoingReward(reward) &&
  hasCompletedLessons(reward) &&
  getCertificateType(reward) !== null;
const formatDate = (value?: string | null, language = 'en') => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const locale = language.toLowerCase().split('-')[0];
  const parts = new Intl.DateTimeFormat(locale, {
    month: locale === 'en' ? 'short' : 'long',
    year: 'numeric',
  }).formatToParts(date);
  const month = parts.find((part) => part.type === 'month')?.value;
  const year = parts.find((part) => part.type === 'year')?.value;
  return month && year ? `${month} ${year}` : value;
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
  if (isParticipationReward(reward)) {
    return '/assets/campaignCompetition/Campaign participation t.svg';
  }
  return '/assets/campaignCompetition/Campaign progress t.svg';
};
const getCardClass = (reward: CompetitionReward) => {
  if (isOngoingReward(reward)) return 'competition-reward-card ongoing';
  if (isParticipationReward(reward)) {
    return 'competition-reward-card completed participation';
  }
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
  const { t, i18n } = useTranslation();
  const [selectedReward, setSelectedReward] =
    useState<CompetitionReward | null>(null);
  const [selectedCertificate, setSelectedCertificate] =
    useState<CompetitionReward | null>(null);
  const student = Util.getCurrentStudent();
  const ongoingRewards = rewards.filter(isOngoingReward);
  const completedRewards = rewards.filter(isCompletedReward);
  const selectedCertificateRank = getCertificateType(selectedCertificate);

  const renderCard = (reward: CompetitionReward) => (
    <article className={getCardClass(reward)} key={reward.campaign_id}>
      <h2>{reward.campaign_name}</h2>
      <p className="competition-reward-date">
        {reward.start_date && reward.end_date
          ? `${formatDate(reward.start_date, i18n?.language)} - ${formatDate(reward.end_date, i18n?.language)}`
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
            {t('competition_ongoing_title')}
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
            {t('competition_completed_title')}
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
      {selectedCertificate &&
        canShareCertificate(selectedCertificate) &&
        selectedCertificateRank !== null && (
          <CompetitionCertificateModal
            certificate={{
              campaignId: selectedCertificate.campaign_id,
              campaignName: selectedCertificate.campaign_name ?? '',
              studentName: student?.name ?? '',
              studentId: selectedCertificate.student_id ?? undefined,
              rank: selectedCertificateRank,
              campaignEndDate:
                selectedCertificate.end_date ??
                selectedCertificate.updated_at ??
                new Date().toISOString(),
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
