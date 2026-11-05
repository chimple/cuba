import { FC, useState } from 'react';
import { showCampaignCertificate } from '../campaignCertificate';
import { Util } from '../../utility/util';
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
  if (reward.status === 'completed') {
    return '/assets/campaignCompetition/Campaign participation t.svg';
  }
  return '/assets/campaignCompetition/Campaign progress t.svg';
};

const getCardClass = (reward: CompetitionReward) => {
  const rank = toNumber(reward.rank_achieved);
  if (reward.status !== 'won') return 'competition-reward-card ongoing';
  return `competition-reward-card completed rank-${rank || 3}`;
};

const isWinner = (reward: CompetitionReward) =>
  reward.status === 'won' && toNumber(reward.rank_achieved) === 1;

const CompetitionRewardInfoModal: FC<{
  reward: CompetitionReward;
  onClose: () => void;
}> = ({ reward, onClose }) => {
  const completed = toNumber(reward.lessons_completed_count);
  const target = toNumber(reward.lessons_target_count);
  const percentage = Math.round(toNumber(reward.completion_percentage));
  const rank = toNumber(reward.rank_achieved);
  const progressRows = [
    {
      key: 'homework',
      label: 'HW page lessons Completed',
      completed: toNumber(reward.homework_lessons_completed_count),
      target: toNumber(reward.homework_lessons_target_count),
      icon: '/assets/icons/homework_icon.svg',
    },
    {
      key: 'homepage',
      label: 'Home page lessons Completed',
      completed: toNumber(reward.homepage_lessons_completed_count),
      target: toNumber(reward.homepage_lessons_target_count),
      icon: '/assets/icons/home_icon.svg',
    },
  ].filter((row) => row.target > 0);

  return (
    <div
      className="competition-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="competition-info-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Competition details"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="competition-modal-close"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
        <h2>{reward.campaign_name}</h2>
        <p className="competition-modal-date">
          {reward.start_date && reward.end_date
            ? `${formatDate(reward.start_date)} - ${formatDate(reward.end_date)}`
            : ''}
        </p>
        {progressRows.length > 0 ? (
          <div className="competition-modal-progress-list">
            {progressRows.map((row) => {
              const progress = Math.min(
                100,
                row.target > 0 ? (row.completed / row.target) * 100 : 0,
              );

              return (
                <div
                  className={`competition-modal-progress-row ${row.key}`}
                  key={row.key}
                >
                  <img src={row.icon} alt="" />
                  <div>
                    <p>{row.label}</p>
                    <div className="competition-modal-progress-track">
                      <span style={{ width: `${progress}%` }} />
                      <strong>
                        {row.completed} / {row.target}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="competition-modal-progress">
            {completed} / {target} lessons completed
          </p>
        )}
        <p className="competition-modal-percentage">{percentage}% complete</p>
        {reward.status && reward.status !== 'in_progress' && (
          <p className="competition-modal-status">
            {reward.status === 'won' ? 'Won' : reward.status}
          </p>
        )}
        {rank > 0 && <p className="competition-modal-rank">Rank {rank}</p>}
      </div>
    </div>
  );
};

const CompetitionRewardCards: FC<CompetitionRewardCardsProps> = ({
  rewards,
}) => {
  const [selectedReward, setSelectedReward] =
    useState<CompetitionReward | null>(null);
  const ongoingRewards = rewards.filter(
    (reward) => reward.status === 'in_progress',
  );
  const completedRewards = rewards.filter(
    (reward) => reward.status !== 'in_progress',
  );

  const renderCard = (reward: CompetitionReward) => (
    <article className={getCardClass(reward)} key={reward.campaign_id}>
      <h2>{reward.campaign_name}</h2>
      <p className="competition-reward-date">
        {reward.start_date && reward.end_date
          ? `${formatDate(reward.start_date)} - ${formatDate(reward.end_date)}`
          : ''}
      </p>
      {reward.status === 'in_progress' && (
        <p className="competition-reward-description">
          Play & Win! Competition is ongoing.
        </p>
      )}
      <img
        className="competition-reward-artwork"
        src={getArtwork(reward)}
        alt=""
      />
      <div className="competition-reward-footer">
        {reward.status !== 'in_progress' && (
          <p>{reward.status === 'won' ? 'Won' : reward.status}</p>
        )}
        {isWinner(reward) ? (
          <button
            type="button"
            className="competition-reward-action-button share"
            aria-label="Share competition certificate"
            onClick={() => {
              const student = Util.getCurrentStudent();
              showCampaignCertificate({
                campaignId: reward.campaign_id,
                campaignName: reward.campaign_name ?? '',
                studentName: student?.name ?? '',
                studentId: reward.student_id ?? undefined,
                rank: 1,
                awardedAt: reward.updated_at ?? new Date().toISOString(),
                languageCode: localStorage.getItem('language') ?? 'en',
                isNewlyEarned: false,
              });
            }}
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
            onClick={() => setSelectedReward(reward)}
          >
            <img src="/assets/icons/infoIcon.svg" alt="" aria-hidden="true" />
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
    </div>
  );
};

export default CompetitionRewardCards;
