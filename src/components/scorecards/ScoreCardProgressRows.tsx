import { useEffect } from 'react';
import type { ReactElement } from 'react';
import ScoreCardProgressRow from './ScoreCardProgressRow';
import type { ScoreCardProgressRowData } from './scoreCardTypes';

export type { ScoreCardProgressRowData } from './scoreCardTypes';

const PROGRESS_FILL_AUDIO_URL =
  '/assets/audios/common/generic_sound_effect.mp3';
const GOAL_TICK_AUDIO_URL =
  '/assets/audios/common/generic_popup_sound_effect.mp3';
const SOUND_CUES = [
  { at: 1500, isTick: false },
  { at: 2120, isTick: true },
  { at: 3000, isTick: false },
  { at: 3620, isTick: true },
] as const;

type ScoreCardProgressRowsProps = {
  rows?: ScoreCardProgressRowData[];
};

const hasAnimatedFill = (rows: ScoreCardProgressRowData[]): boolean =>
  rows.some(
    (row) =>
      row.current > 0 && !(row.completed && !row.animateCompletion),
  );

const hasAnimatedTick = (rows: ScoreCardProgressRowData[]): boolean =>
  rows.some((row) => row.completed && row.animateCompletion);

const ScoreCardProgressRows = ({
  rows = [],
}: ScoreCardProgressRowsProps): ReactElement | null => {
  const groups = [rows.slice(0, 2), rows.slice(2, 4)];

  useEffect(() => {
    if (!rows.length) return;

    const fillAudio = new Audio(PROGRESS_FILL_AUDIO_URL);
    const tickAudio = new Audio(GOAL_TICK_AUDIO_URL);
    fillAudio.preload = 'auto';
    tickAudio.preload = 'auto';
    fillAudio.volume = 0.5;
    tickAudio.volume = 0.5;
    const timers = SOUND_CUES.map(({ at, isTick }) =>
      window.setTimeout(() => {
        const cueRows = groups[at < 2500 ? 0 : 1];
        if (isTick ? hasAnimatedTick(cueRows) : hasAnimatedFill(cueRows)) {
          const audio = isTick ? tickAudio : fillAudio;
          audio.currentTime = 0;
          void audio.play().catch(() => undefined);
        }
      }, at),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      fillAudio.pause();
      tickAudio.pause();
    };
  }, [rows]);

  if (!rows.length) return null;

  return (
    <div
      id="score-card-goal-progress-list"
      className="score-card-goal-progress-list"
    >
      {groups.map((groupRows, groupIndex) =>
        groupRows.length ? (
          <div
            className={`score-card-progress-row-group${
              groupRows.length === 1
                ? ' score-card-progress-row-group--single'
                : ''
            }`}
            key={`group-${groupIndex}`}
          >
            {groupRows.map((row) => (
              <ScoreCardProgressRow
                key={row.id}
                row={row}
                groupIndex={groupIndex}
              />
            ))}
          </div>
        ) : null,
      )}
    </div>
  );
};

export default ScoreCardProgressRows;
