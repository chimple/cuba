import React from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { CalendarRow } from '../streakPage.types';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type StreakCalendarSectionProps = {
  monthTitle: string;
  calendarRows: CalendarRow[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

const StreakCalendarSection: React.FC<StreakCalendarSectionProps> = ({
  monthTitle,
  calendarRows,
  onPreviousMonth,
  onNextMonth,
}) => {
  return (
    <>
      <div className="streak-month-row">
        <h2 className="streak-month-title">{monthTitle}</h2>
        <div className="streak-month-nav">
          <button
            type="button"
            className="streak-month-btn"
            aria-label="Previous month"
            onClick={onPreviousMonth}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className="streak-month-btn"
            aria-label="Next month"
            onClick={onNextMonth}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="streak-weekdays">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`${label}-${index}`} className="streak-weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="streak-calendar">
        {calendarRows.map((row, rowIndex) => {
          const firstDayIndex = row.days.findIndex((c) => c.day !== null);
          const revIndex = [...row.days]
            .reverse()
            .findIndex((c) => c.day !== null);
          const lastDayIndex = revIndex !== -1 ? 6 - revIndex : -1;
          const hasTrackableDay = row.days.some(
            (c) => c.day !== null && !c.future,
          );

          const columnPercent = 100 / 7;
          const leftPercent =
            firstDayIndex !== -1 ? (firstDayIndex + 0.5) * columnPercent : 0;
          const rightPercent =
            lastDayIndex !== -1 ? (6.5 - lastDayIndex) * columnPercent : 0;

          return (
            <div
              key={`row-${rowIndex}`}
              className={`streak-calendar-row ${row.trackColor ? `track-${row.trackColor}` : ''}`}
            >
              {row.trackColor && firstDayIndex !== -1 && hasTrackableDay && (
                <div
                  className="streak-row-track"
                  style={{
                    left: `calc(${leftPercent}% - var(--streak-day-radius) - var(--streak-track-overhang))`,
                    right: `calc(${rightPercent}% - var(--streak-day-radius) - var(--streak-track-overhang))`,
                  }}
                />
              )}
              {row.days.map((cell, dayIndex) => {
                if (cell.day === null) {
                  return (
                    <div
                      key={`empty-${rowIndex}-${dayIndex}`}
                      className="streak-day-empty"
                    />
                  );
                }

                const dayClass = cell.future
                  ? 'future'
                  : cell.assigned
                    ? 'assigned'
                    : cell.today
                      ? 'muted'
                      : 'unassigned';
                const showMissedCross =
                  !cell.assigned && !cell.future && !cell.today;

                return (
                  <button
                    key={`day-${cell.day}`}
                    type="button"
                    className={`streak-day ${dayClass}`}
                    disabled={cell.future}
                  >
                    <span className="streak-day-number">{cell.day}</span>
                    {showMissedCross && (
                      <span className="streak-day-cross" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default StreakCalendarSection;
