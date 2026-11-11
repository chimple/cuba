import type { ReactElement } from 'react';
import { t } from 'i18next';
import Badge from '../../common/Badges/Badge';
import { BADGE_ROW_ID, DAILY_REWARD_ROW_ID } from '../../common/constants';
import type { ScoreCardProgressRowData } from './scoreCardTypes';

type ScoreCardProgressRowProps = {
  row: ScoreCardProgressRowData;
  groupIndex: number;
};

const ScoreCardProgressRow = ({
  row,
  groupIndex,
}: ScoreCardProgressRowProps): ReactElement => {
  const total = Number.isFinite(row.total) && row.total > 0 ? row.total : 1;
  const current = Number.isFinite(row.current)
    ? Math.min(Math.max(row.current, 0), total)
    : 0;
  const completed = Boolean(row.completed || current >= total);
  const isStaticCompletion =
    completed && !row.animateCompletion;
  const rowTypeClass = row.id === DAILY_REWARD_ROW_ID ? 'daily-reward' : row.id;
  const rowClassName = [
    'score-card-progress-row',
    `score-card-progress-row--${rowTypeClass}`,
    `score-card-progress-row--group-${groupIndex}`,
  ]
    .filter(Boolean)
    .join(' ');
  const checkClassName = `score-card-progress-check${
    isStaticCompletion ? ' score-card-progress-check--static' : ''
  }`;

  return (
    <div id={`score-card-progress-row--${row.id}`} className={rowClassName}>
      <div className="score-card-progress-label">{t(row.label)}</div>
      <div className="score-card-progress-icon-wrap">
        {row.id === BADGE_ROW_ID ? (
          <div
            className="score-card-progress-badge-fallback"
            aria-hidden="true"
          >
            <Badge number={row.badgeMilestone ?? 50} />
          </div>
        ) : row.iconSrc ? (
          <img className="score-card-progress-icon" src={row.iconSrc} alt="" />
        ) : (
          <span className="score-card-progress-fallback-icon" />
        )}
      </div>
      <div
        className="score-card-progress-track"
        role="progressbar"
        aria-label={`${t(row.label)} ${current}/${total}`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <svg
          className={`score-card-progress-fill${
            isStaticCompletion ? ' score-card-progress-fill--static' : ''
          }`}
          viewBox={`0 0 ${total} 1`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect width={current} height="1" rx="0" />
        </svg>
        <span className="score-card-progress-count">
          {current} / {total}
        </span>
      </div>
      {completed ? (
        <span className={checkClassName} aria-hidden="true">
          <svg
            className="score-card-progress-check-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              className="score-card-progress-check-path"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      ) : null}
    </div>
  );
};

export default ScoreCardProgressRow;
