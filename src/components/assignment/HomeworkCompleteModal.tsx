// HomeworkCompleteModal.tsx
import React, { useCallback, useEffect, useRef } from 'react';
import './HomeworkCompleteModal.css';
import { t } from 'i18next';
import ChimpleRiveMascot from '../learningPathway/ChimpleRiveMascot';
import AudioButton from '../common/AudioButton';
import { AudioUtil } from '../../utility/AudioUtil';

interface HomeworkCompleteModalProps {
  text: string;
  onClose: () => void;
  onPlayMore: () => void;
  borderImageSrc: string;
}

const HomeworkCompleteModal: React.FC<HomeworkCompleteModalProps> = ({
  text,
  onClose,
  onPlayMore,
  borderImageSrc,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const cardStyle = {
    backgroundImage: `url(${borderImageSrc})`,
  };

  const playHomeworkCompleteAudio = useCallback(
    (delayMs: number = 0) => {
      void (async () => {
        const audioUrl = await AudioUtil.getLocalizedAudioUrl(
          'allHwComplete',
          'all_hw_done',
        );

        await AudioUtil.playAudioOrTts({
          audioUrl,
          text,
          ...(delayMs > 0 ? { delayMs } : {}),
        });
      })();
    },
    [text],
  );

  useEffect(() => {
    playHomeworkCompleteAudio(300);

    return () => {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
  }, [playHomeworkCompleteAudio]);

  const handleReplayAudio = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    playHomeworkCompleteAudio();
  };

  const handleClose = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onClose();
  };

  const handlePlayMore = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onPlayMore();
  };

  return (
    <div className="homework-completed-banner" onClick={handleClose}>
      <div
        className="homework-completed-card"
        ref={ref}
        style={cardStyle}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking card
      >
        <div className="homework-completed-inner">
          {/* LEFT MASCOT - RIVE */}
          <div className="homework-completed-left">
            <div className="homework-completed-mascot homework-completed-mascot-rive">
              <ChimpleRiveMascot
                // you can tweak these to use your “celebration” state
                stateMachine="State Machine 1"
                inputName="Number 1"
                stateValue={1}
                animationName={'win'}
              />
            </div>
          </div>

          {/* MAIN CENTER BLOCK */}
          <div className="homework-completed-center">
            <p className="homework-completed-text">{text}</p>
            <button
              className="homework-completed-play-btn"
              onClick={handlePlayMore}
            >
              <img
                src="/assets/icons/HomeIcon.svg"
                alt="play"
                className="homework-completed-play-icon"
              />
              {t('Play More')}
            </button>
          </div>

          <div className="homework-completed-right">
            <div className="homework-completed-audio-button">
              <AudioButton
                backgroundColor="#fffcee"
                onClick={handleReplayAudio}
                size={44}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeworkCompleteModal;
