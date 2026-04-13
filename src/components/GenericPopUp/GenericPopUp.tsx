import React, { useEffect, useMemo } from 'react';
import './GenericPopup.css';
import AudioButton from '../common/AudioButton';
import { AudioUtil } from '../../utility/AudioUtil';

const GENERIC_POPUP_SOUND_EFFECT_URL =
  '/assets/audios/common/generic_popup_sound_effect.mp3';

const playPopupAudio = (audioUrl: string | undefined, fallbackText: string) => {
  void AudioUtil.playAudioOrTts({
    audioUrl,
    text: fallbackText,
  });
};

interface Props {
  thumbnailImageUrl: string;
  backgroundImageUrl?: string;
  audioUrl?: string;
  heading: string;
  subHeading?: string;
  details?: string[];
  buttonText: string;
  onClose: () => void;
  onAction: () => void;
}

const GenericPopup: React.FC<Props> = ({
  thumbnailImageUrl,
  backgroundImageUrl,
  audioUrl,
  heading,
  subHeading,
  details = [],
  buttonText,
  onClose,
  onAction,
}) => {
  const fallbackText = useMemo(
    () => [heading, subHeading, ...details].filter(Boolean).join(' '),
    [heading, subHeading, details],
  );

  useEffect(() => {
    void AudioUtil.playAudioOrTts({
      audioUrl: GENERIC_POPUP_SOUND_EFFECT_URL,
      delayMs: 300,
      onCompleteDelayMs: 300,
      onComplete: () => {
        playPopupAudio(audioUrl, fallbackText);
      },
    });

    return () => {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
  }, [audioUrl, fallbackText]);

  const handleReplayAudio = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    playPopupAudio(audioUrl, fallbackText);
  };

  const handleClose = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onClose();
  };

  const handleAction = () => {
    void AudioUtil.stopAudioUrlOrTtsPlayback();
    onAction();
  };

  return (
    <div id="generic-popup-overlay" className="generic-popup-overlay">
      <div id="generic-popup-card" className="generic-popup-card">
        <div className="generic-popup-audio-button">
          <AudioButton
            backgroundColor="#ffffff"
            onClick={handleReplayAudio}
            size={44}
          />
        </div>
        {/* Close */}
        <button
          id="generic-popup-close"
          className="generic-popup-close"
          onClick={handleClose}
        >
          <img
            id="generic-popup-close-icon"
            className="generic-popup-close-icon"
            src="/assets/icons/CrossIcon.svg"
            alt="close"
          />
        </button>

        {/* Background image */}
        <img
          id="generic-popup-bg-image"
          className="generic-popup-bg-image"
          src={backgroundImageUrl}
          alt=""
        />

        <div id="generic-popup-content" className="generic-popup-content">
          {/* Top row: thumb + text */}
          <div className="generic-popup-main">
            {/* Left thumbnail */}
            <div
              id="generic-popup-thumb-wrapper"
              className="generic-popup-thumb-wrapper"
            >
              <img
                id="generic-popup-thumb"
                className="generic-popup-thumb"
                src={thumbnailImageUrl}
                alt=""
              />
            </div>

            {/* Text content */}
            <div
              id="generic-popup-text-wrapper"
              className="generic-popup-text-wrapper"
            >
              <h2 id="generic-popup-heading" className="generic-popup-heading">
                {heading}
              </h2>

              {subHeading && (
                <p
                  id="generic-popup-subheading"
                  className="generic-popup-subheading"
                >
                  {subHeading}
                </p>
              )}

              {details.length > 0 && (
                <ul
                  id="generic-popup-details"
                  className="generic-popup-details"
                >
                  {details.map((item, idx) => (
                    <li
                      id={`generic-popup-detail-${idx}`}
                      className="generic-popup-detail-item"
                      key={idx}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Bottom row: CTA (full width) */}
          <div className="generic-popup-footer">
            <button
              id="generic-popup-cta"
              className="generic-popup-cta"
              onClick={handleAction}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericPopup;
