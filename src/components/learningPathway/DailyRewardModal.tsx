import { useEffect, useRef } from 'react';
import './DailyRewardModal.css';
import { t } from 'i18next';
import RewardRive from './RewardRive';
import { RewardBoxState } from '../../common/constants';
import AudioButton from '../common/AudioButton';
import { AudioUtil } from '../../utility/AudioUtil';

const SOUND_EFFECT = '/assets/audios/common/generic_sound_effect.mp3';

async function playRewardMessageAudio(text: string) {
  const textAudioUrl = await AudioUtil.getLocalizedAudioUrl(
    'dailyReward',
    'message',
  );

  return AudioUtil.playAudioOrTts({
    audioUrl: textAudioUrl,
    text,
  });
}

interface RewardModalProps {
  text: string;
  onClose: () => void;
  onPlay: () => void;
}

const DailyRewardModal: React.FC<RewardModalProps> = ({
  text,
  onClose,
  onPlay,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void AudioUtil.playAudioOrTts({
      audioUrl: SOUND_EFFECT,
      delayMs: 300,
      onCompleteDelayMs: 300,
      onComplete: () => {
        void playRewardMessageAudio(text);
      },
    });

    return () => {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
  }, [text]);

  const handleReplayAudio = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    void playRewardMessageAudio(text);
  };

  const handleClose = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onClose();
  };

  const handlePlay = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onPlay();
  };

  // Close modal when clicking on overlay (outside modal content)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      e.target === e.currentTarget &&
      (e.target as HTMLElement).classList.contains('RewardModal-overlay')
    ) {
      e.stopPropagation();
      handleClose();
    }
  };

  return (
    <div className="RewardModal-overlay" onClick={handleOverlayClick}>
      <div className="RewardModal-content" ref={ref}>
        <div className="RewardModal-audio-button">
          <AudioButton
            backgroundColor="#fffdee"
            onClick={handleReplayAudio}
            size={44}
          />
        </div>
        <button className="RewardModal-close" onClick={handleClose}>
          <img src="pathwayAssets/menuCross.svg" alt="close-icon" />
        </button>

        <div>
          <div className="RewardModal-reward-box-container">
            <RewardRive rewardRiveState={RewardBoxState.SHAKING} />
          </div>
          <p className="RewardModal-text">{text}</p>
          <button className="RewardModal-OK-button" onClick={handlePlay}>
            <span className="RewardModal-ok-text">{t("Let's Play")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyRewardModal;
