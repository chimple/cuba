import { memo, useState } from 'react';
import InlineSvg from '../../components/InlineSvg';
import { getGeneratedBadge } from './badgeGenerator';
import './Badges.css';

interface BadgeProps {
  number: number;
}

const Badge = memo(({ number }: BadgeProps) => {
  // Keep one random combination for this rendered badge while allowing each
  // child/profile to receive a fresh combination.
  const [badge] = useState(() => getGeneratedBadge(number));

  if (!badge) {
    return null;
  }

  return (
    <div className={`badges-item-${number}`} id={`badges-item-${number}`}>
      <InlineSvg
        ariaHidden
        className="badges-border"
        id={`badges-border-${number}`}
        svg={badge.borderSvg}
      />
      <InlineSvg
        ariaHidden
        className="badges-base"
        id={`badges-base-${number}`}
        svg={badge.baseSvg}
      />
      <InlineSvg
        ariaHidden
        className={badge.decorationClassName}
        id={`badges-decoration-${number}`}
        svg={badge.decorationSvg}
      />
      <div className="badges-icons" id={`badges-icons-${number}`}>
        {badge.iconSvgs.map((iconSvg, index) => (
          <InlineSvg
            ariaHidden
            className="badges-icon"
            id={`badges-icon-${number}-${index}`}
            key={`${badge.badgeNumber}-${index}`}
            svg={iconSvg}
          />
        ))}
      </div>
      <span className="badges-number" id={`badges-number-${number}`}>
        {badge.badgeNumber}
      </span>
    </div>
  );
});

export default Badge;
