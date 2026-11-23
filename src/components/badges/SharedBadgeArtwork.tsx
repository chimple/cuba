import { forwardRef } from 'react';
import type { ReactNode } from 'react';
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
  ({ milestone, heading: _heading, completedText, badge }, ref) => {
    return (
      <div ref={ref} className="BadgeCelebrationModal-share-card">
        <div className="BadgeCelebrationModal-badge-art">
          <InlineSvg ariaHidden svg={sharedBadgeSvg} />
          <svg
            className="BadgeCelebrationModal-copy-art"
            width="343"
            height="309"
            viewBox="0 0 343 309"
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
              className="BadgeCelebrationModal-copy-completed"
              x="171.5"
              y="190"
              textAnchor="middle"
              fill="#182A4F"
              fontFamily="Baloo 2, BalooRegular, sans-serif"
              fontSize="13"
              fontStyle="normal"
              fontWeight="600"
              style={{ lineHeight: 'normal' }}
            >
              {completedText}
            </text>
            <line
              x1="73.44"
              y1="199"
              x2="269.55"
              y2="199"
              stroke="#DADADA"
              strokeWidth="0.604"
            />
          </svg>
          <div className="BadgeCelebrationModal-generated-badge">
            {badge ?? <Badge number={milestone} />}
          </div>
          <img
            className="BadgeCelebrationModal-logo"
            src="assets/icons/chimpleLearningLogo.svg"
            alt="Chimple Learning"
          />
        </div>
      </div>
    );
  },
);

SharedBadgeArtwork.displayName = 'SharedBadgeArtwork';

export default SharedBadgeArtwork;
