import React from 'react';
import { t } from 'i18next';

export type ScoreCardProgressRowData = {
  id: 'dailyReward' | 'sticker';
  label: string;
  current: number;
  total: number;
  iconSrc?: string;
  iconAlt?: string;
  completed?: boolean;
  animateCompletion?: boolean;
};

type ScoreCardProgressRowsProps = {
  rows?: ScoreCardProgressRowData[];
};

type ProgressRowRenderState = {
  total: number;
  current: number;
  fillPercent: number;
  completed: boolean;
  rowIndexClass: string;
  fillProgressClass: string;
  fillStaticClass: string;
  rowCompletedClass: string;
  checkClassName: string;
};

const getProgressRowRenderState = (
  row: ScoreCardProgressRowData,
  index: number,
): ProgressRowRenderState => {
  const total = Math.max(row.total, 1);
  const current = Math.min(Math.max(row.current, 0), total);
  const fillPercent = Math.min(Math.max((current / total) * 100, 0), 100);
  const completed = row.completed || current >= total;
  const shouldSkipCompletionAnimation =
    completed && current === total && !row.animateCompletion;

  return {
    total,
    current,
    fillPercent,
    completed,
    rowIndexClass: `score-card-progress-row--index-${index}`,
    fillProgressClass: `score-card-progress-fill--${current}-of-${total}`,
    fillStaticClass: shouldSkipCompletionAnimation
      ? ' score-card-progress-fill--static'
      : '',
    rowCompletedClass:
      shouldSkipCompletionAnimation && current < total
        ? ' score-card-progress-row--completed'
        : '',
    checkClassName: `score-card-progress-check${
      shouldSkipCompletionAnimation ? ' score-card-progress-check--static' : ''
    }`,
  };
};

const renderCompletedCheck = (completed: boolean, checkClassName: string) =>
  completed ? (
    <span className={checkClassName} aria-label="Completed">
      <svg
        className="score-card-progress-check-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path className="score-card-progress-check-path" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  ) : null;

const ScoreCardProgressRows: React.FC<ScoreCardProgressRowsProps> = ({
  rows = [],
}) => {
  if (!rows.length) return null;

  return (
    <div id="score-card-progress-list" className="score-card-progress-list">
      {rows.map((row, index) => {
        const {
          total,
          current,
          fillPercent,
          completed,
          rowIndexClass,
          fillProgressClass,
          fillStaticClass,
          rowCompletedClass,
          checkClassName,
        } = getProgressRowRenderState(row, index);
        const rowClassName = `score-card-progress-row score-card-progress-row--${row.id} ${rowIndexClass}${rowCompletedClass}`;
        const fillClassName = `score-card-progress-fill ${fillProgressClass}${fillStaticClass}`;
        const label = t(row.label);

        if (row.id === 'dailyReward') {
          return (
            <div
              id="score-card-progress-row--dailyReward"
              className={rowClassName}
              key={row.id}
            >
              <div
                id="score-card-progress-icon-wrap--dailyReward"
                className="score-card-progress-icon-wrap"
              >
                {row.iconSrc ? (
                  <img
                    className="score-card-progress-icon"
                    src={row.iconSrc}
                    alt={row.iconAlt ?? ''}
                  />
                ) : (
                  <span className="score-card-progress-fallback-icon" />
                )}
              </div>
              <div
                id="score-card-progress-label--dailyReward"
                className="score-card-progress-label"
              >
                {label}
              </div>
              <div
                id="score-card-progress-track--dailyReward"
                className="score-card-progress-track"
                aria-label={`${label} ${current}/${total}`}
              >
                <div
                  id="score-card-progress-fill--dailyReward"
                  className={fillClassName}
                  style={{ width: fillPercent + '%' }}
                />
              </div>
              <div
                id="score-card-progress-count--dailyReward"
                className="score-card-progress-count"
              >
                {current} / {total}
              </div>
              {renderCompletedCheck(completed, checkClassName)}
            </div>
          );
        }

        return (
          <div
            id="score-card-progress-row--sticker"
            className={rowClassName}
            key={row.id}
          >
            <div
              id="score-card-progress-icon-wrap--sticker"
              className="score-card-progress-icon-wrap"
            >
              {row.iconSrc ? (
                <img
                  className="score-card-progress-icon"
                  src={row.iconSrc}
                  alt={row.iconAlt ?? ''}
                />
              ) : (
                <span className="score-card-progress-fallback-icon" />
              )}
            </div>
            <div
              id="score-card-progress-label--sticker"
              className="score-card-progress-label"
            >
              {label}
            </div>
            <div
              id="score-card-progress-track--sticker"
              className="score-card-progress-track"
              aria-label={`${label} ${current}/${total}`}
            >
              <div
                id="score-card-progress-fill--sticker"
                className={fillClassName}
                style={{ width: fillPercent + '%' }}
              />
            </div>
            <div
              id="score-card-progress-count--sticker"
              className="score-card-progress-count"
            >
              {current} / {total}
            </div>
            {renderCompletedCheck(completed, checkClassName)}
          </div>
        );
      })}
    </div>
  );
};

export default ScoreCardProgressRows;
