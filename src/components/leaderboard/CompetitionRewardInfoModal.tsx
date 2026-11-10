import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { CompetitionReward } from './CompetitionRewardCards';

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

const CompetitionRewardInfoModal: FC<{
  reward: CompetitionReward;
  onClose: () => void;
}> = ({ reward, onClose }) => {
  const { t } = useTranslation();
  const completed = toNumber(reward.lessons_completed_count);
  const target = toNumber(reward.lessons_target_count);
  const isHomepageCampaign =
    reward.objective === 'homepage_learning_pathway_campaign';
  const progressRows = [
    isHomepageCampaign
      ? {
          key: 'homepage',
          label: t('competition_homepage_lessons_completed'),
          completed:
            reward.homepage_lessons_completed_count ??
            reward.lessons_completed_count,
          target:
            reward.homepage_lessons_target_count ?? reward.lessons_target_count,
          icon: '/assets/campaignCompetition/competition-homepage-progress.svg',
        }
      : {
          key: 'homework',
          label: t('competition_homework_lessons_completed'),
          completed:
            reward.homework_lessons_completed_count ??
            reward.lessons_completed_count,
          target:
            reward.homework_lessons_target_count ?? reward.lessons_target_count,
          icon: '/assets/campaignCompetition/competition-homework-progress.svg',
        },
  ].filter((row) => toNumber(row.target) > 0);

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
          <img
            src="/assets/campaignCompetition/Competition close button.svg"
            alt=""
            aria-hidden="true"
          />
        </button>
        <h2>{reward.campaign_name}</h2>
        <p className="competition-modal-date">
          {reward.start_date && reward.end_date
            ? `${formatDate(reward.start_date)} - ${formatDate(reward.end_date)}`
            : ''}
        </p>
        <p className="competition-modal-progress-heading">
          {t('competition_progress_title')}
        </p>
        {progressRows.length > 0 ? (
          <div className="competition-modal-progress-list">
            {progressRows.map((row) => {
              const rowCompleted = toNumber(row.completed);
              const rowTarget = toNumber(row.target);
              const progress = Math.min(
                100,
                rowTarget > 0 ? (rowCompleted / rowTarget) * 100 : 0,
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
            {completed} / {target} {t('competition_lessons_completed')}
          </p>
        )}
      </div>
    </div>
  );
};

export default CompetitionRewardInfoModal;
