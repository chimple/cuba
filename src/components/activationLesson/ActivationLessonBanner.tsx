import React, { useEffect, useRef, useState } from 'react';
import { t } from 'i18next';
import { AudioUtil } from '../../utility/AudioUtil';
import './ActivationLessonBanner.css';

const ENTRY_SOUND_EFFECT = '/assets/audios/common/generic_sound_effect.mp3';
const ACTIVATION_COUNTDOWN_SECONDS = 5;
const ACTIVATION_ENTRY_DELAY_MS = 2100;
const ACTIVATION_SUN_STEP_DEGREES = 7;

const ActivationLessonBanner: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState(ACTIVATION_COUNTDOWN_SECONDS);
  const delayTimeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const startBannerFlow = async () => {
      const languageCode = await AudioUtil.getAudioLanguageCode();
      const letsPlayAudioUrl = `/assets/audios/activationLesson/letsPlay/${languageCode}_lets_play.mp3`;

      const beginCountdown = () => {
        intervalRef.current = window.setInterval(() => {
          setSecondsLeft((currentSeconds) =>
            currentSeconds > 0 ? currentSeconds - 1 : 0,
          );
        }, 1000);
      };

      void AudioUtil.playAudioOrTts({
        audioUrl: ENTRY_SOUND_EFFECT,
      });

      delayTimeoutRef.current = window.setTimeout(() => {
        beginCountdown();
        void AudioUtil.playAudioOrTts({
          audioUrl: letsPlayAudioUrl,
        });
      }, ACTIVATION_ENTRY_DELAY_MS);
    };

    void startBannerFlow();

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }

      if (delayTimeoutRef.current !== null) {
        window.clearTimeout(delayTimeoutRef.current);
      }

      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
  }, []);

  return (
    <div className="activation-lesson-banner">
      <div className="activation-lesson-banner__frame">
        <img
          alt=""
          aria-hidden="true"
          className="activation-lesson-banner__image"
          src="/assets/activationLesson/banner.webp"
        />
        <div className="activation-lesson-banner__content">
          <div className="activation-lesson-banner__title">
            {t('Lesson starts in :')}
          </div>

          <div className="activation-lesson-banner__sun-wrap">
            <img
              alt=""
              aria-hidden="true"
              className="activation-lesson-banner__sun"
              src="/assets/activationLesson/sunTimer.svg"
              style={{
                transform: `rotate(${
                  (ACTIVATION_COUNTDOWN_SECONDS - secondsLeft) *
                  ACTIVATION_SUN_STEP_DEGREES
                }deg)`,
              }}
            />
            <span className="activation-lesson-banner__count" key={secondsLeft}>
              {secondsLeft}
            </span>
          </div>

          <div className="activation-lesson-banner__footer">
            {t(
              "Let's play and learn! Complete first lesson and earn a reward!",
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivationLessonBanner;
