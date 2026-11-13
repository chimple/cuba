import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import './TeacherScoreDetails.css';

export type TeacherScoreDay = { date: string; score: number };

interface TeacherScoreDetailsProps {
  /** Score calculated for the current rolling seven-day window. */
  currentScore: number;
  /** Daily scores returned by the configured local or Supabase API. */
  scoreHistory?: TeacherScoreDay[];
  /** Dismisses the score-details dialog. */
  onClose: () => void;
}

const dayLabel = (date: string) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
    new Date(`${date}T12:00:00`),
  );

const dateLabel = (date: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
    new Date(`${date}T12:00:00`),
  );

const lastSevenDates = () =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });

const displayScore = (score: number) => Math.round(score);

const TeacherScoreDetails = ({
  currentScore,
  scoreHistory = [],
  onClose,
}: TeacherScoreDetailsProps) => {
  const { t } = useTranslation();
  const roundedCurrentScore = displayScore(currentScore);
  const byDate = new Map(
    scoreHistory.map((item) => [item.date.slice(0, 10), item.score]),
  );
  const days = lastSevenDates().map((date) => ({
    date,
    // Keeps the chart stable while a source has no score for a particular day.
    score: displayScore(byDate.get(date) ?? roundedCurrentScore),
  }));
  const previousScore = days[days.length - 2].score;
  const change = roundedCurrentScore - previousScore;
  const range =
    Math.max(...days.map((day) => day.score)) -
    Math.min(...days.map((day) => day.score));
  const min = Math.min(...days.map((day) => day.score));
  const point = (score: number, index: number) => {
    const x = 20 + index * 43;
    const y = range ? 113 - ((score - min) / range) * 67 : 80;
    return `${x},${y}`;
  };
  const message =
    change < 0
      ? t(
          'Your score has decreased by {{points}} points. Motivate students to move into the green band and climb the leaderboard!',
          { points: Math.abs(change) },
        )
      : change > 0
        ? t(
            'Your score has increased by {{points}} points. Keep it up! Motivate your students to stay strong on the leaderboard!',
            { points: change },
          )
        : t(
            'Your score is unchanged from yesterday. Move students to the yellow band to climb up the leaderboard.',
          );

  return (
    <div
      className="teacher-score-details-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="teacher-score-details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-score-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="teacher-score-details__header">
          <h2 id="teacher-score-details-title">{t('Your Score')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={String(t('Close score details'))}
            className="teacher-score-details__close"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="teacher-score-details__chart-card">
          <strong>
            {t('Your Score today is {{points}} points', {
              points: roundedCurrentScore,
            })}
          </strong>
          <svg
            className="teacher-score-details__chart"
            viewBox="0 0 298 164"
            role="img"
            aria-label={String(t('Your score over the last 7 days'))}
          >
            <polyline
              points={days
                .map((day, index) => point(day.score, index))
                .join(' ')}
              fill="none"
              stroke="#7655aa"
              strokeWidth="1"
            />
            {days.map((day, index) => {
              const [x, y] = point(day.score, index).split(',');
              const dailyChange = index ? day.score - days[index - 1].score : 0;
              const isToday = index === days.length - 1;
              return (
                <g key={day.date}>
                  <line
                    x1={x}
                    x2={x}
                    y1={Number(y) + 10}
                    y2="132"
                    stroke="#c6a4ff"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={x}
                    y={Number(y) - 16}
                    textAnchor="middle"
                    className={
                      dailyChange < 0
                        ? 'teacher-score-details__down'
                        : 'teacher-score-details__up'
                    }
                  >
                    {index ? (
                      <>
                        <tspan>{Math.abs(dailyChange)}</tspan>
                        <tspan className="teacher-score-details__trend-arrow">
                          {dailyChange > 0 ? '⬆' : dailyChange < 0 ? '⬇' : '–'}
                        </tspan>
                      </>
                    ) : null}
                  </text>
                  <circle cx={x} cy={y} r="4.5" fill="#7655aa" />
                  <text
                    x={x}
                    y={Number(y) + 18}
                    textAnchor="middle"
                    className="teacher-score-details__value"
                  >
                    {day.score}
                  </text>
                  <text
                    x={x}
                    y="146"
                    textAnchor="middle"
                    className="teacher-score-details__date"
                  >
                    {dateLabel(day.date)}
                  </text>
                  {isToday && (
                    <rect
                      data-testid="teacher-score-details-today-marker"
                      x={Number(x) - 19}
                      y="149"
                      width="38"
                      height="13"
                      rx="2"
                      className="teacher-score-details__today-marker"
                    />
                  )}
                  <text
                    x={x}
                    y="158"
                    textAnchor="middle"
                    className={`teacher-score-details__weekday ${
                      isToday ? 'teacher-score-details__weekday--today' : ''
                    }`}
                  >
                    {isToday ? t('Today') : dayLabel(day.date)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="teacher-score-details__message">
          {message}
          {change !== 0 && ' 👍'}
        </p>
      </section>
    </div>
  );
};

export default TeacherScoreDetails;
