import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { t } from 'i18next';
import Badge from '../../common/Badges/Badge';
import sharedBadgeSvg from '../../assets/images/badges/Shared Badge.svg?raw';
import InlineSvg from '../InlineSvg';

type SharedBadgeArtworkProps = {
  milestone: number;
  heading: string;
  completedText: string;
  badge?: ReactNode;
};

const SharedBadgeArtwork = forwardRef<HTMLDivElement, SharedBadgeArtworkProps>(
  ({ milestone, heading, completedText, badge }, ref) => {
    const encouragement = t('Keep learning and exploring!', {
      defaultValue: 'Keep learning and exploring!',
    });

    return (
      <div ref={ref} className="BadgeCelebrationModal-share-card">
        <div className="BadgeCelebrationModal-badge-art">
          <InlineSvg ariaHidden svg={sharedBadgeSvg} />
          <svg
            className="BadgeCelebrationModal-copy-art"
            width="350"
            height="320"
            viewBox="0 0 350 320"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              width: '100%',
              height: '100%',
              overflow: 'visible',
              pointerEvents: 'none',
            }}
          >
            <text
              className="BadgeCelebrationModal-copy-heading"
              x="175"
              y="82.78"
              textAnchor="middle"
              fill="#182A4F"
              fontFamily="BalooRegular, sans-serif"
              fontSize="16"
              fontStyle="normal"
              fontWeight="600"
            >
              {heading}
            </text>
            <text
              className="BadgeCelebrationModal-copy-completed"
              x="175"
              y="212"
              textAnchor="middle"
              fill="#182A4F"
              fontFamily="BalooRegular, sans-serif"
              fontSize="13"
              fontStyle="normal"
              fontWeight="600"
              style={{ lineHeight: 'normal' }}
            >
              {completedText}
            </text>
            <line
              x1="85"
              y1="220"
              x2="265"
              y2="220"
              stroke="#DADADA"
              strokeWidth="0.554"
            />
            <text
              className="BadgeCelebrationModal-copy-encouragement"
              x="175"
              y="234"
              textAnchor="middle"
              fill="#182A4F"
              fontFamily="BalooRegular, sans-serif"
              fontSize="13"
              fontStyle="normal"
              fontWeight="600"
              style={{ lineHeight: 'normal' }}
            >
              {encouragement}
            </text>
            <line
              x1="90"
              y1="242"
              x2="260"
              y2="242"
              stroke="#DADADA"
              strokeWidth="0.554"
            />
          </svg>
          <div className="BadgeCelebrationModal-generated-badge">
            {badge ?? <Badge number={milestone} />}
          </div>
        </div>
      </div>
    );
  },
);

SharedBadgeArtwork.displayName = 'SharedBadgeArtwork';

export default SharedBadgeArtwork;
