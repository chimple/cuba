import { t } from 'i18next';
// Changes: localized dialog and close labels.
import './PaintExitPopup.css';

type Props = {
  isOpen: boolean;
  onStay: () => void;
  onExit: () => void;
  onClose: () => void;
};

export default function PaintExitPopup({
  isOpen,
  onStay,
  onExit,
  onClose,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      id="paint-exit-popup-overlay"
      className="PaintExitPopup-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('Leave paint mode') || ''}
    >
      <div id="paint-exit-popup-card" className="PaintExitPopup-card">
        <button
          type="button"
          className="PaintExitPopup-close"
          onClick={onClose}
          aria-label={t('Close') || ''}
        >
          <img src="pathwayAssets/menuCross.svg" alt={t('Close') || ''} />
        </button>
        <img
          src="/assets/icons/StickerBookPaintIcon.svg"
          alt=""
          className="PaintExitPopup-icon"
        />
        <div id="paint-exit-popup-text" className="PaintExitPopup-text">
          {t('Uh-oh! Do you want to leave paint mode?')}
        </div>
        <div id="paint-exit-popup-actions" className="PaintExitPopup-actions">
          <button
            type="button"
            className="PaintExitPopup-stay"
            onClick={onStay}
          >
            {t('Stay')}
          </button>
          <button
            type="button"
            className="PaintExitPopup-exit"
            onClick={onExit}
          >
            {t('Exit')}
          </button>
        </div>
      </div>
    </div>
  );
}
