import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { t } from 'i18next';
import './ClassSummaryInfoPopup.css';

interface ClassSummaryInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  dateRangeLabel: string;
}

const CLOSE_ICON_SRC = '/assets/loginAssets/TermsConditionsClose.svg';
const TREND_ICON_BY_TYPE = {
  up: '/assets/icons/GreenUpIcon.svg',
  down: '/assets/icons/RedDownIcon.svg',
  same: '/assets/icons/equalIcon.svg',
} as const;

const SUMMARY_ROWS = [
  {
    title: 'Active Students',
    description:
      'A student who has played at least 1 activity in the last 7 days.',
  },
  {
    title: 'Average Time Spent',
    description: 'Average time spent by active students in the last 7 days.',
  },
  {
    title: 'Average Score',
    description:
      'Average percentage score of active students in the last 7 days.',
  },
] as const;

const TREND_ROWS = [
  {
    icon: 'up',
    text: 'A visual indicator (↑) showing an increase compared to the last 7 days.',
  },
  {
    icon: 'down',
    text: 'A visual indicator (↓) showing a decrease compared to the last 7 days.',
  },
  {
    icon: 'same',
    text: 'A visual indicator (=) showing no change compared to the last 7 days.',
  },
] as const;

const ENGAGEMENT_ROWS = [
  {
    label: 'High Engagement 45+ minutes',
    lines: [
      'Student who has spent 45+ or more minutes in the last 7 days.',
      'These students have met or exceeded the weekly learning target.',
    ],
    labelClassName: 'class-summary-popup-pill-high',
  },
  {
    label: 'Medium Engagement <45 minutes',
    lines: [
      'Student who has spent 1 second - 44:59 minutes in the last 7 days.',
    ],
    labelClassName: 'class-summary-popup-pill-medium',
  },
  {
    label: 'Not Active for last 7 days',
    lines: [
      'Student who is not active (0 seconds) for 7 or more days.',
      'Student has downloaded and used the app at least once.',
    ],
    labelClassName: 'class-summary-popup-pill-inactive',
  },
  {
    label: 'App not downloaded',
    lines: ['Student who has not downloaded the app.'],
    labelClassName: 'class-summary-popup-pill-not-downloaded',
  },
] as const;

const ClassSummaryInfoPopup: React.FC<ClassSummaryInfoPopupProps> = ({
  isOpen,
  onClose,
  dateRangeLabel,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (!popupRef.current) return;
      if (!popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="class-summary-popup-overlay">
      <div
        ref={popupRef}
        className="class-summary-popup"
        role="dialog"
        aria-modal="true"
        aria-label={String(t('Class summary information'))}
      >
        <div className="class-summary-popup-header">
          <div className="class-summary-popup-header-top">
            <h3 className="class-summary-popup-title">
              {t('Weekly Summary')} {dateRangeLabel}
            </h3>
            <button
              type="button"
              className="class-summary-popup-close-btn"
              onClick={onClose}
              aria-label={String(t('Close class summary information'))}
            >
              <img
                src={CLOSE_ICON_SRC}
                alt=""
                className="class-summary-popup-close-icon"
              />
            </button>
          </div>
          <div className="class-summary-popup-subtitle">
            {t('Class Summary')}
          </div>
        </div>

        <div className="class-summary-popup-body">
          {SUMMARY_ROWS.map((row) => (
            <section key={row.title} className="class-summary-popup-section">
              <p className="class-summary-popup-main-text">
                <strong>{t(row.title)}</strong> - {t(row.description)}
              </p>
            </section>
          ))}

          {TREND_ROWS.map((item, index) => (
            <div key={`trend-${index}`} className="class-summary-popup-item">
              <img
                src={TREND_ICON_BY_TYPE[item.icon]}
                alt=""
                className={`class-summary-popup-item-icon ${
                  item.icon === 'down'
                    ? 'class-summary-popup-item-icon--down'
                    : ''
                }`}
              />
              <span className="class-summary-popup-item-text">
                {t(item.text)}
              </span>
            </div>
          ))}

          {ENGAGEMENT_ROWS.map((row) => (
            <section key={row.label} className="class-summary-popup-section">
              <span
                className={`class-summary-popup-pill ${row.labelClassName}`}
              >
                {t(row.label)}
              </span>
              {row.lines.map((line, index) => (
                <p
                  key={`${row.label}-${index}`}
                  className="class-summary-popup-main-text class-summary-popup-main-text--spaced"
                >
                  {t(line)}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ClassSummaryInfoPopup;
