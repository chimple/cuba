import React, { useEffect, useRef } from 'react';
import './PathwayModal.css';
import { t } from 'i18next';
import AudioButton from '../common/AudioButton';
import { AudioUtil } from '../../utility/AudioUtil';

async function playPathwayModalAudio(
  text: string,
  audioFolder?: string,
  audioClipName?: string,
  delayMs: number = 0,
) {
  const audioUrl =
    audioFolder && audioClipName
      ? await AudioUtil.getLocalizedAudioUrl(audioFolder, audioClipName)
      : undefined;

  return AudioUtil.playAudioOrTts({
    audioUrl,
    text,
    ...(delayMs > 0 ? { delayMs } : {}),
  });
}

interface PathwayModalProps {
  text: string;
  onClose: () => void;
  animate?: boolean;
  onConfirm: () => void;
  audioFolder?: string;
  audioClipName?: string;
}

const PathwayModal: React.FC<PathwayModalProps> = ({
  text,
  onClose,
  animate = false,
  onConfirm,
  audioFolder,
  audioClipName,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void playPathwayModalAudio(text, audioFolder, audioClipName, 300);

    return () => {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
  }, [audioClipName, audioFolder, text]);

  const handlePlayAudio = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    void playPathwayModalAudio(text, audioFolder, audioClipName);
  };

  const handleClose = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onClose();
  };

  const handleConfirm = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onConfirm();
  };

  return (
    <div className="PathwayModal-overlay">
      <div
        className={`PathwayModal-content ${animate ? 'slide-in' : ''}`.trim()}
        ref={ref}
      >
        <div className="PathwayModal-audio-button">
          <AudioButton
            backgroundColor="#fffdee"
            onClick={handlePlayAudio}
            size={44}
          />
        </div>
        <button className="PathwayModal-close" onClick={handleClose}>
          <img src="pathwayAssets/menuCross.svg" alt="close-icon" />
        </button>

        <div className="PathwayModal-body" id="PathwayModal-body">
          <p className="PathwayModal-text">{text}</p>
          <button
            className="learning-pathway-OK-button"
            onClick={handleConfirm}
          >
            <span className="learning-pathway-ok-text">{t('OK')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PathwayModal;
