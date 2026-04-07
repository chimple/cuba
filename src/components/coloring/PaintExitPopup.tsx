import { t } from 'i18next';
// Changes: localized dialog and close labels.
import './PaintExitPopup.css';

type Props = {
  isOpen: boolean;
  onStay: () => void;
  onExit: () => void;
  onClose: () => void;
  variant?: 'default' | 'post-save-exit';
};

export default function PaintExitPopup({
  isOpen,
  onStay,
  onExit,
  onClose,
  variant = 'default',
}: Props) {
  if (!isOpen) return null;

  const isPostSaveExit = variant === 'post-save-exit';
  const primaryLabel = isPostSaveExit ? t('Yes') : t('Stay');
  const secondaryLabel = isPostSaveExit ? t('No') : t('Exit');
  const primaryAction = isPostSaveExit ? onExit : onStay;
  const secondaryAction = isPostSaveExit ? onStay : onExit;
  const dialogText = isPostSaveExit
    ? [t('Your creation is shared!'), t('Please confirm if you want to exit')]
    : [t('Uh-oh! Do you want to leave paint mode?')];
  const popupIcon = isPostSaveExit
    ? '/assets/icons/StickerBookDoor.svg'
    : '/assets/icons/PaintBrushIcon.svg';

  return (
    <div
      id="paint-exit-popup-overlay"
      className="PaintExitPopup-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('Paint exit confirmation') || ''}
    >
      <div
        id="paint-exit-popup-card"
        className={`PaintExitPopup-card ${
          isPostSaveExit ? 'PaintExitPopup-card--post-save' : ''
        }`}
      >
        <button
          type="button"
          className="PaintExitPopup-close"
          onClick={onClose}
          aria-label={t('Close') || ''}
        >
          <img src="pathwayAssets/menuCross.svg" alt={t('Close') || ''} />
        </button>
        <img
          src={popupIcon}
          alt=""
          className={`PaintExitPopup-icon ${
            isPostSaveExit ? 'PaintExitPopup-icon--post-save' : ''
          }`}
        />
        <div
          id="paint-exit-popup-text"
          className={`PaintExitPopup-text ${
            isPostSaveExit ? 'PaintExitPopup-text--post-save' : ''
          }`}
        >
          {dialogText.map((line, index) => (
            <div key={`paint-exit-text-line-${index}`}>{line}</div>
          ))}
        </div>
        <div
          id="paint-exit-popup-actions"
          className={`PaintExitPopup-actions ${
            isPostSaveExit ? 'PaintExitPopup-actions--post-save' : ''
          }`}
        >
          <button
            type="button"
            className={`PaintExitPopup-stay ${
              isPostSaveExit ? 'PaintExitPopup-stay--post-save' : ''
            }`}
            onClick={primaryAction}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            className={`PaintExitPopup-exit ${
              isPostSaveExit ? 'PaintExitPopup-exit--post-save' : ''
            }`}
            onClick={secondaryAction}
          >
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
