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
        {calendarRows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className={`streak-calendar-row ${row.trackColor ? `track-${row.trackColor}` : ''}`}
          >
            <div className="streak-row-track" />
            {row.days.map((cell, dayIndex) => {
              if (cell.day === null) {
                return (
                  <div
                    key={`empty-${rowIndex}-${dayIndex}`}
                    className="streak-day-empty"
                  />
                );
              }

              return (
                <button
                  key={`day-${cell.day}`}
                  type="button"
                  className={`streak-day ${
                    cell.future
                      ? 'future'
                      : cell.assigned
                        ? 'assigned'
                        : 'unassigned'
                  }`}
                  disabled={cell.future}
                >
                  <span className="streak-day-number">{cell.day}</span>
                  {!cell.assigned && !cell.future && (
                    <span className="streak-day-cross" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
};

export default StreakCalendarSection;
