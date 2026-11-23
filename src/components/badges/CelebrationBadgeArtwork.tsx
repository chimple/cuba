import { t } from 'i18next';
import Badge from '../../common/Badges/Badge';
import sharedBadgeSvg from '../../assets/images/badges/Shared Badge.svg?raw';
import InlineSvg from '../InlineSvg';

type CelebrationBadgeArtworkProps = {
  milestone: number;
  heading: string;
  completedText: string;
};

const CelebrationBadgeArtwork = ({
  milestone,
  heading,
  completedText,
}: CelebrationBadgeArtworkProps) => (
  <div className="BadgeCelebrationModal-celebration-art">
    <InlineSvg ariaHidden svg={sharedBadgeSvg} />
    <svg
      className="BadgeCelebrationModal-celebration-copy"
      width="350"
      height="320"
      viewBox="0 0 350 320"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <text x="175" y="82.78" textAnchor="middle">
        {heading}
      </text>
      <text x="175" y="212" textAnchor="middle">
        {completedText}
      </text>
      <line x1="85" y1="220" x2="265" y2="220" />
      <text x="175" y="234" textAnchor="middle">
        {t('Keep learning and exploring!', {
          defaultValue: 'Keep learning and exploring!',
        })}
      </text>
      <line x1="90" y1="242" x2="260" y2="242" />
    </svg>
    <div className="BadgeCelebrationModal-celebration-generated-badge">
      <Badge number={milestone} />
    </div>
  </div>
);

export default CelebrationBadgeArtwork;
