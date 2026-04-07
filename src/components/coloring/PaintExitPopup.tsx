import { useEffect, useMemo } from 'react';
import { t } from 'i18next';
// Changes: localized dialog and close labels.
import './PaintExitPopup.css';
import AudioButton from '../common/AudioButton';
import { AudioUtil } from '../../utility/AudioUtil';

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
  const isPostSaveExit = variant === 'post-save-exit';
  const dialogText = useMemo(
    () =>
      isPostSaveExit
        ? [
            t('Your creation is shared!'),
            t('Please confirm if you want to exit'),
          ]
        : [t('Uh-oh! Do you want to leave paint mode?')],
    [isPostSaveExit],
  );
  const audioText = dialogText.join(' ');
  const audioClipName = useMemo(
    () => (isPostSaveExit ? 'creation_shared_exit' : 'leave_paint'),
    [isPostSaveExit],
  );

  const playPopupAudio = async (delayMs: number = 0) => {
    const audioUrl = await AudioUtil.getLocalizedAudioUrl(
      'paintExit',
      audioClipName,
    );

    return AudioUtil.playAudioOrTts({
      audioUrl,
      text: audioText,
      ...(delayMs > 0 ? { delayMs } : {}),
    });
  };

  useEffect(() => {
    if (!isOpen) {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
      return;
    }

    void playPopupAudio(300);

    return () => {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
  }, [audioClipName, audioText, isOpen]);

  const handleReplayAudio = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    void playPopupAudio();
  };

  const handleClose = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onClose();
  };

  const handleStay = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onStay();
  };

  const handleExit = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onExit();
  };

  if (!isOpen) return null;

  const primaryLabel = isPostSaveExit ? t('Yes') : t('Stay');
  const secondaryLabel = isPostSaveExit ? t('No') : t('Exit');
  const primaryAction = isPostSaveExit ? handleExit : handleStay;
  const secondaryAction = isPostSaveExit ? handleStay : handleExit;
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
        <div className="PaintExitPopup-audio-button">
          <AudioButton
            backgroundColor="#fffdee"
            onClick={handleReplayAudio}
            ariaLabel={t('Replay audio') || ''}
            size={44}
          />
        </div>
        <button
          type="button"
          className="PaintExitPopup-close"
          onClick={handleClose}
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
