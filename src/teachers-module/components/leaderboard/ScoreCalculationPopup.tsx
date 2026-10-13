import { IonModal } from '@ionic/react';
import { t } from 'i18next';
import './ScoreCalculationPopup.css';

interface ScoreCalculationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ZONES = [
  ['Silver', 'Middle 60%'],
  ['Gold', 'Top 20%'],
  ['Bronze', 'Bottom 20%'],
] as const;

// Preserve the product-defined order so the table matches the score rules.
const MOVEMENTS = [
  ['Red', 'Yellow', '+10'],
  ['Yellow', 'Green', '+5'],
  ['Red', 'Green', '+15'],
  ['Grey', 'Yellow', '+20'],
  ['Grey', 'Green', '+25'],
  ['Green', 'Yellow', '-5'],
  ['Yellow', 'Red', '-10'],
  ['Green', 'Red', '-15'],
] as const;

const BandPill = ({ band }: { band: string }) => (
  <span
    className={`score-calculation-popup-band score-calculation-popup-band--${band.toLowerCase()}`}
  >
    <span className="score-calculation-popup-two-people" aria-hidden="true" />
    {t(band)}
  </span>
);

const ScoreCalculationPopup = ({
  isOpen,
  onClose,
}: ScoreCalculationPopupProps) => {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      backdropDismiss
      className="score-calculation-popup-modal"
    >
      <div className="score-calculation-popup-overlay" onClick={onClose}>
        <article
          className="score-calculation-popup"
          role="dialog"
          aria-modal="true"
          aria-labelledby="score-calculation-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="score-calculation-popup-header">
            <h2 id="score-calculation-title">{t('Score Calculation')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="score-calculation-popup-close"
              aria-label={String(t('Close score calculation'))}
            >
              <span aria-hidden="true">{'\u00d7'}</span>
            </button>
          </header>

          <div className="score-calculation-popup-content">
            <section className="score-calculation-popup-section score-calculation-popup-section--zones">
              <div className="score-calculation-popup-zones">
                {ZONES.map(([zone, percentile]) => (
                  <div
                    key={zone}
                    className={`score-calculation-popup-zone score-calculation-popup-zone--${zone.toLowerCase()}`}
                  >
                    <strong>{t(zone)}</strong>
                    <span>{t(percentile).replace(' ', '\n')}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="score-calculation-popup-section">
              <h3 className="score-calculation-popup-section-title">
                {t('Base Score')}
              </h3>
              <div className="score-calculation-popup-base-formula">
                <div className="score-calculation-popup-average score-calculation-popup-average--green">
                  <span
                    className="score-calculation-popup-group-icon"
                    aria-hidden="true"
                  />
                  <span>
                    {t('Avg. time spent by Green-band students (in the class)')}
                  </span>
                </div>
                <strong className="score-calculation-popup-plus">+</strong>
                <div className="score-calculation-popup-average score-calculation-popup-average--yellow">
                  <span
                    className="score-calculation-popup-group-icon"
                    aria-hidden="true"
                  />
                  <span>
                    {t(
                      'Avg. time spent by Yellow-band students (in the class)',
                    )}
                  </span>
                </div>
              </div>
            </section>

            <section className="score-calculation-popup-section">
              <h3 className="score-calculation-popup-section-title">
                {t('Bonus / Penalty')}
              </h3>
              <div className="score-calculation-popup-movements">
                <div className="score-calculation-popup-movement-heading">
                  <strong>{t('Movement & Points System')}</strong>
                  <span>
                    {t(
                      'Earn or lose points based on how students move between engagement bands compared to last week.',
                    )}
                  </span>
                </div>
                <div
                  className="score-calculation-popup-table-heading"
                  aria-hidden="true"
                >
                  <span>{t('Movement')}</span>
                  <span>{t('Points')}</span>
                </div>
                {MOVEMENTS.map(([from, to, points]) => {
                  const isBonus = points.startsWith('+');

                  return (
                    <div
                      key={`${from}-${to}`}
                      className="score-calculation-popup-movement"
                    >
                      <div className="score-calculation-popup-movement-bands">
                        <BandPill band={from} />
                        <strong aria-hidden="true">{'\u2192'}</strong>
                        <BandPill band={to} />
                      </div>
                      <div
                        className={
                          isBonus
                            ? 'score-calculation-popup-positive'
                            : 'score-calculation-popup-negative'
                        }
                      >
                        <strong>{points}</strong>
                        <div
                          className={`score-calculation-popup-trend-icon score-calculation-popup-trend-icon--${
                            isBonus ? 'up' : 'down'
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="score-calculation-popup-final">
              {t('Final Score = Base Score + Bonus / Penalty')}
            </section>
          </div>
        </article>
      </div>
    </IonModal>
  );
};

export default ScoreCalculationPopup;
