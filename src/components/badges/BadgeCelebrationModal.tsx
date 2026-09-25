import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { toPng } from 'html-to-image';
import Confetti from 'react-confetti';
import { t } from 'i18next';
import AudioButton from '../common/AudioButton';
import InlineSvg from '../InlineSvg';
import Badge from '../../common/Badges/Badge';
import { EVENTS } from '../../common/constants';
import { logBadgeEvent } from '../../common/Badges/badgeAnalytics';
import type { BadgeAnalyticsProgress } from '../../common/Badges/badgeAnalytics';
import { AudioUtil } from '../../utility/AudioUtil';
import { Util } from '../../utility/util';
import sharedBadgeSvg from '../../assets/images/badges/Shared Badge.svg?raw';
import './BadgeCelebrationModal.css';

const POPUP_SOUND = '/assets/audios/common/generic_popup_sound_effect.mp3';
const CHEER_SOUND = '/assets/audios/common/crowd_cheer.mp3';
const VOICEOVER_DELAY_MS = 2600;

const BADGE_VOICEOVERS: Record<string, string> = {
  en: '/assets/audios/badgeCollected/Badge collected English.mp3',
  hi: '/assets/audios/badgeCollected/Badge collected Hindi.mp3',
  kn: '/assets/audios/badgeCollected/Badge collected Kannada.mp3',
  mr: '/assets/audios/badgeCollected/Badge collected Marathi.mp3',
  pt: '/assets/audios/badgeCollected/Badge collected Portuguese.mp3',
};

const LAST_BADGE_VOICEOVERS: Record<string, string> = {
  en: '/assets/audios/lastBadgeCollected/Last badge English.mp3',
  hi: '/assets/audios/lastBadgeCollected/Last badge Hindi.mp3',
  kn: '/assets/audios/lastBadgeCollected/Last Badge Kannada.mp3',
  mr: '/assets/audios/lastBadgeCollected/Last badge Marathi.mp3',
  pt: '/assets/audios/lastBadgeCollected/Last badge portuguese.mp3',
};

type BadgeCelebrationModalProps = {
  milestone: number | null;
  studentId?: string;
  progress?: BadgeAnalyticsProgress;
  languageCode?: string;
  onClose: () => void;
};

type SharedBadgeArtworkProps = {
  milestone: number;
  heading: string;
  completedText: string;
  badge?: ReactNode;
};

export const SharedBadgeArtwork = forwardRef<
  HTMLDivElement,
  SharedBadgeArtworkProps
>(({ milestone, heading, completedText, badge }, ref) => (
  <div ref={ref} className="BadgeCelebrationModal-share-card">
    <div className="BadgeCelebrationModal-badge-art">
      <InlineSvg ariaHidden svg={sharedBadgeSvg} />
      <h2>{heading}</h2>
      <div className="BadgeCelebrationModal-generated-badge">
        {badge ?? <Badge number={milestone} />}
      </div>
      <div className="BadgeCelebrationModal-badge-copy">
        <p>{completedText}</p>
        <p>
          {t('Keep learning and exploring!', {
            defaultValue: 'Keep learning and exploring!',
          })}
        </p>
      </div>
    </div>
  </div>
));

SharedBadgeArtwork.displayName = 'SharedBadgeArtwork';

const dataUrlToFile = (dataUrl: string, milestone: number): File => {
  const [header, encoded] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = window.atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new File([bytes], `chimple-badge-${milestone}.png`, { type: mime });
};

const getVoiceoverUrl = (languageCode: string, milestone: number) => {
  const language = languageCode.toLowerCase().split('-')[0];
  if (milestone === 3000) {
    return LAST_BADGE_VOICEOVERS[language] ?? LAST_BADGE_VOICEOVERS.en;
  }
  return BADGE_VOICEOVERS[language] ?? BADGE_VOICEOVERS.en;
};

const BadgeCelebrationModal = ({
  milestone,
  studentId,
  progress,
  languageCode = 'en',
  onClose,
}: BadgeCelebrationModalProps) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const voiceoverUrl =
    milestone === null ? null : getVoiceoverUrl(languageCode, milestone);
  const badgeMilestone = progress?.latest_badge_milestone || milestone || 0;
  const lessonsPlayedCount = progress?.lessons_played_count ?? milestone ?? 0;
  const heading = t('Congratulations!', { defaultValue: 'Congratulations!' });
  const completedText = t('{{count}} lessons complete!', {
    count: lessonsPlayedCount,
    defaultValue: `${lessonsPlayedCount} lessons complete!`,
  });
  const analyticsProgress = useMemo<BadgeAnalyticsProgress>(
    () =>
      progress ?? {
        lessons_played_count: milestone ?? 0,
        latest_badge_milestone: milestone ?? 0,
        has_unseen_badge: false,
      },
    [milestone, progress],
  );
  const analyticsStudentId = studentId ?? 'unknown';

  const logPopupButtonClick = (
    buttonName: 'share_button' | 'continue_button' | 'close_cross',
  ) => {
    void logBadgeEvent(
      EVENTS.BADGE_POPUP_BUTTON_CLICKED,
      analyticsStudentId,
      analyticsProgress,
      { button_name: buttonName },
    );
  };

  useEffect(() => {
    if (milestone === null) return;

    // This effect runs after the modal is committed, making it an impression event.
    void logBadgeEvent(
      EVENTS.BADGE_POPUP_VIEWED,
      analyticsStudentId,
      analyticsProgress,
      {
        milestone_displayed: milestone,
        is_final_badge: milestone === 3000,
      },
    );
  }, [analyticsProgress, analyticsStudentId, milestone]);

  useEffect(() => {
    if (milestone === null || !voiceoverUrl) return;

    const popupAudio = new Audio(POPUP_SOUND);
    const cheerAudio = new Audio(CHEER_SOUND);
    void popupAudio.play().catch(() => undefined);

    const cheerTimer = window.setTimeout(() => {
      void cheerAudio.play().catch(() => undefined);
    }, 220);
    const voiceTimer = window.setTimeout(() => {
      void AudioUtil.playAudioOrTts({ audioUrl: voiceoverUrl });
    }, VOICEOVER_DELAY_MS);

    return () => {
      window.clearTimeout(cheerTimer);
      window.clearTimeout(voiceTimer);
      popupAudio.pause();
      cheerAudio.pause();
      void AudioUtil.stopAudioUrlOrTtsPlayback();
    };
  }, [milestone, voiceoverUrl]);

  const replayVoiceover = () => {
    logPopupButtonClick('continue_button');
    if (voiceoverUrl) {
      void AudioUtil.stopAudioUrlOrTtsPlayback();
      void AudioUtil.playAudioOrTts({ audioUrl: voiceoverUrl });
    }
  };

  const shareBadge = async () => {
    if (!captureRef.current || milestone === null || isSharing) return;
    logPopupButtonClick('share_button');
    setIsSharing(true);
    try {
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      await Util.sendContentToAndroidOrWebShare(
        `${heading} ${completedText}`,
        'My Chimple Badge',
        undefined,
        [dataUrlToFile(dataUrl, milestone)],
        { rethrowOnError: true },
      );
      // The share helper rethrows native/web dismissal errors for outcome tracking.
      void logBadgeEvent(
        EVENTS.BADGE_SHARE_SUCCESS,
        analyticsStudentId,
        analyticsProgress,
        { shared_milestone: milestone },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isCancelled =
        (error as { name?: string } | null)?.name === 'AbortError' ||
        /cancel|dismiss/i.test(errorMessage);
      void logBadgeEvent(
        isCancelled ? EVENTS.BADGE_SHARE_CANCELLED : EVENTS.BADGE_SHARE_FAILED,
        analyticsStudentId,
        analyticsProgress,
        { error_message: errorMessage },
      );
    } finally {
      setIsSharing(false);
    }
  };

  if (milestone === null) return null;

  return (
    <div className="BadgeCelebrationModal-overlay" role="presentation">
      <Confetti
        className="BadgeCelebrationModal-confetti"
        numberOfPieces={180}
        recycle={false}
      />
      <div
        className="BadgeCelebrationModal-modal BadgeCelebrationModal-shell"
        role="dialog"
        aria-modal="true"
      >
        <div className="BadgeCelebrationModal-audio-button">
          <AudioButton
            className="BadgeCelebrationModal-audio-button-control"
            backgroundColor="#ffffff"
            onClick={replayVoiceover}
            ariaLabel={String(
              t('Replay audio', { defaultValue: 'Replay audio' }),
            )}
            size="3.6rem"
          />
        </div>
        <button
          type="button"
          className="BadgeCelebrationModal-close"
          onClick={() => {
            logPopupButtonClick('close_cross');
            onClose();
          }}
          aria-label={String(t('Close', { defaultValue: 'Close' }))}
        />
        <SharedBadgeArtwork
          ref={captureRef}
          milestone={badgeMilestone}
          heading={heading}
          completedText={completedText}
        />
        <button
          type="button"
          className="BadgeCelebrationModal-share"
          onClick={shareBadge}
          disabled={isSharing}
        >
          <img
            className="BadgeCelebrationModal-share-icon"
            src="assets/icons/ShareNetwork.svg"
            alt=""
            aria-hidden="true"
          />
          {isSharing
            ? t('Sharing...', { defaultValue: 'Sharing...' })
            : t('Share', { defaultValue: 'Share' })}
        </button>
      </div>
    </div>
  );
};

export default BadgeCelebrationModal;
