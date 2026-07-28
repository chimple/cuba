import React from 'react';
import { IonModal } from '@ionic/react';
import { t } from 'i18next';
import './StreakInfoPopup.css';

type StreakInfoSection = {
  title?: string;
  body: string;
};

interface StreakInfoPopupProps {
  isOpen: boolean;
  title: string;
  sections?: StreakInfoSection[];
  onClose: () => void;
}

const CLOSE_ICON_SRC = '/assets/loginAssets/TermsConditionsClose.svg';

const renderBoldText = (text: string) => {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="streak-info-popup-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

const StreakInfoPopup: React.FC<StreakInfoPopupProps> = ({
  isOpen,
  title,
  sections = [],
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      backdropDismiss={true}
      className="streak-info-popup-modal"
    >
      <div className="streak-info-popup-overlay" onClick={onClose}>
        <div
          className="streak-info-popup"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={String(t(title))}
        >
          <div className="streak-info-popup-header">
            <h3 className="streak-info-popup-title">{t(title)}</h3>
            <button
              type="button"
              className="streak-info-popup-close-btn"
              onClick={onClose}
              aria-label={String(t('Close information'))}
            >
              <img
                src={CLOSE_ICON_SRC}
                alt=""
                className="streak-info-popup-close-icon"
              />
            </button>
          </div>

          <div className="streak-info-popup-body">
            {sections.map((section, index) => (
              <section
                key={`${section.title ?? 'section'}-${index}`}
                className="streak-info-popup-section"
              >
                {section.title && (
                  <h4 className="streak-info-popup-section-title">
                    {t(section.title)}
                  </h4>
                )}
                <ul className="streak-info-popup-list">
                  {t(section.body)
                    .split('\n')
                    .filter((line) => line.trim().length > 0)
                    .map((line, lineIndex) => (
                      <li
                        key={`${section.title ?? 'section'}-${index}-${lineIndex}`}
                        className="streak-info-popup-list-item"
                      >
                        {renderBoldText(line)}
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </IonModal>
  );
};

export default StreakInfoPopup;
