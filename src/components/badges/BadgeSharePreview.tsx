import { t } from 'i18next';
import type { RefObject } from 'react';
import SharedBadgeArtwork from './SharedBadgeArtwork';

type BadgeSharePreviewProps = {
  captureRef: RefObject<HTMLDivElement | null>;
  milestone: number;
  heading: string;
  completedText: string;
  onShare: () => void;
};

const BadgeSharePreview = ({
  captureRef,
  milestone,
  heading,
  completedText,
  onShare,
}: BadgeSharePreviewProps) => (
  <div
    className="BadgeCelebrationModal-share-preview-overlay"
    role="presentation"
  >
    <div
      className="BadgeCelebrationModal-share-preview-trigger"
      id="BadgeCelebrationModal-share-preview-trigger"
      role="button"
      tabIndex={0}
      aria-label={String(
        t('Share badge image', { defaultValue: 'Share badge image' }),
      )}
      onClick={onShare}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onShare();
        }
      }}
    >
      <SharedBadgeArtwork
        ref={captureRef}
        milestone={milestone}
        heading={heading}
        completedText={completedText}
      />
    </div>
  </div>
);

export default BadgeSharePreview;
