import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router';
import { t } from 'i18next';
import { CHIMPLE_DIGITAL_SKILLS, PAGES, SOURCE } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import { AudioUtil } from '../../utility/AudioUtil';
import logger from '../../utility/logger';
import { Util } from '../../utility/util';
import './ActivationLessonBanner.css';

const ENTRY_SOUND_EFFECT = '/assets/audios/common/generic_sound_effect.mp3';
const ACTIVATION_COUNTDOWN_SECONDS = 5;
const ACTIVATION_ENTRY_DELAY_MS = 2100;
const ACTIVATION_LAUNCH_DELAY_MS = 500;
const ACTIVATION_SUN_STEP_DEGREES = 7;
const ACTIVATION_CHAPTER_ID = '51468247-e4b9-4d8f-9e01-d46acdc4ffb5';

interface ActivationLessonBannerProps {
  source: SOURCE;
}

const ActivationLessonBanner: React.FC<ActivationLessonBannerProps> = ({
  source,
}) => {
  const history = useHistory();
  const [secondsLeft, setSecondsLeft] = useState(ACTIVATION_COUNTDOWN_SECONDS);
  const [isBannerImageReady, setIsBannerImageReady] = useState(false);
  const delayTimeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const launchTimeoutRef = useRef<number | null>(null);
  const hasLaunchedLessonRef = useRef(false);

  useEffect(() => {
    if (!isBannerImageReady) {
      return;
    }

    const startBannerFlow = async () => {
      const languageCode = await AudioUtil.getAudioLanguageCode();
      const letsPlayAudioUrl = `/assets/audios/activationLesson/letsPlay/${languageCode}_lets_play.mp3`;

      const beginCountdown = () => {
        intervalRef.current = window.setInterval(() => {
          setSecondsLeft((currentSeconds) =>
            currentSeconds > 1 ? currentSeconds - 1 : 0,
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

      if (launchTimeoutRef.current !== null) {
        window.clearTimeout(launchTimeoutRef.current);
      }

      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
  }, [history, isBannerImageReady]);

  useEffect(() => {
    if (
      !isBannerImageReady ||
      secondsLeft !== 0 ||
      hasLaunchedLessonRef.current
    ) {
      return;
    }

    hasLaunchedLessonRef.current = true;

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const launchRandomLesson = async () => {
      const api = ServiceConfig.getI().apiHandler;

      try {
        const lessons = await api.getLessonsForChapter(ACTIVATION_CHAPTER_ID);
        const playableLessons = lessons.filter((lesson) =>
          Boolean(Util.getLessonBundleId(lesson)),
        );

        if (playableLessons.length === 0) {
          logger.warn(
            '[ActivationLessonBanner] No playable lessons found for activation chapter',
            { chapterId: ACTIVATION_CHAPTER_ID },
          );
          return;
        }

        const randomLesson =
          playableLessons[Math.floor(Math.random() * playableLessons.length)];
        const playableLessonId = Util.getLessonBundleId(randomLesson);

        if (!playableLessonId) {
          return;
        }

        const params = `?courseid=${randomLesson.cocos_subject_code}&chapterid=${randomLesson.cocos_chapter_code}&lessonid=${playableLessonId}`;
        launchTimeoutRef.current = window.setTimeout(() => {
          history.push(PAGES.LIDO_PLAYER + params, {
            lessonId: playableLessonId,
            courseDocId: CHIMPLE_DIGITAL_SKILLS,
            lesson: JSON.stringify(randomLesson),
            reward: true,
            isDefaultLesson: true,
            source,
            from: history.location.pathname + history.location.search,
          });
        }, ACTIVATION_LAUNCH_DELAY_MS);
      } catch (error) {
        logger.error(
          '[ActivationLessonBanner] Failed to launch activation lesson',
          error,
        );
      }
    };

    void launchRandomLesson();
  }, [history, secondsLeft, source]);

  return (
    <div className="activation-lesson-banner">
      <div className="activation-lesson-banner__frame">
        <img
          alt=""
          aria-hidden="true"
          className="activation-lesson-banner__image"
          src="/assets/activationLesson/banner.webp"
          onLoad={() => setIsBannerImageReady(true)}
        />
        {isBannerImageReady ? (
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
              <span
                className="activation-lesson-banner__count"
                key={secondsLeft}
              >
                {secondsLeft}
              </span>
            </div>

            <div className="activation-lesson-banner__footer">
              {t(
                "Let's play and learn! Complete first lesson and earn a reward!",
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ActivationLessonBanner;
