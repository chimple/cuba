import { t } from 'i18next';
// Changes: localized action button alt text.
import cameraIcon from '../../assets/images/camera.svg';
import './StickerBookActions.css';

type Props = {
  showPaint: boolean;
  onSave: () => void;
  onPaint: () => void;
  saveDisabled?: boolean;
  paintDisabled?: boolean;
};

export default function StickerBookActions({
  showPaint,
  onSave,
  onPaint,
  saveDisabled = false,
  paintDisabled = false,
}: Props) {
  return (
    <div id="sticker-book-actions-root" className="StickerBookActions-root">
      <button
        id="sticker-book-actions-save"
        type="button"
        className="StickerBookActions-save"
        onClick={onSave}
        disabled={saveDisabled}
      >
        <img src={cameraIcon} alt={t('Save')||""} />
        {t('Save')}
      </button>

      {showPaint && (
        <button
          id="sticker-book-actions-paint"
          type="button"
          className="StickerBookActions-paint"
          onClick={onPaint}
          disabled={paintDisabled}
        >
          <img src="/assets/icons/PaintBucket.svg" alt={t('Paint')||""} />
          {t('Paint')}
        </button>
      )}
    </div>
  );
}
