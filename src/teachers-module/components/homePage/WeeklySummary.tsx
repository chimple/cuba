import React, { useState } from 'react';
import './WeeklySummary.css';
import { HomeWeeklySummary } from '../../../common/constants';
import { t } from 'i18next';
import { format, subDays } from 'date-fns';
import ClassSummaryInfoPopup from './ClassSummaryInfoPopup';

interface WeeklySummaryProps {
  weeklySummary?: HomeWeeklySummary;
}

const INFO_ICON_SRC = '/assets/icons/infoIcon.svg';
const TREND_ICON_BY_TYPE = {
  up: '/assets/icons/GreenUpIcon.svg',
  down: '/assets/icons/RedDownIcon.svg',
  same: '/assets/icons/equalIcon.svg',
} as const;

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ weeklySummary }) => {
  const today = new Date();
  const oneWeekBack = subDays(today, 6);
  const [isClassSummaryPopupOpen, setIsClassSummaryPopupOpen] = useState(false);

  const metrics = [
    {
      label: t('Active Students'),
      value: `${weeklySummary?.activeStudents.count ?? 0}/${weeklySummary?.activeStudents.totalStudents ?? 0}`,
      trend: weeklySummary?.activeStudents.trend ?? 'same',
    },
    {
      label: t('Average Time Spent'),
      value: `${weeklySummary?.averageTimeSpent.minutes ?? 0} min`,
      trend: weeklySummary?.averageTimeSpent.trend ?? 'same',
    },
    {
      label: t('Average Score'),
      value: `${weeklySummary?.averageScore.percentage ?? 0}%`,
      trend: weeklySummary?.averageScore.trend ?? 'same',
    },
  ];

  return (
    <div className="weekly-summary-container">
      <h3 className="weekly-summary-header">
        {t('Weekly Summary')} {format(oneWeekBack, 'dd/MM')} -{' '}
        {format(today, 'dd/MM')}
      </h3>

      <div className="class-summary-title-row">
        <span className="class-summary-title">{t('Class Summary')}</span>
        <button
          type="button"
          className="class-summary-info-icon-btn"
          onClick={() => setIsClassSummaryPopupOpen(true)}
          aria-label="Open class summary information"
        >
          <img src={INFO_ICON_SRC} alt="" className="class-summary-info-icon" />
        </button>
      </div>

      <div className="weekly-summary">
        {metrics.map((item) => (
          <div key={item.label} className="summary-item">
            <div className="summary-label">{item.label}</div>
            <div className="summary-value-row">
              <strong className="summary-value">{item.value}</strong>
              <span className="summary-trend-icon-wrap" aria-hidden="true">
                <img
                  src={TREND_ICON_BY_TYPE[item.trend]}
                  alt={`${item.trend} trend`}
                  className={`summary-trend-icon ${
                    item.trend === 'down' ? 'summary-trend-icon--down' : ''
                  }`}
                />
              </span>
            </div>
          </div>
        ))}
      </div>

      <ClassSummaryInfoPopup
        isOpen={isClassSummaryPopupOpen}
        onClose={() => setIsClassSummaryPopupOpen(false)}
        dateRangeLabel={`${format(oneWeekBack, 'dd/MM')} - ${format(today, 'dd/MM')}`}
      />
    </div>
  );
};

export default WeeklySummary;
