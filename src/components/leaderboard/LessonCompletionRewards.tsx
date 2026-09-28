import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { t } from 'i18next';
import { getGeneratedBadge } from '../../common/Badges/badgeGenerator';
import type { BadgeAnalyticsProgress } from '../../common/Badges/badgeAnalytics';
import { logBadgeEvent } from '../../common/Badges/badgeAnalytics';
import { EVENTS } from '../../common/constants';
import { Util } from '../../utility/util';
import { SharedBadgeArtwork } from '../badges/BadgeCelebrationModal';
import LessonCompletionBadge from './LessonCompletionBadge';
import './LessonCompletionRewards.css';

type Props = {
  studentId?: string;
  progress: BadgeAnalyticsProgress;
};

const SHARE_PREVIEW_DURATION_MS = 1000;

const dataUrlToFile = (dataUrl: string, milestone: number) => {
  const [header, encoded] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = window.atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new File([bytes], `chimple-badge-${milestone}.png`, { type: mime });
};

const LessonCompletionRewards = ({ studentId, progress }: Props) => {
  const [shareMilestone, setShareMilestone] = useState<number | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const earnedBadges = Array.from(
    { length: Math.max(0, Math.floor(progress.latest_badge_milestone / 50)) },
    (_, index) => (index + 1) * 50,
  );
  const upcomingBadge =
    progress.latest_badge_milestone < 3000
      ? progress.latest_badge_milestone + 50
      : null;
  const displayedBadges =
    upcomingBadge === null ? earnedBadges : [...earnedBadges, upcomingBadge];
  const generatedBadges = useMemo(() => {
    const milestones = Array.from(
      {
        length: Math.max(0, Math.floor(progress.latest_badge_milestone / 50)),
      },
      (_, index) => (index + 1) * 50,
    );
    if (progress.latest_badge_milestone < 3000) {
      milestones.push(progress.latest_badge_milestone + 50);
    }
    return new Map(
      milestones.map((milestone) => [milestone, getGeneratedBadge(milestone)]),
    );
  }, [progress.latest_badge_milestone]);

  const openShare = (milestone: number) => {
    if (studentId) {
      void logBadgeEvent(
        EVENTS.REWARD_BADGE_SHARE_CLICKED,
        studentId,
        progress,
        {
          shared_milestone_number: milestone,
          source_location: 'rewards_page_tab',
        },
      );
    }
    setShareMilestone(milestone);
  };

  useEffect(() => {
    if (shareMilestone === null || !captureRef.current || !studentId) return;
    let active = true;
    const share = async () => {
      try {
        const dataUrl = await toPng(captureRef.current!, {
          cacheBust: true,
          pixelRatio: 2,
        });
        await Util.sendContentToAndroidOrWebShare(
          `${shareMilestone} lessons complete!`,
          'My Chimple Badge',
          undefined,
          [dataUrlToFile(dataUrl, shareMilestone)],
          { rethrowOnError: true },
        );
        void logBadgeEvent(
          EVENTS.REWARD_BADGE_SHARE_SUCCESS,
          studentId,
          progress,
          { shared_milestone_number: shareMilestone },
        );
      } catch (error) {
        void logBadgeEvent(
          EVENTS.REWARD_BADGE_SHARE_FAILED,
          studentId,
          progress,
          {
            shared_milestone_number: shareMilestone,
            error_message:
              error instanceof Error ? error.message : String(error),
          },
        );
      } finally {
        if (active) setShareMilestone(null);
      }
    };
    const shareTimer = window.setTimeout(
      () => void share(),
      SHARE_PREVIEW_DURATION_MS,
    );
    return () => {
      active = false;
      window.clearTimeout(shareTimer);
    };
  }, [progress, shareMilestone, studentId]);

  return (
    <section
      className="lesson-completion-rewards-root"
      aria-label="Lesson completion badges"
    >
      <div className="lesson-completion-rewards-grid">
        {displayedBadges.map((milestone) => {
          const isLocked = milestone === upcomingBadge;
          return (
            <article
              key={milestone}
              className={`lesson-completion-rewards-card${
                isLocked ? ' lesson-completion-rewards-card--locked' : ''
              }`}
            >
              <div className="lesson-completion-rewards-badge-art">
                <LessonCompletionBadge
                  number={milestone}
                  isLocked={isLocked}
                  generatedBadge={generatedBadges.get(milestone)}
                />
              </div>
              {!isLocked && (
                <button
                  type="button"
                  className="lesson-completion-rewards-share-button"
                  aria-label={`Share ${milestone} lesson badge`}
                  onClick={() => openShare(milestone)}
                >
                  <img src="/assets/icons/share button icon.svg" alt="" />
                </button>
              )}
            </article>
          );
        })}
      </div>

      {shareMilestone !== null && (
        <div
          className="lesson-completion-rewards-share-artwork"
          aria-hidden="true"
        >
          <SharedBadgeArtwork
            ref={captureRef}
            milestone={shareMilestone}
            heading={String(
              t('Congratulations!', { defaultValue: 'Congratulations!' }),
            )}
            completedText={String(
              t('{{count}} lessons complete!', {
                count: shareMilestone,
                defaultValue: `${shareMilestone} lessons complete!`,
              }),
            )}
            badge={
              <LessonCompletionBadge
                number={shareMilestone}
                isShared
                generatedBadge={generatedBadges.get(shareMilestone)}
              />
            }
          />
        </div>
      )}
    </section>
  );
};

export default LessonCompletionRewards;
